'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type EmployeeStatus = 'active' | 'inactive' | 'terminated';
type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';

type Employee = {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department: string;
  position: string;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  base_salary: number;
  hire_date: string;
  created_at: string;
  user_id: string;
};

type PayrollStatus = 'draft' | 'processed' | 'paid';

type PayrollRow = {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  gross_salary: number;
  net_salary: number;
  total_deductions: number;
  tax_deduction: number;
  bonus_amount: number;
  overtime_amount: number;
  status: PayrollStatus;
  payment_method: string;
  currency?: string | null;
};

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const HeaderContent = styled.div`
  flex: 1;

  h1 {
    font-size: 26px;
    font-weight: 800;
    color: white;
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const Overview = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 800;
  color: white;
  margin-bottom: 14px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    border-bottom: none;
  }

  .icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    min-width: 0;

    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 2px;
    }

    .value {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.92);
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &.status {
    .content {
      .value {
        overflow: visible;
        text-overflow: unset;
        white-space: normal;
        display: flex;
        align-items: center;
      }
    }
  }
`;

const Badge = styled.span<{ $status: EmployeeStatus }>`
  padding: 6px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: ${props =>
    props.$status === 'active'
      ? 'rgba(16, 185, 129, 0.16)'
      : props.$status === 'inactive'
        ? 'rgba(251, 191, 36, 0.16)'
        : 'rgba(239, 68, 68, 0.16)'};
  color: ${props =>
    props.$status === 'active' ? '#10b981' : props.$status === 'inactive' ? '#fbbf24' : '#ef4444'};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);

  .icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  .value {
    font-size: 20px;
    font-weight: 900;
    color: white;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
  }
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const TableWrap = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const TableHeaderRow = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const TableTitle = styled.div`
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Td = styled.td`
  padding: 12px 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
`;

const EmptyState = styled.div`
  padding: 18px 16px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
`;

const formatMonth = (monthStr: string) => {
  const date = new Date(monthStr + '-01');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const employeeId = use(params as unknown as Promise<{ id: string }>).id;
  const router = useRouter();
  const { user } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payrolls, setPayrolls] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseClient();
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { data: employeeRow, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .eq('user_id', user.id)
          .single();

        if (employeeError) throw employeeError;

        const { data: payrollRows, error: payrollError } = await supabase
          .from('payroll')
          .select(
            'id, employee_id, pay_period_start, pay_period_end, pay_date, gross_salary, net_salary, total_deductions, tax_deduction, bonus_amount, overtime_amount, status, payment_method, currency'
          )
          .eq('employee_id', employeeId)
          .eq('user_id', user.id)
          .order('pay_date', { ascending: false });

        if (payrollError) throw payrollError;

        setEmployee(employeeRow as Employee);
        setPayrolls((payrollRows as PayrollRow[]) || []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load employee';
        setError(message);
        setEmployee(null);
        setPayrolls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, user]);

  const computed = useMemo(() => {
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);

    const paidPayrolls = payrolls.filter((p) => p.status === 'paid');
    const processedPayrolls = payrolls.filter((p) => p.status === 'processed');

    const totalPaid = paidPayrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    const paidThisMonth = paidPayrolls
      .filter((p) => (p.pay_date || '').slice(0, 7) === monthKey)
      .reduce((sum, p) => sum + Number(p.net_salary || 0), 0);

    const pendingAmount = processedPayrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    const lastPaid = paidPayrolls.length > 0 ? paidPayrolls[0] : null;

    const monthly = paidPayrolls.reduce((acc, p) => {
      const key = (p.pay_date || '').slice(0, 7);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + Number(p.net_salary || 0);
      return acc;
    }, {} as Record<string, number>);

    const monthlyRows = Object.entries(monthly)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, amount]) => ({ month, amount }));

    return {
      paidThisMonth,
      totalPaid,
      pendingCount: processedPayrolls.length,
      pendingAmount,
      lastPaidDate: lastPaid?.pay_date || null,
      monthlyRows
    };
  }, [payrolls]);

  const title = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee';

  if (!user) return null;

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <BackButton onClick={() => router.push('/employees')}>
            <ArrowLeft size={20} />
          </BackButton>
          <HeaderContent>
            <h1>{title}</h1>
            <p>{employee ? `${employee.employee_id} • ${employee.department}` : 'Employee details'}</p>
          </HeaderContent>
          <HeaderActions>
            {employee && (
              <Button variant="secondary" onClick={() => router.push(`/employees`)}>
                <Eye size={16} />
                View All
              </Button>
            )}
          </HeaderActions>
        </Header>

        {loading && (
          <Card>
            <EmptyState>Loading employee...</EmptyState>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <div style={{ padding: '18px' }}>
              <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '10px' }}>{error}</div>
              <Button variant="secondary" onClick={() => router.push('/employees')}>
                Back
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && employee && (
          <>
            <Overview>
              <Card>
                <SectionTitle>Employee</SectionTitle>
                <InfoList>
                  <InfoItem className="status">
                    <div className="icon">
                      <CheckCircle size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Status</div>
                      <div className="value">
                        <Badge $status={employee.status}>{employee.status}</Badge>
                      </div>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="icon">
                      <Mail size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Email</div>
                      <div className="value">{employee.email}</div>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="icon">
                      <Phone size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Phone</div>
                      <div className="value">{employee.phone || '-'}</div>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="icon">
                      <Building size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Department</div>
                      <div className="value">{employee.department}</div>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="icon">
                      <Briefcase size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Position</div>
                      <div className="value">{employee.position}</div>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="icon">
                      <Calendar size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Hire date</div>
                      <div className="value">{new Date(employee.hire_date).toLocaleDateString()}</div>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="icon">
                      <DollarSign size={18} />
                    </div>
                    <div className="content">
                      <div className="label">Base salary</div>
                      <div className="value">{formatPKR(employee.base_salary)}</div>
                    </div>
                  </InfoItem>
                </InfoList>
              </Card>

              <Card>
                <SectionTitle>Payroll summary</SectionTitle>
                <SummaryGrid>
                  <SummaryCard>
                    <div className="icon">
                      <DollarSign size={18} />
                    </div>
                    <div className="value">{formatPKR(computed.paidThisMonth)}</div>
                    <div className="label">Paid this month</div>
                  </SummaryCard>
                  <SummaryCard>
                    <div className="icon">
                      <CheckCircle size={18} />
                    </div>
                    <div className="value">{formatPKR(computed.totalPaid)}</div>
                    <div className="label">Total paid</div>
                  </SummaryCard>
                  <SummaryCard>
                    <div className="icon">
                      <AlertCircle size={18} />
                    </div>
                    <div className="value">
                      {computed.pendingCount} • {formatPKR(computed.pendingAmount)}
                    </div>
                    <div className="label">Pending (processed)</div>
                  </SummaryCard>
                  <SummaryCard>
                    <div className="icon">
                      <Clock size={18} />
                    </div>
                    <div className="value">
                      {computed.lastPaidDate ? new Date(computed.lastPaidDate).toLocaleDateString() : '-'}
                    </div>
                    <div className="label">Last paid</div>
                  </SummaryCard>
                </SummaryGrid>
              </Card>
            </Overview>

            <Split>
              <TableWrap>
                <TableHeaderRow>
                  <TableTitle>Monthly paid (last 6)</TableTitle>
                </TableHeaderRow>
                {computed.monthlyRows.length === 0 ? (
                  <EmptyState>No paid payrolls yet.</EmptyState>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Month</Th>
                        <Th>Net paid</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {computed.monthlyRows.map((row) => (
                        <tr key={row.month}>
                          <Td>{formatMonth(row.month)}</Td>
                          <Td>{formatPKR(row.amount)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </TableWrap>

              <TableWrap>
                <TableHeaderRow>
                  <TableTitle>Recent payrolls</TableTitle>
                </TableHeaderRow>
                {payrolls.length === 0 ? (
                  <EmptyState>No payrolls found for this employee.</EmptyState>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Period</Th>
                        <Th>Pay date</Th>
                        <Th>Gross</Th>
                        <Th>Net</Th>
                        <Th>Status</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.slice(0, 10).map((p) => (
                        <tr key={p.id}>
                          <Td>
                            {new Date(p.pay_period_start).toLocaleDateString()} - {new Date(p.pay_period_end).toLocaleDateString()}
                          </Td>
                          <Td>{new Date(p.pay_date).toLocaleDateString()}</Td>
                          <Td>{formatPKR(p.gross_salary)}</Td>
                          <Td>{formatPKR(p.net_salary)}</Td>
                          <Td>{p.status}</Td>
                          <Td>
                            <Button variant="secondary" onClick={() => router.push(`/payroll/${p.id}`)}>
                              <Eye size={16} />
                              View
                            </Button>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </TableWrap>
            </Split>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}
