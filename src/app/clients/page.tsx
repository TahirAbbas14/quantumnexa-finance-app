'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  Calendar,
  Users,
  UserPlus,
  X,
  User,
  AtSign,
  Briefcase,
  Home,
  Download,
  CheckCircle,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: 'active' | 'closed';
  created_at: string;
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.6) 50%, 
      transparent 100%
    );
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.03) 0%, transparent 50%, rgba(220, 38, 38, 0.03) 100%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
    padding: 24px;
    margin-bottom: 24px;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 12px;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;

  h1 {
    font-size: 36px;
    font-weight: 800;
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 16px;

    &::before {
      content: '';
      width: 6px;
      height: 36px;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      border-radius: 3px;
      box-shadow: 
        0 0 15px rgba(220, 38, 38, 0.4),
        0 0 30px rgba(220, 38, 38, 0.2);
    }

    @media (max-width: 768px) {
      font-size: 28px;
      gap: 12px;

      &::before {
        width: 4px;
        height: 28px;
      }
    }

    @media (max-width: 480px) {
      font-size: 24px;
      gap: 8px;

      &::before {
        width: 3px;
        height: 24px;
      }
    }
  }
  
  p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400;
    line-height: 1.6;
    max-width: 500px;

    @media (max-width: 768px) {
      font-size: 16px;
      max-width: none;
    }

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
`;

const HeaderActions = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const StyledAddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 25px rgba(220, 38, 38, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.2);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(220, 38, 38, 1) 0%, rgba(239, 68, 68, 1) 100%);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 
      0 15px 35px rgba(220, 38, 38, 0.4),
      0 0 0 1px rgba(220, 38, 38, 0.3);

    &::before {
      opacity: 1;
    }

    svg {
      transform: rotate(90deg) scale(1.1);
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.01);
  }

  svg {
    transition: transform 0.3s ease;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    margin-bottom: 16px;
  }
  
  .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(220, 38, 38, 0.6);
    z-index: 2;
    transition: color 0.3s ease;

    @media (max-width: 480px) {
      left: 16px;
    }
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 20px 24px 20px 56px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 20px;
  font-size: 16px;
  color: #ffffff;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;

  @media (max-width: 768px) {
    padding: 16px 20px 16px 48px;
    border-radius: 16px;
    font-size: 15px;
  }

  @media (max-width: 480px) {
    padding: 14px 16px 14px 44px;
    border-radius: 12px;
    font-size: 14px;
  }
  
  &:focus {
    outline: none;
    background: linear-gradient(135deg, rgba(25, 25, 25, 0.95) 0%, rgba(35, 35, 35, 0.95) 100%);
    border-color: #dc2626;
    box-shadow: 
      0 0 0 3px rgba(220, 38, 38, 0.1),
      0 12px 35px rgba(220, 38, 38, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);

    ~ .search-icon {
      color: #dc2626;
      transform: translateY(-50%) scale(1.1);
    }

    @media (max-width: 480px) {
      transform: translateY(-1px);
    }
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(22, 22, 22, 0.9) 0%, rgba(32, 32, 32, 0.9) 100%);
    transform: translateY(-1px);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(220, 38, 38, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    ~ .search-icon {
      color: rgba(220, 38, 38, 0.8);
    }

    @media (max-width: 480px) {
      transform: none;
    }
  }
`;

const ClientsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 28px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    gap: 16px;
    margin-bottom: 16px;
  }
`;

const ClientCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 20px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.4) 50%, 
      transparent 100%
    );
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.02) 0%, transparent 50%, rgba(220, 38, 38, 0.02) 100%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(220, 38, 38, 0.3);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(220, 38, 38, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);

    &::after {
      opacity: 1;
    }

    .client-avatar {
      transform: scale(1.1);
      box-shadow: 
        0 8px 25px rgba(220, 38, 38, 0.3),
        0 0 20px rgba(220, 38, 38, 0.2);
    }

    .action-button {
      transform: scale(1.1);
      background: rgba(220, 38, 38, 0.2);
      border-color: rgba(220, 38, 38, 0.4);
    }

    @media (max-width: 480px) {
      transform: translateY(-2px) scale(1.01);
    }
  }

  &:active {
    transform: translateY(-4px) scale(1.01);

    @media (max-width: 480px) {
      transform: translateY(-1px) scale(1.005);
    }
  }
`;

const ClientHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 480px) {
    gap: 16px;
    margin-bottom: 16px;
  }
`;

const ClientAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  box-shadow: 
    0 8px 20px rgba(220, 38, 38, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    font-size: 20px;
    border-radius: 14px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    pointer-events: none;

    @media (max-width: 480px) {
      border-radius: 12px;
    }
  }
`;

const ClientInfo = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 6px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    @media (max-width: 480px) {
      font-size: 18px;
      margin-bottom: 4px;
    }
  }
  
  .company {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    @media (max-width: 480px) {
      font-size: 13px;
      gap: 4px;
    }

    svg {
      color: rgba(220, 38, 38, 0.8);

      @media (max-width: 480px) {
        width: 14px;
        height: 14px;
      }
    }
  }
`;

const ClientDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 0;
  
  svg {
    color: rgba(220, 38, 38, 0.7);
    flex-shrink: 0;
  }

  &:hover {
    color: rgba(255, 255, 255, 0.9);

    svg {
      color: rgba(220, 38, 38, 0.9);
    }
  }
`;

const ClientActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(220, 38, 38, 0.1);
  position: relative;
  z-index: 1;
`;

const ClientId = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  font-family: 'Courier New', monospace;
  background: rgba(220, 38, 38, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(220, 38, 38, 0.2);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.1);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    color: #ffffff;
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba(220, 38, 38, 0.2);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(1.05);
  }

  &.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
  }

  svg {
    position: relative;
    z-index: 1;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  margin: 40px 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.4) 50%, 
      transparent 100%
    );
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.02) 0%, transparent 50%, rgba(220, 38, 38, 0.02) 100%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const EmptyStateIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  box-shadow: 
    0 20px 40px rgba(220, 38, 38, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  animation: float 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 21px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    pointer-events: none;
  }

  svg {
    color: white;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
  }
`;

const EmptyStateContent = styled.div`
  max-width: 480px;
  position: relative;
  z-index: 1;

  h3 {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 16px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin-bottom: 32px;
    font-weight: 400;
  }

  @media (max-width: 768px) {
    h3 {
      font-size: 24px;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      margin-bottom: 24px;
    }
  }
`;

const EmptyStateButton = styled.button`
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  padding: 16px 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  box-shadow: 
    0 8px 20px rgba(220, 38, 38, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 15px 30px rgba(220, 38, 38, 0.4),
      0 0 0 1px rgba(220, 38, 38, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    border-color: rgba(220, 38, 38, 0.4);

    &::before {
      opacity: 1;
    }

    svg {
      transform: scale(1.1);
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }

  svg {
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 14px 24px;
    gap: 8px;
  }
`;

// Modal Components
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
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.4) 50%, 
      transparent 100%
    );
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.1);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    color: #ffffff;
    transform: scale(1.1);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: rgba(220, 38, 38, 0.8);
  }
`;

const InputWrapper = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(220, 38, 38, 0.6);
    z-index: 1;
    pointer-events: none;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 48px 16px 20px;
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  font-size: 16px;
  color: #ffffff;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: #dc2626;
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(22, 22, 22, 0.9) 0%, rgba(32, 32, 32, 0.9) 100%);
    transform: translateY(-1px);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(220, 38, 38, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    ~ .search-icon {
      color: rgba(220, 38, 38, 0.8);
    }
  }
`;

const TextAreaWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  
  svg {
    position: absolute;
    right: 16px;
    top: 16px;
    color: rgba(220, 38, 38, 0.6);
    z-index: 1;
    pointer-events: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 16px 48px 16px 20px;
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  font-size: 16px;
  color: #ffffff;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #dc2626;
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ErrorMessage = styled.div`
  padding: 16px 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Select = styled.select`
  width: 100%;
  padding: 16px 48px 16px 20px;
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  font-size: 16px;
  color: #ffffff;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #dc2626;
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  option {
    background: rgba(30, 30, 30, 0.95);
    color: #ffffff;
    padding: 8px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;

  svg {
    color: rgba(220, 38, 38, 0.8);
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.active ? '#dc2626' : 'rgba(220, 38, 38, 0.2)'};
  background: ${props => props.active 
    ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)'
    : 'rgba(30, 30, 30, 0.5)'};
  color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(220, 38, 38, 0.4);
    background: ${props => props.active 
      ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%)'
      : 'rgba(220, 38, 38, 0.1)'};
    color: #ffffff;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const StatusBadge = styled.div<{ status: 'active' | 'closed' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  ${props => props.status === 'active' 
    ? `
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
    `
    : `
      background: linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(107, 114, 128, 0.2) 100%);
      border: 1px solid rgba(156, 163, 175, 0.3);
      color: #9ca3af;
      box-shadow: 0 2px 8px rgba(156, 163, 175, 0.2);
    `
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export default function ClientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const exportToCSV = () => {
    if (filteredClients.length === 0) {
      alert('No clients to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Address', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(client => [
        `"${client.name}"`,
        `"${client.email}"`,
        `"${client.phone || ''}"`,
        `"${client.company || ''}"`,
        `"${client.address || ''}"`,
        `"${format(new Date(client.created_at), 'MMM dd, yyyy')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = useCallback(async () => {
    try {
      // supabase client is already declared above; reuse it instead of re-declaring
      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client could not be initialized');
      }
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      
      setClients(clients.filter(client => client.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div>Loading...</div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderContent>
            <h1>Clients</h1>
            <p>Manage your client relationships and contact information</p>
          </HeaderContent>
          <HeaderActions>
            <Button 
              variant="outline" 
              size="md"
              onClick={exportToCSV}
              style={{ marginRight: '16px' }}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <StyledAddButton onClick={() => setShowAddModal(true)}>
              <Plus size={20} />
              Add Client
            </StyledAddButton>
          </HeaderActions>
        </Header>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={20} className="search-icon" />
        </SearchContainer>

        <FilterContainer>
          <FilterLabel>
            <Filter size={16} />
            Filter by Status:
          </FilterLabel>
          <FilterButtons>
            <FilterButton 
              active={statusFilter === 'all'} 
              onClick={() => setStatusFilter('all')}
            >
              All Clients
            </FilterButton>
            <FilterButton 
              active={statusFilter === 'active'} 
              onClick={() => setStatusFilter('active')}
            >
              Active
            </FilterButton>
            <FilterButton 
              active={statusFilter === 'closed'} 
              onClick={() => setStatusFilter('closed')}
            >
              Closed
            </FilterButton>
          </FilterButtons>
        </FilterContainer>

        {filteredClients.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <Users size={60} />
              </EmptyStateIcon>
              <EmptyStateContent>
                <h3>No clients found</h3>
                <p>
                  {searchTerm 
                    ? `No clients match your search for "${searchTerm}". Try adjusting your search terms or add a new client.`
                    : "You haven't added any clients yet. Start building your client base by adding your first client."
                  }
                </p>
                <EmptyStateButton onClick={() => setShowAddModal(true)}>
                  <UserPlus size={20} />
                  Add Your First Client
                </EmptyStateButton>
              </EmptyStateContent>
            </EmptyState>
          ) : (

          <ClientsGrid>
            {filteredClients.map((client) => (
              <ClientCard 
                key={client.id} 
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <ClientHeader>
                  <ClientAvatar className="client-avatar">
                    {client.name.charAt(0).toUpperCase()}
                  </ClientAvatar>
                  <ClientInfo>
                    <h3>{client.name}</h3>
                    {client.company && (
                      <div className="company">
                        <Building size={14} />
                        {client.company}
                      </div>
                    )}
                  </ClientInfo>
                  <StatusBadge status={client.status}>
                    <CheckCircle size={12} />
                    {client.status}
                  </StatusBadge>
                </ClientHeader>

                <ClientDetails>
                  <DetailItem>
                    <Mail size={16} />
                    {client.email}
                  </DetailItem>
                  {client.phone && (
                    <DetailItem>
                      <Phone size={16} />
                      {client.phone}
                    </DetailItem>
                  )}
                  {client.address && (
                    <DetailItem>
                      <MapPin size={16} />
                      {client.address}
                    </DetailItem>
                  )}
                  <DetailItem>
                    <Calendar size={16} />
                    Added {format(new Date(client.created_at), 'MMM d, yyyy')}
                  </DetailItem>
                </ClientDetails>

                <ClientActions>
                  <ClientId>
                    ID: {client.id.slice(0, 8)}...
                  </ClientId>
                  <ActionButtons>
                    <ActionButton 
                      className="action-button"
                      title="Edit client"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(client);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit size={16} />
                    </ActionButton>
                    <ActionButton 
                      className="action-button delete"
                      title="Delete client"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClient(client.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </ActionButton>
                  </ActionButtons>
                </ClientActions>
              </ClientCard>
            ))}
          </ClientsGrid>
        )}

        {showAddModal && (
          <AddClientModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchClients();
            }}
          />
        )}
        {showEditModal && editingClient && (
          <EditClientModal
            client={editingClient}
            onClose={() => {
              setShowEditModal(false);
              setEditingClient(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingClient(null);
              fetchClients();
            }}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

function EditClientModal({ client, onClose, onSuccess }: { client: Client; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    company: client.company || '',
    address: client.address || '',
    status: client.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user?.id) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      console.log('Updating client data:', { ...formData, id: client.id });
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', client.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Client updated successfully');
      onSuccess();
    } catch (error: unknown) {
      console.error('Error updating client:', error);
      setError(error instanceof Error ? error.message : 'Failed to update client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Edit Client</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <User size={16} />
              Name *
            </Label>
            <InputWrapper>
              <Input
                type="text"
                required
                placeholder="Enter client name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <User size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <AtSign size={16} />
              Email *
            </Label>
            <InputWrapper>
              <Input
                type="email"
                required
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Mail size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Phone size={16} />
              Phone
            </Label>
            <InputWrapper>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Phone size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Briefcase size={16} />
              Company
            </Label>
            <InputWrapper>
              <Input
                type="text"
                placeholder="Enter company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
              <Building size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Home size={16} />
              Address
            </Label>
            <TextAreaWrapper>
              <TextArea
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <MapPin size={16} />
            </TextAreaWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <CheckCircle size={16} />
              Status *
            </Label>
            <InputWrapper>
              <Select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'closed' })}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </Select>
              <CheckCircle size={16} />
            </InputWrapper>
          </FormGroup>

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
              Update Client
            </Button>
          </ModalActions>
        </Form>
      </ModalContent>
    </Modal>
  );
}

function AddClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'active' as 'active' | 'closed'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user?.id) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting client data:', { ...formData, user_id: user.id });
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { error } = await supabase
        .from('clients')
        .insert([
          {
            ...formData,
            user_id: user?.id
          }
        ]);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Client added successfully');
      onSuccess();
    } catch (error: unknown) {
      console.error('Error adding client:', error);
      setError(error instanceof Error ? error.message : 'Failed to add client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Add New Client</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <User size={16} />
              Name *
            </Label>
            <InputWrapper>
              <Input
                type="text"
                required
                placeholder="Enter client name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <User size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <AtSign size={16} />
              Email *
            </Label>
            <InputWrapper>
              <Input
                type="email"
                required
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Mail size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Phone size={16} />
              Phone
            </Label>
            <InputWrapper>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Phone size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Briefcase size={16} />
              Company
            </Label>
            <InputWrapper>
              <Input
                type="text"
                placeholder="Enter company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
              <Building size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Home size={16} />
              Address
            </Label>
            <TextAreaWrapper>
              <TextArea
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <MapPin size={16} />
            </TextAreaWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <CheckCircle size={16} />
              Status *
            </Label>
            <InputWrapper>
              <Select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'closed' })}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </Select>
              <CheckCircle size={16} />
            </InputWrapper>
          </FormGroup>

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
              Add Client
            </Button>
          </ModalActions>
        </Form>
      </ModalContent>
    </Modal>
  );
}