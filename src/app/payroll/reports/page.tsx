'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Download, Filter, FileText, Calculator } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { createSupabaseClient } from '@/lib/supabase';
import Card from '@/components/ui/Card';

interface PayrollSummary {
  month: string;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  total_taxes: number;
  total_bonuses: number;
  employee_count: number;
  average_salary: number;
}

interface DepartmentPayroll {
  department: string;
  employee_count: number;
  total_payroll: number;
  average_salary: number;
  total_overtime: number;
}

interface PayrollTrend {
  month: string;
  payroll_cost: number;
  employee_count: number;
  average_per_employee: number;
}

interface TaxBreakdown {
  // Index signature added to satisfy Recharts ChartDataInput typing
  [key: string]: string | number;
  tax_type: string;
  name: string;
  amount: number;
  percentage: number;
}

interface DeductionBreakdown {
  deduction_type: string;
  amount: number;
  employee_count: number;
}

interface EmployeeInfo {
  department?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface PayrollRecord {
  pay_date: string;
  gross_salary: number;
  net_salary: number;
  total_deductions: number;
  tax_deduction: number;
  bonus_amount: number;
  overtime_amount: number;
  employee_id: string;
  employees?: EmployeeInfo | null;
}

type SummaryAccumulator = {
  month: string;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  total_taxes: number;
  total_bonuses: number;
  employee_count: Set<string>;
  average_salary: number;
};

type DepartmentAccumulator = {
  department: string;
  employee_count: Set<string>;
  total_payroll: number;
  average_salary: number;
  total_overtime: number;
}

export default function PayrollReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary[]>([]);
  const [departmentPayroll, setDepartmentPayroll] = useState<DepartmentPayroll[]>([]);
  const [payrollTrends, setPayrollTrends] = useState<PayrollTrend[]>([]);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown[]>([]);
  const [deductionBreakdown, setDeductionBreakdown] = useState<DeductionBreakdown[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [reportType, setReportType] = useState<'summary' | 'department' | 'trends' | 'taxes' | 'deductions'>('summary');
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Fetch data from database
  const fetchPayrollData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      if (!supabase) throw new Error('Supabase client is null');
      
      // Fetch payroll data and employees data
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            department,
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .order('pay_date', { ascending: false });
      
      if (payrollError) throw payrollError;

      // Process the data to create the required structures
      if (payrollData && payrollData.length > 0) {
        // Create payroll summary by month
        const typedPayroll = payrollData as PayrollRecord[];
        const summaryByMonth: Record<string, SummaryAccumulator> = typedPayroll.reduce((acc, record) => {
          const month = record.pay_date.substring(0, 7); // YYYY-MM format
          if (!acc[month]) {
            acc[month] = {
              month,
              total_gross_pay: 0,
              total_net_pay: 0,
              total_deductions: 0,
              total_taxes: 0,
              total_bonuses: 0,
              employee_count: new Set<string>(),
              average_salary: 0
            };
          }
          acc[month].total_gross_pay += record.gross_salary || 0;
          acc[month].total_net_pay += record.net_salary || 0;
          acc[month].total_deductions += record.total_deductions || 0;
          acc[month].total_taxes += record.tax_deduction || 0;
          acc[month].total_bonuses += record.bonus_amount || 0;
          acc[month].employee_count.add(record.employee_id);
          return acc;
        }, {} as Record<string, SummaryAccumulator>);

        const summaryArray: PayrollSummary[] = Object.values(summaryByMonth).map((item) => ({
          month: item.month,
          total_gross_pay: item.total_gross_pay,
          total_net_pay: item.total_net_pay,
          total_deductions: item.total_deductions,
          total_taxes: item.total_taxes,
          total_bonuses: item.total_bonuses,
          employee_count: item.employee_count.size,
          average_salary: item.total_gross_pay / item.employee_count.size
        }));

        // Create department payroll data
        const deptData: Record<string, DepartmentAccumulator> = typedPayroll.reduce((acc, record) => {
          const dept = record.employees?.department || 'Unknown';
          if (!acc[dept]) {
            acc[dept] = {
              department: dept,
              employee_count: new Set<string>(),
              total_payroll: 0,
              average_salary: 0,
              total_overtime: 0
            };
          }
          acc[dept].employee_count.add(record.employee_id);
          acc[dept].total_payroll += record.gross_salary || 0;
          acc[dept].total_overtime += record.overtime_amount || 0;
          return acc;
        }, {} as Record<string, DepartmentAccumulator>);

        const departmentArray: DepartmentPayroll[] = Object.values(deptData).map((item) => ({
          department: item.department,
          employee_count: item.employee_count.size,
          total_payroll: item.total_payroll,
          average_salary: item.total_payroll / item.employee_count.size,
          total_overtime: item.total_overtime
        }));

        // Create trends data (last 6 months)
        const trendsData: PayrollTrend[] = summaryArray.slice(0, 6).map((item) => ({
          month: item.month,
          payroll_cost: item.total_gross_pay,
          employee_count: item.employee_count,
          average_per_employee: item.average_salary
        }));

        // Create tax breakdown
        const taxData: TaxBreakdown[] = [
          { tax_type: 'income_tax', name: 'Income Tax', amount: summaryArray[0]?.total_taxes || 0, percentage: 10 },
          { tax_type: 'provident_fund', name: 'Provident Fund', amount: (summaryArray[0]?.total_gross_pay || 0) * 0.08, percentage: 8 }
        ];

        // Create deduction breakdown
        const deductionData: DeductionBreakdown[] = [
          { deduction_type: 'Tax Deductions', amount: summaryArray[0]?.total_taxes || 0, employee_count: summaryArray[0]?.employee_count || 0 },
          { deduction_type: 'Other Deductions', amount: (summaryArray[0]?.total_deductions || 0) - (summaryArray[0]?.total_taxes || 0), employee_count: summaryArray[0]?.employee_count || 0 }
        ];

        setPayrollSummary(summaryArray);
        setDepartmentPayroll(departmentArray);
        setPayrollTrends(trendsData);
        setTaxBreakdown(taxData);
        setDeductionBreakdown(deductionData);
      } else {
        // No data found, set empty arrays
        setPayrollSummary([]);
        setDepartmentPayroll([]);
        setPayrollTrends([]);
        setTaxBreakdown([]);
        setDeductionBreakdown([]);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      // Set empty arrays on error
      setPayrollSummary([]);
      setDepartmentPayroll([]);
      setPayrollTrends([]);
      setTaxBreakdown([]);
      setDeductionBreakdown([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const ChartContainer = styled.div`
  margin-bottom: 1rem;
`;

const TaxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaxItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const TaxIndicator = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  margin-right: 0.75rem;
`;

const TaxInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const TaxName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
`;

const TaxAmount = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'active':
        return 'rgba(16, 185, 129, 0.2)';
      case 'inactive':
        return 'rgba(107, 114, 128, 0.2)';
      default:
        return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'active':
        return 'rgba(16, 185, 129, 0.3)';
      case 'inactive':
        return 'rgba(107, 114, 128, 0.3)';
      default:
        return 'rgba(107, 114, 128, 0.3)';
    }
  }};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 1.5rem;
`;

const SummarySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    padding-top: 1rem;
    margin-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const SummaryLabel = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`;

const SummaryValue = styled.span<{ $highlight?: boolean; $color?: string }>`
  font-size: 0.875rem;
  font-weight: ${props => props.$highlight ? '600' : '500'};
  color: ${props => props.$color || 'white'};
`;

const NetPayHighlight = styled.div`
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const NetPayAmount = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  color: #22C55E;
  margin-bottom: 0.25rem;
`;

const NetPayLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(34, 197, 94, 0.8);
`;

const TableHeader = styled.thead`
  background: rgba(255, 255, 255, 0.05);
`;

const TableHeaderCell = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: white;
  white-space: nowrap;
`;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const currentSummary = payrollSummary.find(summary => summary.month === selectedPeriod) || payrollSummary[0];
  const totalPayrollCost = currentSummary?.total_gross_pay || 0;
  const totalEmployees = currentSummary?.employee_count || 0;
  const averageSalary = currentSummary?.average_salary || 0;
  const totalDeductions = currentSummary?.total_deductions + currentSummary?.total_taxes || 0;

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <LoadingContent>
            <LoadingSpinner />
            <LoadingText>Loading payroll reports...</LoadingText>
          </LoadingContent>
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderContent>
            <h1>Payroll Reports & Analytics</h1>
            <p>Comprehensive payroll insights and reporting dashboard</p>
          </HeaderContent>
        </Header>

        <Card className="mb-10" padding="lg">
          <ControlsRow>
            <ControlsLeft>
              <ControlGroup>
                <ControlLabel>
                  <Calendar size={16} />
                  Period:
                </ControlLabel>
                <Input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
              </ControlGroup>
              <ControlGroup>
                <ControlLabel>
                  <Filter size={16} />
                  Report Type:
                </ControlLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'summary' | 'department' | 'trends' | 'taxes' | 'deductions')}
                >
                  <option value="summary">Summary</option>
                  <option value="department">By Department</option>
                  <option value="trends">Trends</option>
                  <option value="taxes">Tax Breakdown</option>
                  <option value="deductions">Deductions</option>
                </Select>
              </ControlGroup>
            </ControlsLeft>
            <ControlsRight>
              <Button variant="primary">
                <Download size={16} />
                Export PDF
              </Button>
              <Button variant="secondary">
                <FileText size={16} />
                Export Excel
              </Button>
            </ControlsRight>
          </ControlsRow>
        </Card>

        <StatsGrid>
          <StatCard color="var(--primary-500)">
            <StatHeader>
              <StatIcon $color="var(--primary-100)">
                <DollarSign size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatCurrency(totalPayrollCost)}</h3>
              <p>Total Payroll Cost</p>
            </StatValue>
          </StatCard>

          <StatCard color="var(--secondary-500)">
            <StatHeader>
              <StatIcon $color="var(--secondary-100)">
                <Users size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{totalEmployees}</h3>
              <p>Total Employees</p>
            </StatValue>
          </StatCard>

          <StatCard color="var(--accent-500)">
            <StatHeader>
              <StatIcon $color="var(--accent-100)">
                <Calculator size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatCurrency(averageSalary)}</h3>
              <p>Average Salary</p>
            </StatValue>
          </StatCard>

          <StatCard color="var(--error)">
            <StatHeader>
              <StatIcon $color="var(--error-100)">
                <TrendingUp size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatCurrency(totalDeductions)}</h3>
              <p>Total Deductions</p>
            </StatValue>
          </StatCard>
        </StatsGrid>

          <ChartsGrid>
             <Card padding="lg">
               <ChartTitle>Payroll Cost Trends</ChartTitle>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={payrollTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    stroke="rgba(255, 255, 255, 0.8)"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)} 
                    stroke="rgba(255, 255, 255, 0.8)"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="payroll_cost" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="lg">
               <ChartTitle>Payroll by Department</ChartTitle>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentPayroll}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="department" 
                    stroke="rgba(255, 255, 255, 0.8)"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)} 
                    stroke="rgba(255, 255, 255, 0.8)"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total_payroll" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </ChartsGrid>

        {/* Detailed Reports */}
        {reportType === 'summary' && (
           <Card padding="lg">
             <ReportTitle>
              Payroll Summary - {formatMonth(selectedPeriod)}
            </ReportTitle>
            <SummaryGrid>
              <SummarySection>
                <SectionTitle>Earnings</SectionTitle>
                <div>
                  <SummaryItem>
                    <SummaryLabel>Gross Pay</SummaryLabel>
                    <SummaryValue>{formatCurrency(currentSummary?.total_gross_pay || 0)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Bonuses</SummaryLabel>
                    <SummaryValue>{formatCurrency(currentSummary?.total_bonuses || 0)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Total Earnings</SummaryLabel>
                    <SummaryValue $highlight $color="#10B981">
                      {formatCurrency((currentSummary?.total_gross_pay || 0) + (currentSummary?.total_bonuses || 0))}
                    </SummaryValue>
                  </SummaryItem>
                </div>
              </SummarySection>

              <SummarySection>
                <SectionTitle>Deductions</SectionTitle>
                <div>
                  <SummaryItem>
                    <SummaryLabel>Pre-tax Deductions</SummaryLabel>
                    <SummaryValue>{formatCurrency(currentSummary?.total_deductions || 0)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Taxes</SummaryLabel>
                    <SummaryValue>{formatCurrency(currentSummary?.total_taxes || 0)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Total Deductions</SummaryLabel>
                    <SummaryValue $highlight $color="#EF4444">
                      {formatCurrency((currentSummary?.total_deductions || 0) + (currentSummary?.total_taxes || 0))}
                    </SummaryValue>
                  </SummaryItem>
                </div>
              </SummarySection>

              <SummarySection>
                <SectionTitle>Net Pay</SectionTitle>
                <NetPayHighlight>
                  <NetPayAmount>
                    {formatCurrency(currentSummary?.total_net_pay || 0)}
                  </NetPayAmount>
                  <NetPayLabel>
                    Total take-home pay
                  </NetPayLabel>
                </NetPayHighlight>
                <div>
                  <SummaryItem>
                    <SummaryLabel>Average per employee</SummaryLabel>
                    <SummaryValue>
                      {formatCurrency((currentSummary?.total_net_pay || 0) / (currentSummary?.employee_count || 1))}
                    </SummaryValue>
                  </SummaryItem>
                </div>
              </SummarySection>
            </SummaryGrid>
          </Card>
        )}

        {reportType === 'department' && (
           <Card padding="lg">
             <ReportTitle>Department Payroll Breakdown</ReportTitle>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Department</TableHeaderCell>
                    <TableHeaderCell>Employees</TableHeaderCell>
                    <TableHeaderCell>Total Payroll</TableHeaderCell>
                    <TableHeaderCell>Average Salary</TableHeaderCell>
                    <TableHeaderCell>Overtime</TableHeaderCell>
                    <TableHeaderCell>% of Total</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {departmentPayroll.map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell>{dept.department}</TableCell>
                      <TableCell>{dept.employee_count}</TableCell>
                      <TableCell>{formatCurrency(dept.total_payroll)}</TableCell>
                      <TableCell>{formatCurrency(dept.average_salary)}</TableCell>
                      <TableCell>{formatCurrency(dept.total_overtime)}</TableCell>
                      <TableCell>{((dept.total_payroll / totalPayrollCost) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        )}

        {reportType === 'taxes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
            <Card padding="lg">
               <ChartTitle>Tax Breakdown</ChartTitle>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taxBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {taxBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="lg">
               <ReportTitle>Tax Details</ReportTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {taxBreakdown.map((tax, index) => (
                  <div key={tax.tax_type} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.75rem', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          marginRight: '0.75rem',
                          backgroundColor: COLORS[index % COLORS.length] 
                        }}
                      ></div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white' }}>{tax.tax_type}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white' }}>{formatCurrency(tax.amount)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>{tax.percentage}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {reportType === 'deductions' && (
           <Card padding="lg">
             <ReportTitle>Employee Deductions</ReportTitle>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Deduction Type</TableHeaderCell>
                    <TableHeaderCell>Total Amount</TableHeaderCell>
                    <TableHeaderCell>Employees Enrolled</TableHeaderCell>
                    <TableHeaderCell>Average per Employee</TableHeaderCell>
                    <TableHeaderCell>Enrollment Rate</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {deductionBreakdown.map((deduction) => (
                    <TableRow key={deduction.deduction_type}>
                      <TableCell>{deduction.deduction_type}</TableCell>
                      <TableCell>{formatCurrency(deduction.amount)}</TableCell>
                      <TableCell>{deduction.employee_count}</TableCell>
                      <TableCell>{formatCurrency(deduction.amount / deduction.employee_count)}</TableCell>
                      <TableCell>{((deduction.employee_count / totalEmployees) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        )}
      </Container>
    </DashboardLayout>
  );
}

// Styled Components - Updated to match Dashboard design
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

const ControlsRow = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;

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
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const ControlsLeft = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`;

const ControlsRight = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ControlLabel = styled.label`
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.5);
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 140px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.6);
    background: rgba(20, 20, 20, 0.8);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.4);
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

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.5);
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 140px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.6);
    background: rgba(20, 20, 20, 0.8);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.4);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
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

const StatCard = styled(Card)<{ color?: string }>`
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

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const StatIcon = styled.div<{ $color?: string }>`
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

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const StatValue = styled.div`
  flex: 1;

  h3 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #ffffff;
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      font-size: 24px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 4px;

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`;

const StatChange = styled.p<{ $positive?: boolean }>`
  color: ${props => props.$positive ? '#10B981' : '#F59E0B'};
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0.25rem 0 0 0;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 24px;
  }
`;

const ChartTitle = styled.h3`
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const ReportTitle = styled.h3`
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const SummarySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    padding-top: 1rem;
    margin-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const SummaryLabel = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`;

const SummaryValue = styled.span<{ $highlight?: boolean; $color?: string }>`
  font-size: 0.875rem;
  font-weight: ${props => props.$highlight ? '600' : '500'};
  color: ${props => props.$color || 'white'};
`;

const NetPayHighlight = styled.div`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const NetPayAmount = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  color: #3B82F6;
  margin-bottom: 0.25rem;
`;

const NetPayLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(59, 130, 246, 0.8);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: rgba(255, 255, 255, 0.05);
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const TableHeaderCell = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: white;
  white-space: nowrap;
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingContent = styled.div`
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: white;
  font-size: 1.1rem;
`;