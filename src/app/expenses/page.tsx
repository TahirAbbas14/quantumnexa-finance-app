'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText,
  Filter,
  X,
  Receipt,
  TrendingUp,
  CreditCard,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { formatPKR } from '@/lib/currency';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
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

  @media (max-width: 480px) {
    gap: 12px;
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

  @media (max-width: 768px) {
    padding: 14px 24px;
    font-size: 15px;
    gap: 10px;
    border-radius: 14px;
  }

  @media (max-width: 480px) {
    padding: 12px 20px;
    font-size: 14px;
    gap: 8px;
    border-radius: 12px;
  }

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

    @media (max-width: 480px) {
      transform: translateY(-1px) scale(1.01);
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.01);

    @media (max-width: 480px) {
      transform: translateY(0) scale(1.005);
    }
  }

  svg {
    transition: transform 0.3s ease;

    @media (max-width: 480px) {
      width: 18px;
      height: 18px;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 16px;
  }
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 20px;
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
    transform: translateY(-4px) scale(1.02);
    border-color: rgba(220, 38, 38, 0.3);
    box-shadow: 
      0 15px 35px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(220, 38, 38, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);

    &::after {
      opacity: 1;
    }

    .stat-icon {
      transform: scale(1.1);
      box-shadow: 
        0 8px 25px rgba(220, 38, 38, 0.3),
        0 0 20px rgba(220, 38, 38, 0.2);
    }

    @media (max-width: 480px) {
      transform: translateY(-2px) scale(1.01);
    }
  }
`;

const StatIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  box-shadow: 
    0 8px 20px rgba(220, 38, 38, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    pointer-events: none;

    @media (max-width: 768px) {
      border-radius: 12px;
    }

    @media (max-width: 480px) {
      border-radius: 10px;
    }
  }

  svg {
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));

    @media (max-width: 768px) {
      width: 20px;
      height: 20px;
    }

    @media (max-width: 480px) {
      width: 18px;
      height: 18px;
    }
  }
`;

const StatContent = styled.div`
  position: relative;
  z-index: 1;

  h3 {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 8px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 6px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
      margin-bottom: 4px;
    }
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      letter-spacing: 0.3px;
    }
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
  
  .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(220, 38, 38, 0.6);
    z-index: 2;
    transition: color 0.3s ease;
  }

  @media (max-width: 768px) {
    min-width: unset;
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
    font-size: 15px;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 14px 16px 14px 44px;
    font-size: 14px;
    border-radius: 12px;
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
  }
`;

const FilterSelect = styled.select`
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  font-size: 16px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23dc2626' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 16px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 48px;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #dc2626;
    background: linear-gradient(135deg, rgba(25, 25, 25, 0.95) 0%, rgba(35, 35, 35, 0.95) 100%);
    box-shadow: 
      0 0 0 3px rgba(220, 38, 38, 0.1),
      0 12px 35px rgba(220, 38, 38, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(22, 22, 22, 0.9) 0%, rgba(32, 32, 32, 0.9) 100%);
    transform: translateY(-1px);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(220, 38, 38, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  option {
    background: rgba(30, 30, 30, 0.95);
    color: #ffffff;
    padding: 12px;
  }
`;

const ExpensesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    gap: 6px;
    margin-bottom: 16px;
  }
`;

const ExpenseCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(220, 38, 38, 0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 70px;

  @media (max-width: 768px) {
    padding: 14px 16px;
    border-radius: 10px;
    min-height: 60px;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    border-radius: 8px;
    min-height: 50px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
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
    transform: translateY(-2px) scale(1.01);
    border-color: rgba(220, 38, 38, 0.3);
    box-shadow: 
      0 8px 20px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(220, 38, 38, 0.2);

    &::after {
      opacity: 1;
    }

    .expense-icon {
      transform: scale(1.1);
      box-shadow: 
        0 4px 12px rgba(220, 38, 38, 0.3),
        0 0 10px rgba(220, 38, 38, 0.2);
    }

    .action-button {
      transform: scale(1.1);
      background: rgba(220, 38, 38, 0.2);
      border-color: rgba(220, 38, 38, 0.4);
    }

    @media (max-width: 480px) {
      transform: translateY(-1px) scale(1.005);
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.005);

    @media (max-width: 480px) {
      transform: translateY(0) scale(1.002);
    }
  }
`;

const ExpenseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const ExpenseIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 
    0 8px 20px rgba(220, 38, 38, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    pointer-events: none;

    @media (max-width: 768px) {
      border-radius: 12px;
    }

    @media (max-width: 480px) {
      border-radius: 10px;
    }
  }

  svg {
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));

    @media (max-width: 768px) {
      width: 20px;
      height: 20px;
    }

    @media (max-width: 480px) {
      width: 18px;
      height: 18px;
    }
  }
`;

const ExpenseInfo = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 6px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    @media (max-width: 768px) {
      font-size: 18px;
      margin-bottom: 4px;
    }

    @media (max-width: 480px) {
      font-size: 16px;
      margin-bottom: 3px;
    }
  }
  
  .category {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    @media (max-width: 768px) {
      font-size: 13px;
      gap: 4px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      gap: 3px;
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

const ExpenseDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 12px;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 0;

  @media (max-width: 768px) {
    gap: 10px;
    font-size: 13px;
    padding: 6px 0;
  }

  @media (max-width: 480px) {
    gap: 8px;
    font-size: 12px;
    padding: 4px 0;
  }
  
  svg {
    color: rgba(220, 38, 38, 0.7);
    flex-shrink: 0;

    @media (max-width: 480px) {
      width: 14px;
      height: 14px;
    }
  }

  &:hover {
    color: rgba(255, 255, 255, 0.9);

    svg {
      color: rgba(220, 38, 38, 0.9);
    }
  }
`;

const AmountDisplay = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 20px;
    gap: 6px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    gap: 4px;
  }

  svg {
    color: rgba(220, 38, 38, 0.8);

    @media (max-width: 480px) {
      width: 16px;
      height: 16px;
    }
  }
`;

const ExpenseActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(220, 38, 38, 0.1);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding-top: 16px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  @media (max-width: 480px) {
    padding-top: 12px;
    gap: 8px;
  }
`;

const ExpenseId = styled.div`
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

  @media (max-width: 768px) {
    justify-content: center;
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
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

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

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

    @media (max-width: 480px) {
      transform: scale(1.05);
    }

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(1.05);

    @media (max-width: 480px) {
      transform: scale(1.02);
    }
  }

  &.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
  }

  svg {
    position: relative;
    z-index: 1;

    @media (max-width: 480px) {
      width: 16px;
      height: 16px;
    }
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
  }
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
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23dc2626' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 16px center;
  background-repeat: no-repeat;
  background-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #dc2626;
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  option {
    background: rgba(30, 30, 30, 0.95);
    color: #ffffff;
    padding: 12px;
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(220, 38, 38, 0.2);
  border-top: 3px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState('');

  const categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];

  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Past 3 Months' },
    { value: 'last-6-months', label: 'Past 6 Months' },
    { value: 'last-year', label: 'Past Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'last-week':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return { start: lastWeek, end: today };
      
      case 'last-month':
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return { start: lastMonth, end: today };
      
      case 'last-3-months':
        const last3Months = new Date(today);
        last3Months.setMonth(today.getMonth() - 3);
        return { start: last3Months, end: today };
      
      case 'last-6-months':
        const last6Months = new Date(today);
        last6Months.setMonth(today.getMonth() - 6);
        return { start: last6Months, end: today };
      
      case 'last-year':
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        return { start: lastYear, end: today };
      
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate)
          };
        }
        return null;
      
      default:
        return null;
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      if (!supabase) {
        console.error('Failed to create Supabase client');
        setError('Database connection failed');
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id);

      // Apply date filtering at the database level for better performance
      const dateRange = getDateRange();
      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Apply date filtering to expenses for summary calculations
  const dateFilteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const dateRange = getDateRange();
    
    if (dateRange?.start && dateRange?.end) {
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    }
    return true;
  });

  const totalExpenses = dateFilteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = dateFilteredExpenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const currentDate = new Date();
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  const handleDeleteExpense = async (id: string) => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderContent>
            <h1>Expense Management</h1>
            <p>Track and manage your expenses efficiently with detailed insights and analytics.</p>
          </HeaderContent>
          <HeaderActions>
            <StyledAddButton onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Add Expense
            </StyledAddButton>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon className="stat-icon">
              <Wallet size={24} />
            </StatIcon>
            <StatContent>
              <h3>{formatPKR(totalExpenses)}</h3>
              <p>Total Expenses</p>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon className="stat-icon">
              <TrendingUp size={24} />
            </StatIcon>
            <StatContent>
              <h3>{formatPKR(monthlyExpenses)}</h3>
              <p>This Month</p>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon className="stat-icon">
              <Receipt size={24} />
            </StatIcon>
            <StatContent>
              <h3>{expenses.length}</h3>
              <p>Total Records</p>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon className="stat-icon">
              <CreditCard size={24} />
            </StatIcon>
            <StatContent>
              <h3>{expenses.length > 0 ? formatPKR(totalExpenses / expenses.length) : formatPKR(0)}</h3>
              <p>Average Amount</p>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <FiltersContainer>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="search-icon" />
          </SearchContainer>
          <FilterSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FilterSelect>
          {dateFilter === 'custom' && (
            <>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Start Date"
                style={{ width: '150px', padding: '16px 20px' }}
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="End Date"
                style={{ width: '150px', padding: '16px 20px' }}
              />
            </>
          )}
        </FiltersContainer>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {filteredExpenses.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <Receipt size={48} />
            </EmptyStateIcon>
            <EmptyStateContent>
              <h3>No Expenses Found</h3>
              <p>Start tracking your expenses by adding your first expense record. Keep your finances organized and under control.</p>
              <EmptyStateButton onClick={() => setShowModal(true)}>
                <Plus size={20} />
                Add Your First Expense
              </EmptyStateButton>
            </EmptyStateContent>
          </EmptyState>
        ) : (
          <ExpensesGrid>
            {filteredExpenses.map((expense) => (
              <ExpenseCard key={expense.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <ExpenseIcon className="expense-icon">
                    <Receipt size={20} />
                  </ExpenseIcon>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                      {expense.description}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888' }}>
                      <Tag size={12} />
                      {expense.category}
                      <span style={{ margin: '0 4px' }}>•</span>
                      <Calendar size={12} />
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                    {formatPKR(expense.amount)}
                  </div>
                  <ActionButtons>
                    <ActionButton 
                      className="action-button"
                      onClick={() => handleEditExpense(expense)}
                    >
                      <Edit size={14} />
                    </ActionButton>
                    <ActionButton 
                      className="action-button delete"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 size={14} />
                    </ActionButton>
                  </ActionButtons>
                </div>
              </ExpenseCard>
            ))}
          </ExpensesGrid>
        )}

        {showModal && (
          <AddExpenseModal 
            onClose={() => setShowModal(false)} 
            onSuccess={() => {
              setShowModal(false);
              fetchExpenses();
            }} 
          />
        )}

        {showEditModal && editingExpense && (
          <EditExpenseModal 
            expense={editingExpense}
            onClose={() => {
              setShowEditModal(false);
              setEditingExpense(null);
            }} 
            onSuccess={() => {
              setShowEditModal(false);
              setEditingExpense(null);
              fetchExpenses();
            }} 
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

function AddExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddExpenseModal - Form submitted');
    console.log('AddExpenseModal - User:', user);
    console.log('AddExpenseModal - Form data:', formData);
    
    if (!user) {
      console.error('AddExpenseModal - No user found');
      setError('You must be logged in to add expenses');
      return;
    }

    // Validate form data
    if (!formData.description.trim()) {
      console.error('AddExpenseModal - Description is required');
      setError('Description is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      console.error('AddExpenseModal - Valid amount is required');
      setError('Valid amount is required');
      return;
    }

    if (!formData.category) {
      console.error('AddExpenseModal - Category is required');
      setError('Category is required');
      return;
    }

    if (!formData.date) {
      console.error('AddExpenseModal - Date is required');
      setError('Date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const expenseData = {
        user_id: user.id,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes?.trim() || null
      };

      console.log('AddExpenseModal - Expense data to insert:', expenseData);

      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select();

      console.log('AddExpenseModal - Supabase response:', { data, error });

      if (error) {
        console.error('AddExpenseModal - Supabase error:', error);
        throw error;
      }

      console.log('AddExpenseModal - Expense added successfully:', data);
      onSuccess();
    } catch (error: unknown) {
      console.error('AddExpenseModal - Error adding expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h2>Add New Expense</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <FileText size={16} />
              Description
            </Label>
            <InputWrapper>
              <Input
                type="text"
                placeholder="Enter expense description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <FileText size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <DollarSign size={16} />
              Amount
            </Label>
            <InputWrapper>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <DollarSign size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Tag size={16} />
              Category
            </Label>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              <Calendar size={16} />
              Date
            </Label>
            <InputWrapper>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Calendar size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <FileText size={16} />
              Notes (Optional)
            </Label>
            <TextAreaWrapper>
              <TextArea
                placeholder="Enter additional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <FileText size={16} />
            </TextAreaWrapper>
          </FormGroup>

          <ModalActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </ModalActions>
        </Form>
      </ModalContent>
    </Modal>
  );
}

function EditExpenseModal({ expense, onClose, onSuccess }: { expense: Expense; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    description: expense.description,
    amount: expense.amount.toString(),
    category: expense.category,
    date: expense.date,
    notes: expense.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to edit expenses');
      return;
    }

    // Validate form data
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.date) {
      setError('Date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes?.trim() || null
      };

      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', expense.id);

      if (error) throw error;

      onSuccess();
    } catch (error: unknown) {
      console.error('Error updating expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h2>Edit Expense</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <FileText size={16} />
              Description
            </Label>
            <InputWrapper>
              <Input
                type="text"
                placeholder="Enter expense description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <FileText size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <DollarSign size={16} />
              Amount
            </Label>
            <InputWrapper>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <DollarSign size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <Tag size={16} />
              Category
            </Label>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              <Calendar size={16} />
              Date
            </Label>
            <InputWrapper>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Calendar size={16} />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>
              <FileText size={16} />
              Notes (Optional)
            </Label>
            <TextAreaWrapper>
              <TextArea
                placeholder="Enter additional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <FileText size={16} />
            </TextAreaWrapper>
          </FormGroup>

          <ModalActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Expense'}
            </Button>
          </ModalActions>
        </Form>
      </ModalContent>
    </Modal>
  );
}