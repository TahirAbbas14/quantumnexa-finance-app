'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Calculator, DollarSign, Plus, Minus, FileText, Save, Eye, Users, Calendar } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  base_salary: number;
  hourly_rate: number;
  employment_type: 'full-time' | 'part-time' | 'contract';
  tax_id: string;
  bank_account: string;
}

interface PayrollCalculation {
  employee_id: string;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  bonuses: PayrollBonus[];
  deductions: PayrollDeduction[];
  gross_pay: number;
  tax_deductions: TaxDeduction[];
  net_pay: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
}

interface PayrollBonus {
  id: string;
  type: string;
  description: string;
  amount: number;
  is_taxable: boolean;
}

interface PayrollDeduction {
  id: string;
  type: string;
  description: string;
  amount: number;
  is_pre_tax: boolean;
}

interface TaxDeduction {
  type: string;
  rate: number;
  amount: number;
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

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Mock employees data
  useEffect(() => {
    const mockEmployees: Employee[] = [
      {
        id: 'EMP001',
        name: 'Ahmed Ali',
        position: 'Software Engineer',
        department: 'Engineering',
        base_salary: 120000,
        hourly_rate: 57.69,
        employment_type: 'full-time',
        tax_id: 'TAX001',
        bank_account: 'ACC001'
      },
      {
        id: 'EMP002',
        name: 'Fatima Khan',
        position: 'Product Manager',
        department: 'Product',
        base_salary: 110000,
        hourly_rate: 52.88,
        employment_type: 'full-time',
        tax_id: 'TAX002',
        bank_account: 'ACC002'
      },
      {
        id: 'EMP003',
        name: 'Hassan Sheikh',
        position: 'Designer',
        department: 'Design',
        base_salary: 85000,
        hourly_rate: 40.87,
        employment_type: 'full-time',
        tax_id: 'TAX003',
        bank_account: 'ACC003'
      },
      {
        id: 'EMP004',
        name: 'Ayesha Malik',
        position: 'Marketing Specialist',
        department: 'Marketing',
        base_salary: 65000,
        hourly_rate: 31.25,
        employment_type: 'part-time',
        tax_id: 'TAX004',
        bank_account: 'ACC004'
      },
      {
        id: 'EMP005',
        name: 'Usman Ahmed',
        position: 'Sales Representative',
        department: 'Sales',
        base_salary: 55000,
        hourly_rate: 26.44,
        employment_type: 'full-time',
        tax_id: 'TAX005',
        bank_account: 'ACC005'
      }
    ];

    setTimeout(() => {
      setEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, []);

  const calculatePayroll = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setCalculating(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newCalculations: PayrollCalculation[] = selectedEmployees.map(employeeId => {
      const employee = employees.find(emp => emp.id === employeeId)!;
      
      // Mock overtime data (in real app, this would come from time tracking)
      const overtimeHours = Math.random() * 10; // Random overtime hours
      const overtimeRate = employee.hourly_rate * 1.5; // 1.5x overtime rate
      const overtimePayAmount = overtimeHours * overtimeRate;

      // Mock bonuses
      const bonuses: PayrollBonus[] = [
        {
          id: 'bonus1',
          type: 'Performance',
          description: 'Monthly Performance Bonus',
          amount: Math.random() > 0.5 ? 1000 : 0,
          is_taxable: true
        },
        {
          id: 'bonus2',
          type: 'Commission',
          description: 'Sales Commission',
          amount: employee.department === 'Sales' ? Math.random() * 2000 : 0,
          is_taxable: true
        }
      ].filter(bonus => bonus.amount > 0);

      // Mock deductions
      const deductions: PayrollDeduction[] = [
        {
          id: 'ded1',
          type: 'Health Insurance',
          description: 'Monthly Health Insurance Premium',
          amount: 350,
          is_pre_tax: true
        },
        {
          id: 'ded2',
          type: 'Retirement',
          description: '401(k) Contribution',
          amount: employee.base_salary * 0.05 / 12, // 5% of annual salary
          is_pre_tax: true
        },
        {
          id: 'ded3',
          type: 'Parking',
          description: 'Monthly Parking Fee',
          amount: employee.employment_type === 'full-time' ? 100 : 0,
          is_pre_tax: false
        }
      ].filter(deduction => deduction.amount > 0);

      // Calculate gross pay
      const monthlySalary = employee.base_salary / 12;
      const bonusTotal = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      const grossPay = monthlySalary + overtimePayAmount + bonusTotal;

      // Calculate pre-tax deductions
      const preTaxDeductions = deductions
        .filter(ded => ded.is_pre_tax)
        .reduce((sum, ded) => sum + ded.amount, 0);

      // Calculate taxable income
      const taxableIncome = grossPay - preTaxDeductions;

      // Calculate tax deductions (simplified tax calculation)
      const taxDeductions: TaxDeduction[] = [
        {
          type: 'Federal Income Tax',
          rate: 0.22, // 22% federal tax rate
          amount: taxableIncome * 0.22
        },
        {
          type: 'State Income Tax',
          rate: 0.05, // 5% state tax rate
          amount: taxableIncome * 0.05
        },
        {
          type: 'Social Security',
          rate: 0.062, // 6.2% Social Security
          amount: Math.min(taxableIncome * 0.062, 9932.40) // 2024 SS wage base limit
        },
        {
          type: 'Medicare',
          rate: 0.0145, // 1.45% Medicare
          amount: taxableIncome * 0.0145
        }
      ];

      // Calculate post-tax deductions
      const postTaxDeductions = deductions
        .filter(ded => !ded.is_pre_tax)
        .reduce((sum, ded) => sum + ded.amount, 0);

      // Calculate total tax amount
      const totalTaxes = taxDeductions.reduce((sum, tax) => sum + tax.amount, 0);

      // Calculate net pay
      const netPay = grossPay - preTaxDeductions - totalTaxes - postTaxDeductions;

      return {
        employee_id: employee.id,
        employee_name: employee.name,
        pay_period_start: payPeriod.start,
        pay_period_end: payPeriod.end,
        base_salary: monthlySalary,
        overtime_hours: overtimeHours,
        overtime_rate: overtimeRate,
        overtime_pay: overtimePayAmount,
        bonuses,
        deductions,
        gross_pay: grossPay,
        tax_deductions: taxDeductions,
        net_pay: netPay,
        status: 'calculated' as const
      };
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const savePayrollCalculations = async () => {
    // In a real app, this would save to the database
    console.log('Saving payroll calculations:', calculations);
    alert('Payroll calculations saved successfully!');
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
                    <EmployeeSalary>{formatCurrency(employee.base_salary)}/year</EmployeeSalary>
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
                  <Button onClick={savePayrollCalculations}>
                    <Save size={16} />
                    Save Calculations
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
                  {formatCurrency(calculations.reduce((sum, calc) => 
                    sum + calc.bonuses.reduce((bonusSum, bonus) => bonusSum + bonus.amount, 0), 0
                  ))}
                </SummaryValue>
                <SummaryLabel>Total Bonuses</SummaryLabel>
              </SummaryCard>

              <SummaryCard>
                <SummaryHeader>
                  <SummaryIcon color="rgba(239, 68, 68, 0.2)">
                    <Minus size={24} />
                  </SummaryIcon>
                </SummaryHeader>
                <SummaryValue>
                  {formatCurrency(calculations.reduce((sum, calc) => 
                    sum + calc.deductions.reduce((dedSum, ded) => dedSum + ded.amount, 0) +
                    calc.tax_deductions.reduce((taxSum, tax) => taxSum + tax.amount, 0), 0
                  ))}
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
                      {calculation.employee_name} ({calculation.employee_id})
                    </ResultTitle>
                    <ResultAmount>{formatCurrency(calculation.net_pay)}</ResultAmount>
                  </ResultHeader>
                  
                  <ResultDetails>
                    <ResultRow>
                      <ResultLabel>Base Salary</ResultLabel>
                      <ResultValue>{formatCurrency(calculation.base_salary)}</ResultValue>
                    </ResultRow>
                    {calculation.overtime_pay > 0 && (
                      <ResultRow>
                        <ResultLabel>
                          Overtime ({calculation.overtime_hours.toFixed(1)}h @ {formatCurrency(calculation.overtime_rate)}/h)
                        </ResultLabel>
                        <ResultValue>{formatCurrency(calculation.overtime_pay)}</ResultValue>
                      </ResultRow>
                    )}
                    {calculation.bonuses.map((bonus) => (
                      <ResultRow key={bonus.id}>
                        <ResultLabel>{bonus.description}</ResultLabel>
                        <ResultValue>{formatCurrency(bonus.amount)}</ResultValue>
                      </ResultRow>
                    ))}
                    <ResultRow style={{ fontWeight: '600', color: 'var(--primary-400)' }}>
                      <ResultLabel>Gross Pay</ResultLabel>
                      <ResultValue>{formatCurrency(calculation.gross_pay)}</ResultValue>
                    </ResultRow>
                    
                    {calculation.deductions.map((deduction) => (
                      <ResultRow key={deduction.id}>
                        <ResultLabel>
                          {deduction.description} {deduction.is_pre_tax && '(Pre-tax)'}
                        </ResultLabel>
                        <ResultValue>-{formatCurrency(deduction.amount)}</ResultValue>
                      </ResultRow>
                    ))}
                    {calculation.tax_deductions.map((tax, index) => (
                      <ResultRow key={index}>
                        <ResultLabel>
                          {tax.type} ({(tax.rate * 100).toFixed(1)}%)
                        </ResultLabel>
                        <ResultValue>-{formatCurrency(tax.amount)}</ResultValue>
                      </ResultRow>
                    ))}
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