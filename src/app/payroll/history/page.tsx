'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Search, Filter, Download, Eye, Calendar, DollarSign, User, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { createSupabaseClient } from '@/lib/supabase';

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  total_taxes: number;
  overtime_hours: number;
  overtime_pay: number;
  bonuses: number;
  status: 'draft' | 'processed' | 'paid';
  processed_date: string;
  payment_method: 'bank_transfer' | 'cash' | 'cheque';
}

interface PayrollSummary {
  total_records: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  total_taxes: number;
  average_pay: number;
}

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  position: relative;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  position: relative;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
  border-radius: 20px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(50%, -50%);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, 50%);
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.6;
`;

const SummaryGrid = styled.div`
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

const SummaryCard = styled.div`
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

const CardIcon = styled.div<{ $color: string }>`
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
  
  ${SummaryCard}:hover & {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%);
    border-color: rgba(220, 38, 38, 0.5);
    color: #ef4444;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const CardLabel = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardValue = styled.p`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #ffffff;
  background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FiltersCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 2rem;
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

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FiltersRow = styled.div`
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

const Select = styled.select`
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

const ExportButton = styled(Button)`
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: white;

  &:hover {
    background: linear-gradient(135deg, rgba(220, 38, 38, 1) 0%, rgba(239, 68, 68, 1) 100%);
    transform: translateY(-2px);
  }
`;

const TableCard = styled.div`
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

const TableContainer = styled.div`
  overflow-x: auto;
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
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(220, 38, 38, 0.1);
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:first-child {
    border-top-left-radius: 16px;
  }

  &:last-child {
    border-top-right-radius: 16px;
  }

  div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(220, 38, 38, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(25, 25, 25, 0.8) 0%, rgba(35, 35, 35, 0.8) 100%);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(220, 38, 38, 0.1);
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  color: white;
  font-size: 0.875rem;
  
  &.employee-info {
    div:first-child {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    div:last-child {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.75rem;
    }
  }
  
  &.pay-period {
    div:first-child {
      margin-bottom: 0.25rem;
    }
    
    div:last-child {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.75rem;
    }
  }
  
  &.net-pay {
    color: #10b981;
    font-weight: 600;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$status) {
      case 'paid':
        return `
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        `;
      case 'processed':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
      case 'draft':
        return `
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
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

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: #1d4ed8;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const PaginationContainer = styled.div`
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(220, 38, 38, 0.2);

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PaginationInfo = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  flex: 1;
`;

const PaginationControls = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PaginationButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: ${props => props.$active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  padding: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h3`
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
`;

const ModalSubtitle = styled.div`
  margin-top: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
`;

const CloseButton = styled.button`
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.10);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
`;

const DetailsSection = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
`;

const SectionTitle = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 10px;
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  
  span:first-child {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    white-space: nowrap;
  }
  
  span:last-child {
    color: white;
    font-weight: 500;
    font-size: 0.875rem;
    text-align: right;
    word-break: break-word;
  }
  
  &.total {
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.10);
    
    span {
      font-weight: 600;
    }
    
    span:last-child {
      color: #10b981;
    }
  }
  
  &.deduction span:last-child {
    color: #ef4444;
  }
`;

const ProcessingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingContent = styled.div`
  text-align: center;
  color: white;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function PayrollHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('');
  const [sortField, setSortField] = useState<keyof PayrollRecord>('processed_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [payStubRecord, setPayStubRecord] = useState<PayrollRecord | null>(null);
  const [downloadingPayStub, setDownloadingPayStub] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch payroll data from database
  const fetchPayrollData = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Fetch payroll records
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      if (!user) {
        setPayrollRecords([]);
        setFilteredRecords([]);
        setPayrollSummary({
          total_records: 0,
          total_gross_pay: 0,
          total_net_pay: 0,
          total_deductions: 0,
          total_taxes: 0,
          average_pay: 0
        });
        return;
      }
      const { data: records, error: recordsError } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            employee_id,
            first_name,
            last_name,
            department
          )
        `)
        .eq('user_id', user.id)
        .order('pay_date', { ascending: false });

      if (recordsError) throw recordsError;

      // Transform data to match interface
      const transformedRecords: PayrollRecord[] = records?.map(record => ({
        id: record.id,
        employee_id: record.employees?.employee_id || record.employee_id,
        employee_name: `${record.employees?.first_name} ${record.employees?.last_name}`,
        department: record.employees?.department || 'Unknown',
        pay_period_start: record.pay_period_start,
        pay_period_end: record.pay_period_end,
        gross_pay: record.gross_salary,
        net_pay: record.net_salary,
        total_deductions: record.total_deductions,
        total_taxes: record.tax_deduction,
        overtime_hours: 0, // Calculate from overtime_amount if needed
        overtime_pay: record.overtime_amount || 0,
        bonuses: record.bonus_amount || 0,
        status: record.status,
        processed_date: record.pay_date,
        payment_method: record.payment_method
      })) || [];

      setPayrollRecords(transformedRecords);
      setFilteredRecords(transformedRecords);

      // Calculate summary
      if (transformedRecords.length > 0) {
        const summary: PayrollSummary = {
          total_records: transformedRecords.length,
          total_gross_pay: transformedRecords.reduce((sum, record) => sum + record.gross_pay, 0),
          total_net_pay: transformedRecords.reduce((sum, record) => sum + record.net_pay, 0),
          total_deductions: transformedRecords.reduce((sum, record) => sum + record.total_deductions, 0),
          total_taxes: transformedRecords.reduce((sum, record) => sum + record.total_taxes, 0),
          average_pay: transformedRecords.reduce((sum, record) => sum + record.net_pay, 0) / transformedRecords.length
        };
        setPayrollSummary(summary);
      } else {
        // Set empty summary if no records
        setPayrollSummary({
          total_records: 0,
          total_gross_pay: 0,
          total_net_pay: 0,
          total_deductions: 0,
          total_taxes: 0,
          average_pay: 0
        });
      }

    } catch (error) {
      console.error('Error fetching payroll data:', error);
      // Set empty data on error
      setPayrollRecords([]);
      setFilteredRecords([]);
      setPayrollSummary({
        total_records: 0,
        total_gross_pay: 0,
        total_net_pay: 0,
        total_deductions: 0,
        total_taxes: 0,
        average_pay: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Calculate summary data from payroll records
  const calculateSummary = (records: PayrollRecord[]): PayrollSummary => {
    if (records.length === 0) {
      return {
        total_records: 0,
        total_gross_pay: 0,
        total_net_pay: 0,
        total_deductions: 0,
        total_taxes: 0,
        average_pay: 0
      };
    }

    const totals = records.reduce((acc, record) => ({
      total_gross_pay: acc.total_gross_pay + (record.gross_pay || 0),
      total_net_pay: acc.total_net_pay + (record.net_pay || 0),
      total_deductions: acc.total_deductions + (record.total_deductions || 0),
      total_taxes: acc.total_taxes + (record.total_taxes || 0)
    }), {
      total_gross_pay: 0,
      total_net_pay: 0,
      total_deductions: 0,
      total_taxes: 0
    });

    return {
      total_records: records.length,
      ...totals,
      average_pay: totals.total_net_pay / records.length
    };
  };

  // Update summary when records change
  useEffect(() => {
    const summary = calculateSummary(payrollRecords);
    setPayrollSummary(summary);
  }, [payrollRecords]);

  // Load data on component mount
  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Filter and search logic
  useEffect(() => {
    const filtered = payrollRecords.filter(record => {
       const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.department.toLowerCase().includes(searchTerm.toLowerCase());
       
       const matchesDepartment = selectedDepartment === '' || record.department === selectedDepartment;
       const matchesStatus = selectedStatus === '' || record.status === selectedStatus;
       const matchesPayPeriod = selectedPayPeriod === '' || record.pay_period_start.startsWith(selectedPayPeriod);
       
       return matchesSearch && matchesDepartment && matchesStatus && matchesPayPeriod;
     });

     // Sort records
     filtered.sort((a, b) => {
       const aValue = a[sortField];
       const bValue = b[sortField];
       
       if (typeof aValue === 'string' && typeof bValue === 'string') {
         return sortDirection === 'asc'  
           ? aValue.localeCompare(bValue)
           : bValue.localeCompare(aValue);
       }
       
       if (typeof aValue === 'number' && typeof bValue === 'number') {
         return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
       }
       
       return 0;
     });

     setFilteredRecords(filtered);
     setCurrentPage(1);
   }, [payrollRecords, searchTerm, selectedDepartment, selectedStatus, selectedPayPeriod, sortField, sortDirection]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const requestPayStubPDF = (record: PayrollRecord) => {
    setPayStubRecord(record);
    setDownloadingPayStub(true);
  };

  useEffect(() => {
    const run = async () => {
      if (!downloadingPayStub || !payStubRecord) return;
      try {
        const { exportToPDF } = await import('@/lib/exportUtils');
        const dateRange = `${formatDate(payStubRecord.pay_period_start)} - ${formatDate(payStubRecord.pay_period_end)}`;
        await exportToPDF(
          'paystub-print-content',
          {
            title: 'Pay Stub',
            subtitle: `${payStubRecord.employee_name} (${payStubRecord.employee_id})`,
            dateRange,
            data: []
          },
          {
            filename: `paystub-${payStubRecord.employee_id}-${payStubRecord.pay_period_end.slice(0, 10)}`,
            orientation: 'portrait',
            format: 'a4',
            includeHeader: false,
            includeFooter: false
          }
        );
      } catch (e) {
        console.error('Error exporting pay stub PDF:', e);
        alert('Failed to download PDF');
      } finally {
        setDownloadingPayStub(false);
      }
    };

    run();
  }, [downloadingPayStub, payStubRecord]);

  const getStatusBadge = (status: string) => {
    return (
      <StatusBadge $status={status}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </StatusBadge>
    );
  };

  const handleSort = (field: keyof PayrollRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof PayrollRecord) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const departments = [...new Set(payrollRecords.map(record => record.department))];
  const payPeriods = [...new Set(payrollRecords.map(record => record.pay_period_start.substring(0, 7)))];

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <LoadingSpinner />
          <p>Loading payroll history...</p>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <ContentWrapper>
          <Header>
            <HeaderContent>
              <Title>Payroll History</Title>
              <Subtitle>Complete record of employee payments and payroll processing</Subtitle>
            </HeaderContent>
          </Header>

          {/* Summary Cards */}
          {payrollSummary && (
            <SummaryGrid>
              <SummaryCard>
                <CardIcon $color="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)">
                  <FileText />
                </CardIcon>
                <CardContent>
                  <CardLabel>Total Records</CardLabel>
                  <CardValue>{payrollSummary.total_records}</CardValue>
                </CardContent>
              </SummaryCard>

              <SummaryCard>
                <CardIcon $color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                  <DollarSign />
                </CardIcon>
                <CardContent>
                  <CardLabel>Total Gross Pay</CardLabel>
                  <CardValue>{formatCurrency(payrollSummary.total_gross_pay)}</CardValue>
                </CardContent>
              </SummaryCard>

              <SummaryCard>
                <CardIcon $color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)">
                  <DollarSign />
                </CardIcon>
                <CardContent>
                  <CardLabel>Total Net Pay</CardLabel>
                  <CardValue>{formatCurrency(payrollSummary.total_net_pay)}</CardValue>
                </CardContent>
              </SummaryCard>

              <SummaryCard>
                <CardIcon $color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
                  <DollarSign />
                </CardIcon>
                <CardContent>
                  <CardLabel>Total Deductions</CardLabel>
                  <CardValue>{formatCurrency(payrollSummary.total_deductions + payrollSummary.total_taxes)}</CardValue>
                </CardContent>
              </SummaryCard>

              <SummaryCard>
                <CardIcon $color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
                  <User />
                </CardIcon>
                <CardContent>
                  <CardLabel>Average Pay</CardLabel>
                  <CardValue>{formatCurrency(payrollSummary.average_pay)}</CardValue>
                </CardContent>
              </SummaryCard>
            </SummaryGrid>
          )}

          {/* Filters */}
          <FiltersCard>
            <FiltersRow>
              <SearchContainer>
                <SearchIcon />
                <SearchInput
                  type="text"
                  placeholder="Search employees, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>

              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Select>

              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
              </Select>

              <Select
                value={selectedPayPeriod}
                onChange={(e) => setSelectedPayPeriod(e.target.value)}
              >
                <option value="">All Pay Periods</option>
                {payPeriods.map(period => (
                  <option key={period} value={period}>
                    {new Date(period + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </option>
                ))}
              </Select>

              <ExportButton>
                <Download />
                Export
              </ExportButton>
            </FiltersRow>
          </FiltersCard>

          {/* Payroll Records Table */}
          <TableCard>
            <TableContainer>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell onClick={() => handleSort('employee_name')}>
                      <div>
                        Employee Name
                        {getSortIcon('employee_name')}
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('department')}>
                      <div>
                        Department
                        {getSortIcon('department')}
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      Pay Period
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('gross_pay')}>
                      <div>
                        Gross Pay
                        {getSortIcon('gross_pay')}
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('net_pay')}>
                      <div>
                        Net Pay
                        {getSortIcon('net_pay')}
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('status')}>
                      <div>
                        Status
                        {getSortIcon('status')}
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      Actions
                    </TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {currentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="employee-info">
                        <div>{record.employee_name}</div>
                        <div>{record.employee_id}</div>
                      </TableCell>
                      <TableCell>
                        {record.department}
                      </TableCell>
                      <TableCell className="pay-period">
                        <div>{formatDate(record.pay_period_start)}</div>
                        <div>to {formatDate(record.pay_period_end)}</div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(record.gross_pay)}
                      </TableCell>
                      <TableCell className="net-pay">
                        {formatCurrency(record.net_pay)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <ActionButton
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDetails(true);
                          }}
                        >
                          <Eye />
                          View Details
                        </ActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <PaginationContainer>
              <PaginationInfo>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} results
              </PaginationInfo>
              <PaginationControls>
                <PaginationButton
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </PaginationButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationButton
                    key={page}
                    $active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationButton>
                ))}
                <PaginationButton
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </PaginationButton>
              </PaginationControls>
            </PaginationContainer>
          </TableCard>

          {/* Payroll Details Modal */}
          {showDetails && selectedRecord && (
            <Modal
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowDetails(false);
                }
              }}
            >
              <ModalContent>
                <ModalHeader>
                  <div>
                    <ModalTitle>Payroll details</ModalTitle>
                    <ModalSubtitle>
                      {selectedRecord.employee_name} • {selectedRecord.employee_id} • {selectedRecord.department}
                    </ModalSubtitle>
                    <ModalSubtitle>
                      {formatDate(selectedRecord.pay_period_start)} - {formatDate(selectedRecord.pay_period_end)} • {selectedRecord.id}
                    </ModalSubtitle>
                  </div>
                  <CloseButton onClick={() => setShowDetails(false)}>
                    <X />
                  </CloseButton>
                </ModalHeader>

                <DetailsGrid>
                  <DetailsSection>
                    <SectionTitle>Employee</SectionTitle>
                    <DetailsList>
                      <DetailItem>
                        <span>Name:</span>
                        <span>{selectedRecord.employee_name}</span>
                      </DetailItem>
                      <DetailItem>
                        <span>Employee ID:</span>
                        <span>{selectedRecord.employee_id}</span>
                      </DetailItem>
                      <DetailItem>
                        <span>Department:</span>
                        <span>{selectedRecord.department}</span>
                      </DetailItem>
                      <DetailItem>
                        <span>Pay Period:</span>
                        <span>
                          {formatDate(selectedRecord.pay_period_start)} - {formatDate(selectedRecord.pay_period_end)}
                        </span>
                      </DetailItem>
                    </DetailsList>
                  </DetailsSection>

                  <DetailsSection>
                    <SectionTitle>Salary</SectionTitle>
                    <DetailsList>
                      <DetailItem>
                        <span>Gross Pay:</span>
                        <span>{formatCurrency(selectedRecord.gross_pay)}</span>
                      </DetailItem>
                      <DetailItem>
                        <span>Overtime Pay:</span>
                        <span>{formatCurrency(selectedRecord.overtime_pay)}</span>
                      </DetailItem>
                      <DetailItem>
                        <span>Bonuses:</span>
                        <span>{formatCurrency(selectedRecord.bonuses)}</span>
                      </DetailItem>
                      <DetailItem className="deduction">
                        <span>Total Deductions:</span>
                        <span>-{formatCurrency(selectedRecord.total_deductions)}</span>
                      </DetailItem>
                      <DetailItem className="deduction">
                        <span>Total Taxes:</span>
                        <span>-{formatCurrency(selectedRecord.total_taxes)}</span>
                      </DetailItem>
                      <DetailItem className="total">
                        <span>Net Pay:</span>
                        <span>{formatCurrency(selectedRecord.net_pay)}</span>
                      </DetailItem>
                    </DetailsList>
                  </DetailsSection>
                </DetailsGrid>

                <DetailsSection style={{ marginTop: '12px' }}>
                  <SectionTitle>Processing</SectionTitle>
                  <ProcessingGrid>
                    <DetailItem>
                      <span>Status:</span>
                      <span>{getStatusBadge(selectedRecord.status)}</span>
                    </DetailItem>
                    <DetailItem>
                      <span>Processed Date:</span>
                      <span>{formatDate(selectedRecord.processed_date)}</span>
                    </DetailItem>
                    <DetailItem>
                      <span>Payment Method:</span>
                      <span>{selectedRecord.payment_method.replace('_', ' ')}</span>
                    </DetailItem>
                  </ProcessingGrid>
                </DetailsSection>

                <ModalActions>
                  <Button variant="secondary" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                  <Button variant="secondary" onClick={() => requestPayStubPDF(selectedRecord)}>
                    <Download />
                    Download Pay Stub
                  </Button>
                  <Button onClick={() => router.push(`/payroll/${selectedRecord.id}`)}>
                    <Eye />
                    Open Payroll
                  </Button>
                </ModalActions>
              </ModalContent>
            </Modal>
          )}

          {payStubRecord && (
            <div
              id="paystub-print-content"
              style={{
                position: 'fixed',
                left: '-10000px',
                top: 0,
                width: '800px',
                padding: '24px',
                background: '#ffffff',
                color: '#111827',
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>Pay Stub</div>
                  <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px', lineHeight: 1.35 }}>
                    {payStubRecord.employee_name} • {payStubRecord.employee_id} • {payStubRecord.department}
                  </div>
                  <div style={{ marginTop: '4px', color: '#6b7280', fontSize: '13px', lineHeight: 1.35 }}>
                    {formatDate(payStubRecord.pay_period_start)} - {formatDate(payStubRecord.pay_period_end)} • Payroll ID: {payStubRecord.id}
                  </div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '999px', padding: '6px 10px', fontSize: '12px' }}>
                  {payStubRecord.status}
                </div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginTop: '14px', marginBottom: '14px' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Employee
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Name</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{payStubRecord.employee_name}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Employee ID</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{payStubRecord.employee_id}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <div style={{ color: '#6b7280' }}>Department</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{payStubRecord.department}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Processing
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Processed Date</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatDate(payStubRecord.processed_date)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <div style={{ color: '#6b7280' }}>Payment Method</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{payStubRecord.payment_method.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Earnings
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Gross Pay</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(payStubRecord.gross_pay)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Overtime Pay</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(payStubRecord.overtime_pay)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <div style={{ color: '#6b7280' }}>Bonuses</div>
                    <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(payStubRecord.bonuses)}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Deductions
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Total Deductions</div>
                    <div style={{ fontWeight: 600, textAlign: 'right', color: '#b91c1c' }}>
                      -{formatCurrency(payStubRecord.total_deductions)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280' }}>Total Taxes</div>
                    <div style={{ fontWeight: 600, textAlign: 'right', color: '#b91c1c' }}>
                      -{formatCurrency(payStubRecord.total_taxes)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <div style={{ color: '#6b7280' }}>Net Pay</div>
                    <div style={{ fontWeight: 800, textAlign: 'right', color: '#047857' }}>{formatCurrency(payStubRecord.net_pay)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ContentWrapper>
      </Container>
    </DashboardLayout>
  );
}
