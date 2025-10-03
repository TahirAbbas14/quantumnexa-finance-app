'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR, parsePKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Send, 
  DollarSign, 
  Calendar, 
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  description?: string;
  notes?: string;
  terms_conditions?: string;
  created_at: string;
  clients?: {
    name: string;
    email: string;
  };
  projects?: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Project {
  id: string;
  name: string;
  client_id?: string;
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }

  @media (max-width: 480px) {
    padding: 16px 12px;
  }
`;

const Header = styled.div`
  position: relative;
  background: linear-gradient(135deg, 
    rgba(220, 38, 38, 0.95) 0%,
    rgba(185, 28, 28, 0.9) 25%,
    rgba(153, 27, 27, 0.85) 50%,
    rgba(127, 29, 29, 0.9) 75%,
    rgba(220, 38, 38, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(220, 38, 38, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(255, 255, 255, 0.6) 20%,
      rgba(255, 255, 255, 0.9) 50%,
      rgba(255, 255, 255, 0.6) 80%,
      transparent 100%
    );
    animation: shimmer 3s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, 
      transparent 30%,
      rgba(255, 255, 255, 0.03) 50%,
      transparent 70%
    );
    pointer-events: none;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  @media (max-width: 768px) {
    padding: 24px;
    margin-bottom: 24px;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 2;
  
  h1 {
    font-size: 36px;
    font-weight: 800;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0.95) 50%,
      rgba(255, 255, 255, 0.9) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0.8) 0%,
        rgba(255, 255, 255, 0.4) 100%
      );
      border-radius: 2px;
    }
  }
  
  p {
    font-size: 18px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 28px;
    }
    
    p {
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      line-height: 1.4;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
`;

const StatCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 16px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    padding: 14px;
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    border-radius: 10px;

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const StatContent = styled.div`
  flex: 1;
  
  .label {
    font-size: 14px;
    color: var(--gray-600);
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--gray-800);
  }

  @media (max-width: 768px) {
    .label {
      font-size: 13px;
      margin-bottom: 3px;
    }
    
    .value {
      font-size: 20px;
    }
  }

  @media (max-width: 480px) {
    .label {
      font-size: 12px;
      margin-bottom: 2px;
    }
    
    .value {
      font-size: 18px;
    }
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px 16px 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(220, 38, 38, 0.6);
    box-shadow: 
      0 0 0 3px rgba(220, 38, 38, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.4);
    transform: translateY(-1px);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 400;
  }

  @media (max-width: 768px) {
    padding: 14px 18px 14px 44px;
    font-size: 15px;
    border-radius: 14px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px 12px 40px;
    font-size: 14px;
    border-radius: 12px;

    &:focus {
      transform: translateY(-0.5px);
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(220, 38, 38, 0.7);
    z-index: 2;
    transition: all 0.3s ease;
  }

  &:focus-within .search-icon {
    color: rgba(220, 38, 38, 0.9);
    transform: translateY(-50%) scale(1.1);
  }

  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const FilterSelect = styled.select`
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  min-width: 180px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(220, 38, 38, 0.6);
    box-shadow: 
      0 0 0 3px rgba(220, 38, 38, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.4);
    transform: translateY(-1px);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  option {
    background: rgba(30, 30, 30, 0.95);
    color: rgba(255, 255, 255, 0.9);
    padding: 12px;
    border: none;
  }

  @media (max-width: 768px) {
    padding: 14px 18px;
    font-size: 15px;
    border-radius: 14px;
    min-width: 160px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 12px;
    min-width: 100%;

    &:focus {
      transform: translateY(-0.5px);
    }
  }
`;

const InvoicesGrid = styled.div`
  display: grid;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 20px;
  }
`;

const InvoiceCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(220, 38, 38, 0.2);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      rgba(220, 38, 38, 0.8) 0%, 
      rgba(239, 68, 68, 0.8) 50%, 
      rgba(220, 38, 38, 0.8) 100%
    );
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(220, 38, 38, 0.05) 0%, 
      transparent 50%, 
      rgba(239, 68, 68, 0.05) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(220, 38, 38, 0.4);
    box-shadow: 
      0 16px 48px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(220, 38, 38, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::after {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;

    &:hover {
      transform: translateY(-2px);
    }
  }

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 14px;

    &:hover {
      transform: translateY(-1px);
    }
  }
`;

const InvoiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 12px;
  }
`;

const InvoiceInfo = styled.div`
  flex: 1;
  
  .invoice-number {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 4px;
  }
  
  .client-name {
    font-size: 14px;
    color: var(--gray-600);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  @media (max-width: 768px) {
    .invoice-number {
      font-size: 16px;
    }
    
    .client-name {
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .invoice-number {
      font-size: 15px;
      margin-bottom: 3px;
    }
    
    .client-name {
      font-size: 12px;
    }
  }
`;

const StatusBadge = styled.div<{ status: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: 4px;
  
  ${props => {
    switch (props.status) {
      case 'draft':
        return `
          background: var(--gray-100);
          color: var(--gray-700);
        `;
      case 'sent':
        return `
          background: var(--primary-100);
          color: var(--primary-700);
        `;
      case 'paid':
        return `
          background: var(--success-100);
          color: var(--success-700);
        `;
      case 'overdue':
        return `
          background: var(--error-100);
          color: var(--error-700);
        `;
      case 'cancelled':
        return `
          background: var(--error-100);
          color: var(--error-700);
        `;
      default:
        return `
          background: var(--gray-100);
          color: var(--gray-700);
        `;
    }
  }}

  @media (max-width: 768px) {
    padding: 5px 10px;
    font-size: 11px;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 10px;
    border-radius: 14px;
    gap: 3px;
  }
`;

const InvoiceDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--gray-600);
  
  svg {
    color: var(--gray-400);
  }

  @media (max-width: 768px) {
    gap: 6px;
    font-size: 13px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 480px) {
    gap: 5px;
    font-size: 12px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const AmountDisplay = styled.div`
  text-align: right;
  
  .amount {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: 4px;
  }
  
  .currency {
    font-size: 12px;
    color: var(--gray-500);
  }

  @media (max-width: 768px) {
    text-align: left;
    
    .amount {
      font-size: 18px;
      margin-bottom: 3px;
    }
    
    .currency {
      font-size: 11px;
    }
  }

  @media (max-width: 480px) {
    .amount {
      font-size: 16px;
      margin-bottom: 2px;
    }
    
    .currency {
      font-size: 10px;
    }
  }
`;

const InvoiceActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    padding-top: 12px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  @media (max-width: 480px) {
    padding-top: 10px;
    gap: 8px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: var(--gray-800);
  }
  
  &.primary:hover {
    background: var(--primary-100);
    color: var(--primary-600);
  }
  
  &.success:hover {
    background: var(--success-100);
    color: var(--success-600);
  }
  
  &.delete:hover {
    background: var(--error-100);
    color: var(--error-600);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    border-radius: 8px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    border-radius: 6px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  
  .icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 32px;
  }

  @media (max-width: 768px) {
    padding: 60px 16px;

    .icon {
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
      border-radius: 16px;

      svg {
        width: 28px;
        height: 28px;
      }
    }

    h3 {
      font-size: 18px;
      margin-bottom: 6px;
    }

    p {
      font-size: 15px;
      margin-bottom: 24px;
    }
  }

  @media (max-width: 480px) {
    padding: 40px 12px;

    .icon {
      width: 56px;
      height: 56px;
      margin-bottom: 16px;
      border-radius: 14px;

      svg {
        width: 24px;
        height: 24px;
      }
    }

    h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    p {
      font-size: 14px;
      margin-bottom: 20px;
      line-height: 1.4;
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--gray-800);
  }
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: var(--gray-800);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 16px;
  color: var(--gray-800);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &::placeholder {
    color: var(--gray-500);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 16px;
  color: var(--gray-800);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 16px;
  color: var(--gray-800);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &::placeholder {
    color: var(--gray-500);
  }
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background: var(--error-100);
  border: 1px solid var(--error-200);
  border-radius: 12px;
  color: var(--error-700);
  font-size: 14px;
`;

const TotalSummary = styled.div`
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-top: 16px;
  
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--gray-700);
    
    &.total {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-800);
      border-top: 1px solid rgba(255, 255, 255, 0.3);
      padding-top: 12px;
      margin-top: 12px;
      margin-bottom: 0;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AddInvoiceButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    transition: left 0.6s ease;
  }

  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.15) 100%
    );
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: scale(1.1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(12px);
    }
  }
`;

const EnhancedModalContent = styled.div`
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border: 2px solid rgba(220, 38, 38, 0.2);
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      rgba(220, 38, 38, 0.8) 0%, 
      rgba(239, 68, 68, 0.8) 50%, 
      rgba(220, 38, 38, 0.8) 100%
    );
    border-radius: 24px 24px 0 0;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const EnhancedModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, 
      rgba(220, 38, 38, 1) 0%,
      rgba(185, 28, 28, 0.9) 50%,
      rgba(153, 27, 27, 0.8) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, 
        rgba(220, 38, 38, 0.8) 0%,
        rgba(220, 38, 38, 0.4) 100%
      );
      border-radius: 1px;
    }
  }
`;

const EnhancedFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, 
      rgba(220, 38, 38, 0.9) 0%,
      rgba(185, 28, 28, 0.8) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 4px;
  }

  input, select, textarea {
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid rgba(220, 38, 38, 0.2);
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;
    color: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(220, 38, 38, 0.5);
      box-shadow: 
        0 0 0 3px rgba(220, 38, 38, 0.15),
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
      transform: translateY(-1px);
    }

    &:hover {
      border-color: rgba(220, 38, 38, 0.3);
      box-shadow: 
        0 3px 10px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    &::placeholder {
      color: rgba(30, 30, 30, 0.5);
      font-weight: 400;
    }
  }

  select {
    cursor: pointer;
    
    option {
      background: rgba(255, 255, 255, 0.95);
      color: rgba(30, 30, 30, 0.9);
      padding: 12px;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const supabase = createSupabaseClient();

  useEffect(() => {
    if (user) {
      console.log('User authenticated:', user.id);
      fetchInvoices();
      fetchClients();
      fetchProjects();
    } else {
      console.log('User not authenticated');
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone,
            address
          ),
          projects (
            id,
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Invoices list - Supabase response:', { data, error });
      console.log('Invoices list - Data length:', data?.length);
      console.log('Invoices list - Invoice IDs:', data?.map(invoice => ({ id: invoice.id, type: typeof invoice.id })));

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching clients');
      return;
    }

    try {
      console.log('Fetching clients for user:', user.id);
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching clients:', error);
        throw error;
      }
      console.log('Clients fetched successfully:', data?.length || 0, 'clients');
      console.log('Clients data:', data);
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching projects');
      return;
    }

    try {
      console.log('Fetching projects for user:', user.id);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients (name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching projects:', error);
        throw error;
      }
      console.log('Projects fetched successfully:', data?.length || 0, 'projects');
      console.log('Projects data:', data);
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} />;
      case 'sent': return <Send size={14} />;
      case 'paid': return <CheckCircle size={14} />;
      case 'overdue': return <AlertCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getTotalStats = () => {
    const total = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const paid = invoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const pending = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    return { total, paid, pending };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
           <HeaderContent>
             <h1>Invoices</h1>
             <p>Create and manage your invoices and track payments in PKR.</p>
           </HeaderContent>
           <AddInvoiceButton onClick={() => setShowAddForm(true)}>
             <Plus size={20} />
             Create Invoice
           </AddInvoiceButton>
         </Header>

        <StatsGrid>
          <StatCard variant="glass" padding="lg">
            <StatIcon color="linear-gradient(135deg, var(--primary-500), var(--primary-600))">
              <DollarSign size={24} />
            </StatIcon>
            <StatContent>
              <div className="label">Total Invoiced</div>
              <div className="value">{formatPKR(stats.total)}</div>
            </StatContent>
          </StatCard>
          
          <StatCard variant="glass" padding="lg">
            <StatIcon color="linear-gradient(135deg, var(--success-500), var(--success-600))">
              <CheckCircle size={24} />
            </StatIcon>
            <StatContent>
              <div className="label">Paid</div>
              <div className="value">{formatPKR(stats.paid)}</div>
            </StatContent>
          </StatCard>
          
          <StatCard variant="glass" padding="lg">
            <StatIcon color="linear-gradient(135deg, var(--warning-500), var(--warning-600))">
              <Clock size={24} />
            </StatIcon>
            <StatContent>
              <div className="label">Pending</div>
              <div className="value">{formatPKR(stats.pending)}</div>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <FiltersContainer>
          <SearchContainer>
            <Search className="search-icon" size={20} />
            <SearchInput
              type="text"
              placeholder="Search invoices by number, client, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </FilterSelect>
        </FiltersContainer>

        {filteredInvoices.length === 0 ? (
          <EmptyState>
            <div className="icon">
              <FileText size={40} />
            </div>
            <h3>
              {searchTerm || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
            </h3>
            <p>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.' 
                : 'Get started by creating your first invoice to track payments and manage billing.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
               <AddInvoiceButton onClick={() => setShowAddForm(true)}>
                 <Plus size={20} />
                 Create Your First Invoice
               </AddInvoiceButton>
             )}
          </EmptyState>
        ) : (
          <InvoicesGrid>
            {filteredInvoices.map((invoice) => (
              <InvoiceCard 
                key={invoice.id} 
                className="glass p-6"
                onClick={() => {
                  console.log('Navigating to invoice:', invoice.id, 'Type:', typeof invoice.id);
                  console.log('Full invoice object:', JSON.stringify(invoice, null, 2));
                  router.push(`/invoices/${invoice.id}`);
                }}
                style={{ cursor: 'pointer' }}
              >
                <InvoiceHeader>
                  <InvoiceInfo>
                    <div className="invoice-number">{invoice.invoice_number}</div>
                    <div className="client-name">
                      <User size={14} />
                      {invoice.clients?.name}
                    </div>
                  </InvoiceInfo>
                  <StatusBadge status={invoice.status}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </StatusBadge>
                </InvoiceHeader>

                <InvoiceDetails>
                  <DetailItem>
                    <Calendar size={16} />
                    Issue: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                  </DetailItem>
                  <DetailItem>
                    <Clock size={16} />
                    Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </DetailItem>
                  {invoice.projects && (
                    <DetailItem>
                      <FileText size={16} />
                      {invoice.projects.name}
                    </DetailItem>
                  )}
                  <AmountDisplay>
                    <div className="amount">{formatPKR(invoice.total_amount)}</div>
                    <div className="currency">{invoice.currency || 'PKR'}</div>
                  </AmountDisplay>
                </InvoiceDetails>

                {invoice.description && (
                  <DetailItem style={{ marginBottom: '16px' }}>
                    <FileText size={16} />
                    {invoice.description}
                  </DetailItem>
                )}

                <InvoiceActions>
                  <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
                    Invoice ID: {invoice.id.slice(0, 8)}...
                  </div>
                  <ActionButtons>
                    <ActionButton className="primary" title="View invoice">
                      <Eye size={16} />
                    </ActionButton>
                    <ActionButton className="primary" title="Download PDF">
                      <Download size={16} />
                    </ActionButton>
                    {invoice.status === 'draft' && (
                      <ActionButton className="success" title="Send invoice">
                        <Send size={16} />
                      </ActionButton>
                    )}
                    <ActionButton title="Edit invoice">
                      <Edit size={16} />
                    </ActionButton>
                    <ActionButton 
                      className="delete" 
                      title="Delete invoice"
                      onClick={() => deleteInvoice(invoice.id)}
                    >
                      <Trash2 size={16} />
                    </ActionButton>
                  </ActionButtons>
                </InvoiceActions>
              </InvoiceCard>
            ))}
          </InvoicesGrid>
        )}

        {showAddForm && (
          <AddInvoiceModal
            clients={clients}
            projects={projects}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchInvoices();
            }}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

function AddInvoiceModal({ 
  clients, 
  projects,
  onClose, 
  onSuccess 
}: { 
  clients: Client[];
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  console.log('AddInvoiceModal - Clients received:', clients);
  console.log('AddInvoiceModal - Projects received:', projects);
  
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    amount: '',
    tax_amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    notes: '',
    terms_conditions: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const clientProjects = projects.filter(p => p.client_id === formData.client_id);
  console.log('AddInvoiceModal - Filtered client projects:', clientProjects);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amount = parsePKR(formData.amount);
      const taxAmount = formData.tax_amount ? parsePKR(formData.tax_amount) : 0;
      const totalAmount = amount + taxAmount;

      const invoiceData = {
        invoice_number: generateInvoiceNumber(),
        client_id: formData.client_id,
        project_id: formData.project_id || null,
        amount,
        tax_amount: taxAmount || null,
        total_amount: totalAmount,
        currency: 'PKR',
        status: formData.status,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        description: formData.description || null,
        notes: formData.notes || null,
        terms_conditions: formData.terms_conditions || null,
        user_id: user?.id
      };

      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('invoices')
        .insert([invoiceData]);

      if (error) throw error;
      onSuccess();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const amount = parsePKR(formData.amount) || 0;
    const taxAmount = parsePKR(formData.tax_amount) || 0;
    return amount + taxAmount;
  };

  return (
     <ModalOverlay onClick={onClose}>
       <EnhancedModalContent onClick={(e) => e.stopPropagation()}>
         <EnhancedModalHeader>
           <h2>Create New Invoice</h2>
           <CloseButton onClick={onClose}>
             <X size={20} />
           </CloseButton>
         </EnhancedModalHeader>

         {error && (
           <ErrorMessage>
             {error}
           </ErrorMessage>
         )}

         <Form onSubmit={handleSubmit}>
           <EnhancedFormGroup>
             <Label>Client *</Label>
             <Select
               required
               value={formData.client_id}
               onChange={(e) => setFormData({ ...formData, client_id: e.target.value, project_id: '' })}
             >
               <option value="">Select a client</option>
               {clients.map((client) => (
                 <option key={client.id} value={client.id}>
                   {client.name}
                 </option>
               ))}
             </Select>
           </EnhancedFormGroup>
           
           <EnhancedFormGroup>
             <Label>Project (Optional)</Label>
             <Select
               value={formData.project_id}
               onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
               disabled={!formData.client_id}
             >
               <option value="">Select a project</option>
               {clientProjects.map((project) => (
                 <option key={project.id} value={project.id}>
                   {project.name}
                 </option>
               ))}
             </Select>
           </EnhancedFormGroup>
           
           <FormRow>
             <EnhancedFormGroup>
               <Label>Amount (PKR) *</Label>
               <Input
                 type="number"
                 step="0.01"
                 required
                 placeholder="0.00"
                 value={formData.amount}
                 onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
               />
             </EnhancedFormGroup>
             
             <EnhancedFormGroup>
               <Label>Tax Amount (PKR)</Label>
               <Input
                 type="number"
                 step="0.01"
                 placeholder="0.00"
                 value={formData.tax_amount}
                 onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
               />
             </EnhancedFormGroup>
           </FormRow>
           
           <FormRow>
             <EnhancedFormGroup>
               <Label>Issue Date *</Label>
               <Input
                 type="date"
                 required
                 value={formData.issue_date}
                 onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
               />
             </EnhancedFormGroup>
             
             <EnhancedFormGroup>
               <Label>Due Date *</Label>
               <Input
                 type="date"
                 required
                 value={formData.due_date}
                 onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
               />
             </EnhancedFormGroup>
           </FormRow>
           
           <EnhancedFormGroup>
             <Label>Description</Label>
             <TextArea
               placeholder="Invoice description or services provided..."
               value={formData.description}
               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
             />
           </EnhancedFormGroup>

           <EnhancedFormGroup>
             <Label>Notes</Label>
             <TextArea
               placeholder="Internal notes (not visible to client)..."
               value={formData.notes}
               onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
             />
           </EnhancedFormGroup>

           <EnhancedFormGroup>
             <Label>Terms & Conditions</Label>
             <TextArea
               placeholder="Payment terms and conditions..."
               value={formData.terms_conditions}
               onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
             />
           </EnhancedFormGroup>

           {(formData.amount || formData.tax_amount) && (
             <TotalSummary>
               <div className="row">
                 <span>Subtotal:</span>
                 <span>{formatPKR(parsePKR(formData.amount) || 0)}</span>
               </div>
               {formData.tax_amount && (
                 <div className="row">
                   <span>Tax:</span>
                   <span>{formatPKR(parsePKR(formData.tax_amount))}</span>
                 </div>
               )}
               <div className="row total">
                 <span>Total:</span>
                 <span>{formatPKR(calculateTotal())}</span>
               </div>
             </TotalSummary>
           )}

           <ModalActions>
             <Button 
               type="button" 
               variant="outline" 
               onClick={onClose}
             >
               Cancel
             </Button>
             <Button 
               type="submit" 
               variant="primary" 
               loading={loading}
             >
               Create Invoice
             </Button>
           </ModalActions>
         </Form>
       </EnhancedModalContent>
     </ModalOverlay>
   );
}