'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Calculator, DollarSign, Plus, Minus, Save, Users, Calendar } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

interface Employee {
  id: string;
  employee_code: string;
  name: string;
  position: string;
  department: string;
  base_salary: number;
  hourly_rate: number;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern';
}

interface PayrollCalculation {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary_original: number;
  salary_adjustment: number;
  base_salary: number;
  allowances: number;
  bonus_amount: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  gross_pay: number;
  tax_deduction: number;
  provident_fund: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
}

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
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 6px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const Card = styled.div`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const LoadingContainer = styled.div`
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid rgba(220, 38, 38, 0.3);
  border-top: 3px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin: 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
          }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
          }
        `;
      default:
        return `
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
          color: white;
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmployeeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const EmployeeCard = styled.div<{ selected?: boolean }>`
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid ${props => props.selected ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-400);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const EmployeeName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
`;

const EmployeeDetails = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
`;

const EmployeeSalary = styled.p`
  font-size: 14px;
  color: var(--primary-400);
  margin: 0;
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const SummaryCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const SummaryIcon = styled.div<{ color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'var(--primary-100)'};
  color: ${props => props.color?.replace('100', '600') || 'var(--primary-600)'};
`;

const SummaryValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  color: var(--gray-300);
`;

const ResultsGrid = styled.div`
  display: grid;
  gap: 24px;
`;

const ResultCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ResultTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const ResultAmount = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-400);
`;

const ResultDetails = styled.div`
  display: grid;
  gap: 8px;
`;

const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    font-weight: 600;
    padding-top: 12px;
  }
`;

const ResultLabel = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const ResultValue = styled.span`
  font-size: 14px;
  color: white;
`;

export default function PayrollCalculatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [payPeriod, setPayPeriod] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [calculations, setCalculations] = useState<PayrollCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const supabase = createSupabaseClient();

        if (!supabase) {
          throw new Error('Supabase is not configured properly. Please check your environment variables.');
        }

        const { data, error: fetchError } = await supabase
          .from('employees')
          .select('id, employee_id, first_name, last_name, position, department, base_salary, hourly_rate, employment_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const rows = (data || []) as Array<{
          id: string;
          employee_id: string;
          first_name: string;
          last_name: string;
          position: string;
          department: string | null;
          base_salary: number;
          hourly_rate: number | null;
          employment_type: 'full-time' | 'part-time' | 'contract' | 'intern';
        }>;

        setEmployees(
          rows.map((row) => {
            const monthlyHours = 160;
            const fallbackHourlyRate = row.base_salary && monthlyHours ? row.base_salary / monthlyHours : 0;
            return {
              id: row.id,
              employee_code: row.employee_id,
              name: `${row.first_name} ${row.last_name}`.trim(),
              position: row.position,
              department: row.department || 'Unknown',
              base_salary: row.base_salary || 0,
              hourly_rate: row.hourly_rate ?? fallbackHourlyRate,
              employment_type: row.employment_type
            };
          })
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load employees';
        setEmployees([]);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [user]);

  const buildCalculation = (employee: Employee, existing?: PayrollCalculation): PayrollCalculation => {
    const baseSalaryOriginal = existing?.base_salary_original ?? employee.base_salary;
    const salaryAdjustment = existing?.salary_adjustment ?? 0;
    const baseSalary = baseSalaryOriginal + salaryAdjustment;

    const allowances = existing?.allowances ?? 0;
    const bonusAmount = existing?.bonus_amount ?? 0;

    const overtimeHours = existing?.overtime_hours ?? 0;
    const overtimeRate = existing?.overtime_rate ?? employee.hourly_rate * 1.5;
    const overtimePay = overtimeHours * overtimeRate;

    const taxDeduction = existing?.tax_deduction ?? 0;
    const providentFund = existing?.provident_fund ?? 0;
    const otherDeductions = existing?.other_deductions ?? 0;

    const grossPay = baseSalary + allowances + bonusAmount + overtimePay;
    const totalDeductions = taxDeduction + providentFund + otherDeductions;
    const netPay = grossPay - totalDeductions;

    return {
      employee_id: employee.id,
      employee_code: employee.employee_code,
      employee_name: employee.name,
      pay_period_start: existing?.pay_period_start ?? payPeriod.start,
      pay_period_end: existing?.pay_period_end ?? payPeriod.end,
      base_salary_original: baseSalaryOriginal,
      salary_adjustment: salaryAdjustment,
      base_salary: baseSalary,
      allowances,
      bonus_amount: bonusAmount,
      overtime_hours: overtimeHours,
      overtime_rate: overtimeRate,
      overtime_pay: overtimePay,
      gross_pay: grossPay,
      tax_deduction: taxDeduction,
      provident_fund: providentFund,
      other_deductions: otherDeductions,
      total_deductions: totalDeductions,
      net_pay: netPay,
      status: 'calculated'
    };
  };

  const updateCalculation = (employeeId: string, updates: Partial<PayrollCalculation>) => {
    setCalculations((prev) => {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return prev;
      const existing = prev.find((c) => c.employee_id === employeeId);
      if (!existing) return prev;

      const merged: PayrollCalculation = { ...existing, ...updates };
      const next = buildCalculation(employee, merged);
      return prev.map((c) => (c.employee_id === employeeId ? next : c));
    });
  };

  const calculatePayroll = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setCalculating(true);

    const newCalculations: PayrollCalculation[] = selectedEmployees.map(employeeId => {
      const employee = employees.find(emp => emp.id === employeeId)!;
      const existing = calculations.find((c) => c.employee_id === employeeId);
      return buildCalculation(employee, existing);
    });

    setCalculations(newCalculations);
    setCalculating(false);
    setShowPreview(true);
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const savePayrollCalculations = async () => {
    if (!user) return;
    if (calculations.length === 0) return;

    try {
      setSaving(true);
      setError(null);
      const supabase = createSupabaseClient();

      if (!supabase) {
        throw new Error('Supabase is not configured properly. Please check your environment variables.');
      }

      for (const calc of calculations) {
        const { data: payrollRow, error: insertError } = await supabase
          .from('payroll')
          .insert({
            user_id: user.id,
            employee_id: calc.employee_id,
            pay_period_start: calc.pay_period_start,
            pay_period_end: calc.pay_period_end,
            pay_date: calc.pay_period_end,
            base_salary: calc.base_salary,
            overtime_amount: calc.overtime_pay,
            bonus_amount: calc.bonus_amount,
            allowances: calc.allowances,
            gross_salary: calc.gross_pay,
            tax_deduction: calc.tax_deduction,
            provident_fund: calc.provident_fund,
            other_deductions: calc.other_deductions,
            total_deductions: calc.total_deductions,
            net_salary: calc.net_pay,
            currency: 'PKR',
            status: 'draft',
            payment_method: 'bank_transfer',
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        const payrollId = payrollRow?.id as string | undefined;
        if (!payrollId) continue;

        const payrollItems = [
          ...(calc.allowances > 0
            ? [
                {
                  payroll_id: payrollId,
                  item_type: 'earning' as const,
                  item_name: 'Allowances',
                  amount: calc.allowances,
                  is_taxable: true
                }
              ]
            : []),
          ...(calc.bonus_amount > 0
            ? [
                {
                  payroll_id: payrollId,
                  item_type: 'earning' as const,
                  item_name: 'Bonus',
                  amount: calc.bonus_amount,
                  is_taxable: true
                }
              ]
            : []),
          ...(calc.overtime_pay > 0
            ? [
                {
                  payroll_id: payrollId,
                  item_type: 'earning' as const,
                  item_name: 'Overtime',
                  amount: calc.overtime_pay,
                  is_taxable: true
                }
              ]
            : []),
          ...(calc.tax_deduction > 0
            ? [
                {
                  payroll_id: payrollId,
                  item_type: 'deduction' as const,
                  item_name: 'Tax Deduction',
                  amount: calc.tax_deduction,
                  is_taxable: false
                }
              ]
            : []),
          ...(calc.provident_fund > 0
            ? [
                {
                  payroll_id: payrollId,
                  item_type: 'deduction' as const,
                  item_name: 'Provident Fund',
                  amount: calc.provident_fund,
                  is_taxable: false
                }
              ]
            : []),
          ...(calc.other_deductions > 0
            ? [
                {
                  payroll_id: payrollId,
                  item_type: 'deduction' as const,
                  item_name: 'Other Deductions',
                  amount: calc.other_deductions,
                  is_taxable: false
                }
              ]
            : [])
        ];

        if (payrollItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('payroll_items')
            .insert(payrollItems);
          if (itemsError) throw itemsError;
        }
      }

      setShowPreview(false);
      setCalculations([]);
      setSelectedEmployees([]);
      router.push('/payroll');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save payroll';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading employees...</LoadingText>
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        {error && (
          <div style={{ marginBottom: '16px', color: '#ef4444' }}>
            {error}
          </div>
        )}
        {/* Header */}
        <Header>
          <Title>
            <Calculator size={32} />
            Payroll Calculator
          </Title>
          <Subtitle>Calculate employee payroll with bonuses, deductions, and taxes</Subtitle>
        </Header>

        {!showPreview ? (
          <>
            {/* Pay Period Selection */}
            <Card>
              <CardHeader>
                <Calendar size={20} />
                <CardTitle>Pay Period</CardTitle>
              </CardHeader>
              <FormGrid>
                <FormGroup>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={payPeriod.start}
                    onChange={(e) => setPayPeriod(prev => ({ ...prev, start: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={payPeriod.end}
                    onChange={(e) => setPayPeriod(prev => ({ ...prev, end: e.target.value }))}
                  />
                </FormGroup>
              </FormGrid>
            </Card>

            {/* Employee Selection */}
            <Card>
              <CardHeader>
                <Users size={20} />
                <CardTitle>Select Employees ({selectedEmployees.length} selected)</CardTitle>
              </CardHeader>
              
              <ButtonGroup style={{ marginBottom: '24px' }}>
                <Button variant="secondary" onClick={selectAllEmployees}>
                  Select All
                </Button>
                <Button variant="secondary" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </ButtonGroup>

              <EmployeeGrid>
                {employees.map(employee => (
                  <EmployeeCard
                    key={employee.id}
                    selected={selectedEmployees.includes(employee.id)}
                    onClick={() => handleEmployeeSelection(employee.id)}
                  >
                    <EmployeeName>{employee.name}</EmployeeName>
                    <EmployeeDetails>{employee.position} • {employee.department}</EmployeeDetails>
                    <EmployeeSalary>{formatCurrency(employee.base_salary)}</EmployeeSalary>
                  </EmployeeCard>
                ))}
              </EmployeeGrid>
            </Card>

            {/* Calculate Button */}
            <ButtonGroup>
              <Button
                variant="success"
                onClick={calculatePayroll}
                disabled={calculating || selectedEmployees.length === 0}
                style={{ fontSize: '16px', padding: '16px 32px' }}
              >
                {calculating ? (
                  <>
                    <LoadingSpinner style={{ width: '20px', height: '20px' }} />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator size={20} />
                    Calculate Payroll
                  </>
                )}
              </Button>
            </ButtonGroup>
          </>
        ) : (
          <>
            {/* Payroll Results */}
            <Card>
              <CardHeader style={{ justifyContent: 'space-between' }}>
                <div>
                  <CardTitle>Payroll Calculations</CardTitle>
                  <Subtitle style={{ marginTop: '8px' }}>
                    Pay Period: {new Date(payPeriod.start).toLocaleDateString()} - {new Date(payPeriod.end).toLocaleDateString()}
                  </Subtitle>
                </div>
                <ButtonGroup>
                  <Button variant="secondary" onClick={() => setShowPreview(false)}>
                    Back to Selection
                  </Button>
                  <Button onClick={savePayrollCalculations} disabled={saving}>
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Calculations'}
                  </Button>
                </ButtonGroup>
              </CardHeader>
            </Card>

            {/* Summary Cards */}
            <SummaryGrid>
              <SummaryCard>
                <SummaryHeader>
                  <SummaryIcon color="rgba(16, 185, 129, 0.2)">
                    <DollarSign size={24} />
                  </SummaryIcon>
                </SummaryHeader>
                <SummaryValue>
                  {formatCurrency(calculations.reduce((sum, calc) => sum + calc.gross_pay, 0))}
                </SummaryValue>
                <SummaryLabel>Total Gross Pay</SummaryLabel>
              </SummaryCard>

              <SummaryCard>
                <SummaryHeader>
                  <SummaryIcon color="rgba(59, 130, 246, 0.2)">
                    <Plus size={24} />
                  </SummaryIcon>
                </SummaryHeader>
                <SummaryValue>
                  {formatCurrency(calculations.reduce((sum, calc) => sum + calc.allowances + calc.bonus_amount + calc.overtime_pay, 0))}
                </SummaryValue>
                <SummaryLabel>Total Extra Earnings</SummaryLabel>
              </SummaryCard>

              <SummaryCard>
                <SummaryHeader>
                  <SummaryIcon color="rgba(239, 68, 68, 0.2)">
                    <Minus size={24} />
                  </SummaryIcon>
                </SummaryHeader>
                <SummaryValue>
                  {formatCurrency(calculations.reduce((sum, calc) => sum + calc.total_deductions, 0))}
                </SummaryValue>
                <SummaryLabel>Total Deductions</SummaryLabel>
              </SummaryCard>

              <SummaryCard>
                <SummaryHeader>
                  <SummaryIcon color="rgba(16, 185, 129, 0.2)">
                    <DollarSign size={24} />
                  </SummaryIcon>
                </SummaryHeader>
                <SummaryValue>
                  {formatCurrency(calculations.reduce((sum, calc) => sum + calc.net_pay, 0))}
                </SummaryValue>
                <SummaryLabel>Total Net Pay</SummaryLabel>
              </SummaryCard>
            </SummaryGrid>

            {/* Detailed Calculations */}
            <ResultsGrid>
              {calculations.map((calculation) => (
                <ResultCard key={calculation.employee_id}>
                  <ResultHeader>
                    <ResultTitle>
                      {calculation.employee_name} ({calculation.employee_code})
                    </ResultTitle>
                    <ResultAmount>{formatCurrency(calculation.net_pay)}</ResultAmount>
                  </ResultHeader>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px', marginBottom: '12px' }}>
                    <FormGroup>
                      <Label>Salary Adjustment</Label>
                      <Input
                        type="number"
                        value={calculation.salary_adjustment}
                        onChange={(e) => updateCalculation(calculation.employee_id, { salary_adjustment: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Allowances</Label>
                      <Input
                        type="number"
                        value={calculation.allowances}
                        onChange={(e) => updateCalculation(calculation.employee_id, { allowances: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Bonus</Label>
                      <Input
                        type="number"
                        value={calculation.bonus_amount}
                        onChange={(e) => updateCalculation(calculation.employee_id, { bonus_amount: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Overtime Hours</Label>
                      <Input
                        type="number"
                        value={calculation.overtime_hours}
                        onChange={(e) => updateCalculation(calculation.employee_id, { overtime_hours: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Tax Deduction</Label>
                      <Input
                        type="number"
                        value={calculation.tax_deduction}
                        onChange={(e) => updateCalculation(calculation.employee_id, { tax_deduction: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Provident Fund</Label>
                      <Input
                        type="number"
                        value={calculation.provident_fund}
                        onChange={(e) => updateCalculation(calculation.employee_id, { provident_fund: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Other Deductions</Label>
                      <Input
                        type="number"
                        value={calculation.other_deductions}
                        onChange={(e) => updateCalculation(calculation.employee_id, { other_deductions: Number(e.target.value || 0) })}
                      />
                    </FormGroup>
                  </div>
                  
                  <ResultDetails>
                    <ResultRow>
                      <ResultLabel>Salary</ResultLabel>
                      <ResultValue>{formatCurrency(calculation.base_salary)}</ResultValue>
                    </ResultRow>
                    {calculation.allowances > 0 && (
                      <ResultRow>
                        <ResultLabel>Allowances</ResultLabel>
                        <ResultValue>{formatCurrency(calculation.allowances)}</ResultValue>
                      </ResultRow>
                    )}
                    {calculation.bonus_amount > 0 && (
                      <ResultRow>
                        <ResultLabel>Bonus</ResultLabel>
                        <ResultValue>{formatCurrency(calculation.bonus_amount)}</ResultValue>
                      </ResultRow>
                    )}
                    {calculation.overtime_pay > 0 && (
                      <ResultRow>
                        <ResultLabel>
                          Overtime ({calculation.overtime_hours.toFixed(1)}h @ {formatCurrency(calculation.overtime_rate)}/h)
                        </ResultLabel>
                        <ResultValue>{formatCurrency(calculation.overtime_pay)}</ResultValue>
                      </ResultRow>
                    )}
                    <ResultRow style={{ fontWeight: '600', color: 'var(--primary-400)' }}>
                      <ResultLabel>Gross Pay</ResultLabel>
                      <ResultValue>{formatCurrency(calculation.gross_pay)}</ResultValue>
                    </ResultRow>
                    
                    {calculation.tax_deduction > 0 && (
                      <ResultRow>
                        <ResultLabel>Tax Deduction</ResultLabel>
                        <ResultValue>-{formatCurrency(calculation.tax_deduction)}</ResultValue>
                      </ResultRow>
                    )}
                    {calculation.provident_fund > 0 && (
                      <ResultRow>
                        <ResultLabel>Provident Fund</ResultLabel>
                        <ResultValue>-{formatCurrency(calculation.provident_fund)}</ResultValue>
                      </ResultRow>
                    )}
                    {calculation.other_deductions > 0 && (
                      <ResultRow>
                        <ResultLabel>Other Deductions</ResultLabel>
                        <ResultValue>-{formatCurrency(calculation.other_deductions)}</ResultValue>
                      </ResultRow>
                    )}
                    <ResultRow style={{ fontWeight: '600' }}>
                      <ResultLabel>Total Deductions</ResultLabel>
                      <ResultValue>-{formatCurrency(calculation.total_deductions)}</ResultValue>
                    </ResultRow>
                  </ResultDetails>
                </ResultCard>
              ))}
            </ResultsGrid>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}
