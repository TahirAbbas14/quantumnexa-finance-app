'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Calendar, 
  Users, 
  Timer, 
  TrendingUp, 
  Coffee, 
  MapPin,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface TimeEntry {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  location?: string;
  created_at: string;
  user_id: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department?: string;
  status: 'active' | 'inactive';
}

interface CurrentSession {
  employee_id: string;
  employee_name: string;
  clock_in: string;
  break_start: string | null;
  is_on_break: boolean;
  total_time: number;
  break_time: number;
}

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
    opacity: 0.8;
  }
  
  &:hover {
    transform: translateY(-4px);
    background: linear-gradient(135deg, rgba(25, 25, 25, 0.95) 0%, rgba(35, 35, 35, 0.95) 100%);
    border-color: rgba(220, 38, 38, 0.4);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(220, 38, 38, 0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const StatIcon = styled.div<{ $color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$color || 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'};
  color: white;
  box-shadow: 
    0 8px 20px rgba(220, 38, 38, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    pointer-events: none;
  }

  svg {
    width: 24px;
    height: 24px;
    position: relative;
    z-index: 1;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const TimeClockSection = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
    opacity: 0.8;
  }
`;

const CurrentTime = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const SessionInfo = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const SessionStat = styled.div`
  text-align: center;
`;

const SessionValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 4px;
`;

const SessionLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const ClockButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const ClockButton = styled.button<{ $variant?: 'start' | 'stop' | 'break' }>`
  padding: 16px 32px;
  border-radius: 12px;
  border: 1px solid;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: center;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  
  ${props => {
    switch (props.$variant) {
      case 'start':
        return `
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(22, 163, 74, 0.9) 100%);
          border-color: rgba(34, 197, 94, 0.3);
          color: white;
          box-shadow: 
            0 8px 32px rgba(34, 197, 94, 0.3),
            0 0 0 1px rgba(34, 197, 94, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 1) 100%);
            border-color: rgba(34, 197, 94, 0.5);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 
              0 12px 48px rgba(34, 197, 94, 0.4),
              0 0 0 1px rgba(34, 197, 94, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        `;
      case 'stop':
        return `
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.9) 100%);
          border-color: rgba(220, 38, 38, 0.3);
          color: white;
          box-shadow: 
            0 8px 32px rgba(220, 38, 38, 0.3),
            0 0 0 1px rgba(220, 38, 38, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 1) 100%);
            border-color: rgba(220, 38, 38, 0.5);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 
              0 12px 48px rgba(220, 38, 38, 0.4),
              0 0 0 1px rgba(220, 38, 38, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        `;
      case 'break':
        return `
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.8) 0%, rgba(217, 119, 6, 0.9) 100%);
          border-color: rgba(245, 158, 11, 0.3);
          color: white;
          box-shadow: 
            0 8px 32px rgba(245, 158, 11, 0.3),
            0 0 0 1px rgba(245, 158, 11, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 1) 100%);
            border-color: rgba(245, 158, 11, 0.5);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 
              0 12px 48px rgba(245, 158, 11, 0.4),
              0 0 0 1px rgba(245, 158, 11, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
          }
        `;
    }
  }}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:active {
    transform: translateY(-1px) scale(1.02);
  }
  
  svg {
    width: 20px;
    height: 20px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const Controls = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
    opacity: 0.8;
  }
`;

const EmployeeSelectContainer = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
    opacity: 0.8;
  }
`;

const EmployeeSelectLabel = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
`;

const EmployeeSelect = styled.select`
  width: 100%;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  color: white;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.4);
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(32, 32, 32, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%);
  }
  
  option {
    background: rgba(30, 30, 30, 0.95);
    color: white;
    padding: 12px;
  }
`;

const SelectedEmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
`;

const SelectedEmployeeAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
`;

const SelectedEmployeeDetails = styled.div`
  flex: 1;
`;

const SelectedEmployeeName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const SelectedEmployeeId = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  padding: 12px 16px 12px 40px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  color: white;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.4);
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(32, 32, 32, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const FilterSelect = styled.select`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  color: white;
  font-size: 14px;
  min-width: 150px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.4);
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(32, 32, 32, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%);
  }
  
  option {
    background: rgba(30, 30, 30, 0.95);
    color: white;
    padding: 8px;
  }
`;

const DateInput = styled.input`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  color: white;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.4);
    background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: linear-gradient(135deg, rgba(32, 32, 32, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%);
  }
`;

const TableContainer = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
    opacity: 0.8;
    z-index: 1;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: rgba(0, 0, 0, 0.3);
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
`;

const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const EmployeeAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const EmployeeDetails = styled.div``;

const EmployeeName = styled.div`
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
`;

const EmployeeId = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  
  ${props => {
    switch (props.status) {
      case 'present':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'late':
        return `
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        `;
      case 'absent':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      case 'half-day':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.2);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        `;
    }
  }}
`;

const TimeDisplay = styled.div`
  font-weight: 600;
  color: white;
`;

const LocationBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.1);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    color: white;
    transform: scale(1.1);
  }
  
  &.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
`;

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [canManageEmployees, setCanManageEmployees] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check user permissions
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!user) return;
      
      try {
        
        // Get user's employee record to check role
      const supabase = createSupabaseClient();
      if (!supabase) {
        console.error('Supabase client is null');
        return;
      }
      
      const { data: employeeData, error: empError } = await supabase
          .from('employees')
          .select('role, department')
          .eq('user_id', user.id)
          .single();
        
        if (empError && empError.code !== 'PGRST116') {
          console.error('Error fetching user role:', empError);
          return;
        }
        
        if (employeeData) {
          setUserRole(employeeData.role || 'employee');
          // Allow managers, HR, and admins to manage employee time tracking
          const managerRoles = ['manager', 'hr', 'admin', 'supervisor'];
          setCanManageEmployees(managerRoles.includes(employeeData.role?.toLowerCase() || ''));
        }
      } catch (error: unknown) {
        console.error('Error checking permissions:', error);
        const message = error instanceof Error ? error.message : 'Failed to check permissions';
        setError(message);
      }
    };

    checkUserPermissions();
  }, [user]);

  // Validate employee selection
  const validateEmployeeSelection = (employeeId: string) => {
    return true;
  };

  const fetchTimeEntries = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { data, error } = await supabase
        .from('time_tracking')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_id)
        `)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error: unknown) {
      console.error('Error fetching time entries:', error);
      const message = error instanceof Error ? error.message : 'Failed to load time entries';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  const fetchCurrentSession = useCallback(async () => {
    if (!user) return;
    
    try {
      const supabase = createSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      
      if (!selectedEmployeeId) {
        setCurrentSession(null);
        return;
      }
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { data, error } = await supabase
        .from('time_tracking')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_id)
        `)
        .eq('employee_id', selectedEmployeeId)
        .eq('date', today)
        .is('clock_out', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const clockIn = new Date(data.clock_in);
        const now = new Date();
        const totalMinutes = differenceInMinutes(now, clockIn);
        
        let breakMinutes = 0;
        if (data.break_start && data.break_end) {
          breakMinutes = differenceInMinutes(new Date(data.break_end), new Date(data.break_start));
        } else if (data.break_start && !data.break_end) {
          breakMinutes = differenceInMinutes(now, new Date(data.break_start));
        }
        
        setCurrentSession({
          employee_id: data.employee_id,
          employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : 'Employee',
          clock_in: data.clock_in,
          break_start: data.break_start,
          is_on_break: data.break_start && !data.break_end,
          total_time: totalMinutes - breakMinutes,
          break_time: breakMinutes
        });
      } else {
        setCurrentSession(null);
      }
    } catch (error: unknown) {
      console.error('Error fetching current session:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch current session';
      setError(message);
    }
  }, [user, selectedEmployeeId]);

  const fetchEmployees = useCallback(async () => {
    if (!user) return;
    
    try {
      
      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_id, department, status')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: unknown) {
      console.error('Error fetching employees:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch employees';
      setError(message);
    }
  }, [user]);

  useEffect(() => {
    fetchEmployees();
    fetchTimeEntries();
    fetchCurrentSession();
  }, [fetchEmployees, fetchTimeEntries, fetchCurrentSession]);

  const handleClockIn = async () => {
    if (!user) return;
    
    // Validate employee selection permissions
    if (!validateEmployeeSelection(selectedEmployeeId)) {
      return;
    }
    
    try {
      setIsClockingIn(true);
      setError('');
      const supabase = createSupabaseClient();
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      let employeeId: string;
      
      if (selectedEmployeeId) {
        // Clock in for selected employee
        employeeId = selectedEmployeeId;
      } else {
        // Clock in for current user - get user's employee record
        if (!supabase) {
          throw new Error('Supabase client is not available');
        }
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (empError) throw empError;
        if (!employees || employees.length === 0) {
          throw new Error('No employee record found. Please contact administrator.');
        }
        
        employeeId = employees[0].id;
      }
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { error } = await supabase
        .from('time_tracking')
        .insert([{
          user_id: user.id,
          employee_id: employeeId,
          date: today,
          clock_in: now,
          status: 'present'
        }]);

      if (error) throw error;
      
      fetchCurrentSession();
      fetchTimeEntries();
    } catch (error: unknown) {
      console.error('Error clocking in:', error);
      const message = error instanceof Error ? error.message : 'Failed to clock in';
      setError(message);
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!user || !currentSession) return;
    
    try {
      setIsClockingIn(true);
      setError('');
      const supabase = createSupabaseClient();
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      const clockInTime = new Date(currentSession.clock_in);
      const clockOutTime = new Date(now);
      const totalHours = differenceInHours(clockOutTime, clockInTime);
      const overtimeHours = Math.max(0, totalHours - 8);
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { error } = await supabase
        .from('time_tracking')
        .update({
          clock_out: now,
          total_hours: totalHours,
          overtime_hours: overtimeHours
        })
        .eq(selectedEmployeeId ? 'employee_id' : 'user_id', selectedEmployeeId || user.id)
        .eq('date', today)
        .is('clock_out', null);

      if (error) throw error;
      
      setCurrentSession(null);
      fetchTimeEntries();
    } catch (error: unknown) {
      console.error('Error clocking out:', error);
      const message = error instanceof Error ? error.message : 'Failed to clock out';
      setError(message);
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleStartBreak = async () => {
    if (!user || !currentSession) return;
    
    try {
      setError('');
      const supabase = createSupabaseClient();
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { error } = await supabase
        .from('time_tracking')
        .update({
          break_start: now
        })
        .eq(selectedEmployeeId ? 'employee_id' : 'user_id', selectedEmployeeId || user.id)
        .eq('date', today)
        .is('clock_out', null);

      if (error) throw error;
      
      fetchCurrentSession();
    } catch (error: unknown) {
      console.error('Error starting break:', error);
      const message = error instanceof Error ? error.message : 'Failed to start break';
      setError(message);
    }
  };

  const handleEndBreak = async () => {
    if (!user || !currentSession) return;
    
    try {
      setError('');
      const supabase = createSupabaseClient();
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { error } = await supabase
        .from('time_tracking')
        .update({
          break_end: now
        })
        .eq(selectedEmployeeId ? 'employee_id' : 'user_id', selectedEmployeeId || user.id)
        .eq('date', today)
        .is('clock_out', null);

      if (error) throw error;
      
      fetchCurrentSession();
    } catch (error: unknown) {
      console.error('Error ending break:', error);
      const message = error instanceof Error ? error.message : 'Failed to end break';
      setError(message);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeDisplay = (timeString: string | null) => {
    if (!timeString) return '--:--';
    return format(parseISO(timeString), 'HH:mm');
  };

  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = 
      entry.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalEntries: timeEntries.length,
    present: timeEntries.filter(e => e.status === 'present').length,
    late: timeEntries.filter(e => e.status === 'late').length,
    absent: timeEntries.filter(e => e.status === 'absent').length
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Container>
        <ContentWrapper>
          <Header>
          <Title>
            <Clock size={32} />
            Time Tracking
          </Title>
          <Button onClick={() => router.push('/employees')}>
            <Users size={16} />
            Manage Employees
          </Button>
        </Header>

        <StatsContainer>
          <StatCard>
            <StatHeader>
              <StatIcon $color="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)">
                <Users size={24} />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.totalEntries}</StatValue>
                <StatLabel>Total Entries</StatLabel>
              </StatContent>
            </StatHeader>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon $color="linear-gradient(135deg, #059669 0%, #10b981 100%)">
                <CheckCircle size={24} />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.present}</StatValue>
                <StatLabel>Present</StatLabel>
              </StatContent>
            </StatHeader>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon $color="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)">
                <AlertCircle size={24} />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.late}</StatValue>
                <StatLabel>Late</StatLabel>
              </StatContent>
            </StatHeader>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon $color="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)">
                <X size={24} />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.absent}</StatValue>
                <StatLabel>Absent</StatLabel>
              </StatContent>
            </StatHeader>
          </StatCard>
        </StatsContainer>

        <EmployeeSelectContainer>
          <EmployeeSelectLabel>Select Employee for Time Tracking</EmployeeSelectLabel>
          <EmployeeSelect
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="">Track my own time</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name} - {employee.employee_id}
              </option>
            ))}
          </EmployeeSelect>
          
          {selectedEmployeeId && (
            <SelectedEmployeeInfo>
              <SelectedEmployeeAvatar>
                {employees.find(emp => emp.id === selectedEmployeeId)?.first_name?.[0]}
                {employees.find(emp => emp.id === selectedEmployeeId)?.last_name?.[0]}
              </SelectedEmployeeAvatar>
              <SelectedEmployeeDetails>
                <SelectedEmployeeName>
                  {employees.find(emp => emp.id === selectedEmployeeId)?.first_name} {employees.find(emp => emp.id === selectedEmployeeId)?.last_name}
                </SelectedEmployeeName>
                <SelectedEmployeeId>
                  ID: {employees.find(emp => emp.id === selectedEmployeeId)?.employee_id}
                </SelectedEmployeeId>
              </SelectedEmployeeDetails>
            </SelectedEmployeeInfo>
          )}
        </EmployeeSelectContainer>

        <TimeClockSection>
          <CurrentTime>
            {format(currentTime, 'HH:mm:ss')}
          </CurrentTime>
          
          {currentSession && (
            <SessionInfo>
              <SessionStat>
                <SessionValue>{formatTime(currentSession.total_time)}</SessionValue>
                <SessionLabel>Work Time</SessionLabel>
              </SessionStat>
              <SessionStat>
                <SessionValue>{formatTime(currentSession.break_time)}</SessionValue>
                <SessionLabel>Break Time</SessionLabel>
              </SessionStat>
              <SessionStat>
                <SessionValue>{formatTimeDisplay(currentSession.clock_in)}</SessionValue>
                <SessionLabel>Clock In</SessionLabel>
              </SessionStat>
              <SessionStat>
                <SessionValue>{currentSession.employee_name}</SessionValue>
                <SessionLabel>Employee</SessionLabel>
              </SessionStat>
            </SessionInfo>
          )}
          
          <ClockButtons>
             {!currentSession ? (
               <ClockButton 
                 $variant="start" 
                 onClick={handleClockIn}
                 disabled={isClockingIn}
               >
                 <Play size={20} />
                 {selectedEmployeeId ? 'Clock In Employee' : 'Clock In'}
               </ClockButton>
            ) : (
              <>
                {!currentSession.is_on_break ? (
                  <ClockButton 
                    $variant="break" 
                    onClick={handleStartBreak}
                  >
                    <Coffee size={20} />
                    Start Break
                  </ClockButton>
                ) : (
                  <ClockButton 
                    $variant="start" 
                    onClick={handleEndBreak}
                  >
                    <Play size={20} />
                    End Break
                  </ClockButton>
                )}
                <ClockButton 
                  $variant="stop" 
                  onClick={handleClockOut}
                  disabled={isClockingIn}
                >
                  <Square size={20} />
                  Clock Out
                </ClockButton>
              </>
            )}
          </ClockButtons>
        </TimeClockSection>

        <Controls>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
            </FilterSelect>
            <DateInput
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </SearchContainer>
        </Controls>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Clock In</TableHeaderCell>
                <TableHeaderCell>Clock Out</TableHeaderCell>
                <TableHeaderCell>Break</TableHeaderCell>
                <TableHeaderCell>Total Hours</TableHeaderCell>
                <TableHeaderCell>Overtime</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr>
                  <TableCell colSpan={8}>
                    <LoadingState>Loading time entries...</LoadingState>
                  </TableCell>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <TableCell colSpan={8}>
                    <EmptyState>No time entries found for selected date</EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <EmployeeInfo>
                        <EmployeeAvatar>
                          {entry.employee?.first_name?.[0]}{entry.employee?.last_name?.[0]}
                        </EmployeeAvatar>
                        <EmployeeDetails>
                          <EmployeeName>
                            {entry.employee?.first_name} {entry.employee?.last_name}
                          </EmployeeName>
                          <EmployeeId>ID: {entry.employee?.employee_id}</EmployeeId>
                        </EmployeeDetails>
                      </EmployeeInfo>
                    </TableCell>
                    <TableCell>
                      <TimeDisplay>{formatTimeDisplay(entry.clock_in)}</TimeDisplay>
                    </TableCell>
                    <TableCell>
                      <TimeDisplay>{formatTimeDisplay(entry.clock_out)}</TimeDisplay>
                    </TableCell>
                    <TableCell>
                      {entry.break_start && entry.break_end ? (
                        <TimeDisplay>
                          {formatTimeDisplay(entry.break_start)} - {formatTimeDisplay(entry.break_end)}
                        </TimeDisplay>
                      ) : entry.break_start ? (
                        <TimeDisplay>Started at {formatTimeDisplay(entry.break_start)}</TimeDisplay>
                      ) : (
                        '--'
                      )}
                    </TableCell>
                    <TableCell>
                      <TimeDisplay>{entry.total_hours?.toFixed(1) || '0.0'}h</TimeDisplay>
                    </TableCell>
                    <TableCell>
                      <TimeDisplay>{entry.overtime_hours?.toFixed(1) || '0.0'}h</TimeDisplay>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status}>
                        {entry.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <LocationBadge>
                        <MapPin size={12} />
                        {entry.location || 'Office'}
                      </LocationBadge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </ContentWrapper>
    </Container>
    </DashboardLayout>
  );
}