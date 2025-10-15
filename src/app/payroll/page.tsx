'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Calculator,
  Calendar,
  Download,
  Filter,
  UserCheck,
  Banknote
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Styled Components
const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;

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

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  font-size: 14px;
  font-weight: 500;
`;

const StatsContainer = styled.div`
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

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
  
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

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  transition: all 0.3s ease;
  
  ${StatCard}:hover & {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%);
    border-color: rgba(220, 38, 38, 0.5);
    color: #ef4444;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #ffffff;
  background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.4) 50%, 
      transparent 100%
    );
  }
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 16px;
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

  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.5);
  color: white;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.6);
    background: rgba(20, 20, 20, 0.8);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(220, 38, 38, 0.6);
  width: 18px;
  height: 18px;
`;

const FilterSelect = styled.select`
  padding: 12px 16px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.5);
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 150px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.6);
    background: rgba(20, 20, 20, 0.8);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  option {
    background: #1a1a1a;
    color: white;
    padding: 8px;
  }

  @media (max-width: 768px) {
    min-width: auto;
    flex: 1;
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
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.4) 50%, 
      transparent 100%
    );
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  border-bottom: 1px solid rgba(220, 38, 38, 0.2);
`;

const TableHeaderCell = styled.th`
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: #ffffff;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid rgba(220, 38, 38, 0.1);
  position: relative;

  &:first-child {
    border-top-left-radius: 16px;
  }

  &:last-child {
    border-top-right-radius: 16px;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(25, 25, 25, 0.8) 0%, rgba(35, 35, 35, 0.8) 100%);
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(220, 38, 38, 0.1);
  }
`;

const TableCell = styled.td`
  padding: 16px 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  vertical-align: middle;
`;

const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const EmployeeAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const EmployeeDetails = styled.div``;

const EmployeeName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const EmployeeId = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  
  ${({ status }) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'pending':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'processing':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
      case 'failed':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        `;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%);
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: #dc2626;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%);
    border-color: rgba(220, 38, 38, 0.5);
    color: #ef4444;
    transform: scale(1.05);
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: white;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.8);
`;

const EmptyStateIcon = styled.div`
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const EmptyStateDescription = styled.p`
  margin: 0;
  opacity: 0.8;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  color: white;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

// Interfaces
interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  overtime_amount: number;
  bonus_amount: number;
  allowances: number;
  gross_salary: number;
  tax_deduction: number;
  provident_fund: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  currency: string;
  status: string;
  payment_method: string;
}

interface PayrollStats {
  totalPayroll: number;
  totalEmployees: number;
  averageSalary: number;
  pendingPayments: number;
}

export default function PayrollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats>({
    totalPayroll: 0,
    totalEmployees: 0,
    averageSalary: 0,
    pendingPayments: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch payroll records and stats
  const fetchPayrollData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseClient();

      // Fetch payroll records
      const { data: payrollData, error: payrollError } = await supabase!
        .from('payroll')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            department,
            email
          )
        `)
        .order('pay_date', { ascending: false });

      if (payrollError) throw payrollError;

      // Transform data to match interface
      const transformedRecords: PayrollRecord[] = (payrollData || []).map(record => ({
        id: record.id,
        employee_id: record.employee_id,
        employee_name: record.employees ? 
          `${record.employees.first_name} ${record.employees.last_name}` : 
          'Unknown Employee',
        department: record.employees?.department || 'Unknown',
        pay_period_start: record.pay_period_start,
        pay_period_end: record.pay_period_end,
        pay_date: record.pay_date,
        base_salary: record.base_salary || 0,
        overtime_amount: record.overtime_amount || 0,
        bonus_amount: record.bonus_amount || 0,
        allowances: record.allowances || 0,
        gross_salary: record.gross_salary || 0,
        tax_deduction: record.tax_deduction || 0,
        provident_fund: record.provident_fund || 0,
        other_deductions: record.other_deductions || 0,
        total_deductions: record.total_deductions || 0,
        net_salary: record.net_salary || 0,
        currency: record.currency || 'PKR',
        status: record.status || 'pending',
        payment_method: record.payment_method || 'bank_transfer'
      }));

      setPayrollRecords(transformedRecords);

      // Calculate stats
      const totalPayroll = transformedRecords.reduce((sum, record) => sum + record.net_salary, 0);
      const totalEmployees = new Set(transformedRecords.map(record => record.employee_id)).size;
      const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
      const pendingPayments = transformedRecords.filter(record => record.status === 'pending').length;

      setStats({
        totalPayroll,
        totalEmployees,
        averageSalary,
        pendingPayments
      });

    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError('Failed to load payroll data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Filter records based on search and filters
  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(payrollRecords.map(record => record.department)));

  // Handle payroll processing
  const handleProcessPayroll = async (recordId: string) => {
    try {
      const supabase = createSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      const { error } = await supabase
        .from('payroll')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      // Refresh data
      await fetchPayrollData();
      setShowProcessModal(false);
      setSelectedRecord(null);
    } catch (err) {
      console.error('Error processing payroll:', err);
      setError('Failed to process payroll. Please try again.');
    }
  };

  // Handle payment completion
  const handleCompletePayment = async (recordId: string) => {
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase!
        .from('payroll')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      // Refresh data
      await fetchPayrollData();
    } catch (err) {
      console.error('Error completing payment:', err);
      setError('Failed to complete payment. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderContent>
            <h1>Payroll Management</h1>
            <p>Manage employee payroll, process payments, and track salary distributions</p>
          </HeaderContent>
          <HeaderActions>
            <StyledAddButton onClick={() => router.push('/payroll/reports')}>
              <FileText size={18} />
              Reports
            </StyledAddButton>
            <StyledAddButton onClick={() => router.push('/payroll/history')}>
              <Clock size={18} />
              History
            </StyledAddButton>
            <StyledAddButton onClick={() => router.push('/payroll/process')}>
              <Plus size={18} />
              Process Payroll
            </StyledAddButton>
          </HeaderActions>
        </Header>

        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}

        <StatsContainer>
          <StatCard>
            <StatIcon>
              <DollarSign size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{formatCurrency(stats.totalPayroll)}</StatValue>
              <StatLabel>Total Payroll</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon>
              <Users size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{stats.totalEmployees}</StatValue>
              <StatLabel>Total Employees</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon>
              <TrendingUp size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{formatCurrency(stats.averageSalary)}</StatValue>
              <StatLabel>Average Salary</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon>
              <AlertCircle size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{stats.pendingPayments}</StatValue>
              <StatLabel>Pending Payments</StatLabel>
            </StatContent>
          </StatCard>
        </StatsContainer>

        <Controls>
          <ControlsRow>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search employees or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </FilterSelect>
            <FilterSelect
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </FilterSelect>
          </ControlsRow>
        </Controls>

        <TableContainer>
          {loading ? (
            <LoadingState>
              <LoadingSpinner />
            </LoadingState>
          ) : filteredRecords.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <Users size={32} />
              </EmptyStateIcon>
              <EmptyStateTitle>No Payroll Records Found</EmptyStateTitle>
              <EmptyStateDescription>
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                  ? 'No records match your current filters.'
                  : 'Start by processing payroll for your employees.'}
              </EmptyStateDescription>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Department</TableHeaderCell>
                  <TableHeaderCell>Pay Period</TableHeaderCell>
                  <TableHeaderCell>Gross Salary</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Salary</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <EmployeeInfo>
                        <EmployeeAvatar>
                          {record.employee_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </EmployeeAvatar>
                        <EmployeeDetails>
                          <EmployeeName>{record.employee_name}</EmployeeName>
                          <EmployeeId>ID: {record.employee_id}</EmployeeId>
                        </EmployeeDetails>
                      </EmployeeInfo>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>
                      {format(parseISO(record.pay_period_start), 'MMM dd')} - {format(parseISO(record.pay_period_end), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{formatCurrency(record.gross_salary)}</TableCell>
                    <TableCell>{formatCurrency(record.total_deductions)}</TableCell>
                    <TableCell>
                      <strong>{formatCurrency(record.net_salary)}</strong>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status}>
                        {record.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <ActionButtons>
                        <ActionButton
                          onClick={() => router.push(`/payroll/${record.id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </ActionButton>
                        {record.status === 'pending' && (
                          <ActionButton
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowProcessModal(true);
                            }}
                            title="Process Payment"
                          >
                            <Play size={16} />
                          </ActionButton>
                        )}
                        {record.status === 'processing' && (
                          <ActionButton
                            onClick={() => handleCompletePayment(record.id)}
                            title="Mark as Paid"
                          >
                            <CheckCircle size={16} />
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => router.push(`/payroll/${record.id}/edit`)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Process Payment Modal */}
        <Modal isOpen={showProcessModal}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Process Payment</ModalTitle>
              <ModalCloseButton onClick={() => setShowProcessModal(false)}>
                <X size={20} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              {selectedRecord && (
                <div>
                  <p>Are you sure you want to process payment for:</p>
                  <strong>{selectedRecord.employee_name}</strong>
                  <br />
                  <strong>Amount: {formatCurrency(selectedRecord.net_salary)}</strong>
                  <br />
                  <strong>Pay Period: {format(parseISO(selectedRecord.pay_period_start), 'MMM dd')} - {format(parseISO(selectedRecord.pay_period_end), 'MMM dd, yyyy')}</strong>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowProcessModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => selectedRecord && handleProcessPayroll(selectedRecord.id)}
              >
                Process Payment
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
}