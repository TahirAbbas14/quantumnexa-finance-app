'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ExpenseBreakdownChart from '@/components/dashboard/ExpenseBreakdownChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  CreditCard, 
  DollarSign,
  Calendar,
  Plus,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Target,
  PiggyBank,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  currentBalance: number;
  activeProjects: number;
  totalClients: number;
  pendingInvoices: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
  }>;
  budgetData?: {
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    activeBudgets: number;
    criticalAlerts: number;
  };
  savingsData?: {
    totalSavingsGoals: number;
    totalSaved: number;
    savingsProgress: number;
    activeGoals: number;
    completedGoals: number;
  };
}

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

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 6px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);

    @media (max-width: 768px) {
      font-size: 14px;
    }

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const StatCard = styled(Card)<{ color?: string }>`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || 'var(--primary-500)'};
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$color || 'var(--primary-100)'};
  color: ${props => props.$color?.replace('100', '600') || 'var(--primary-600)'};

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const StatValue = styled.div`
  h3 {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;

    @media (max-width: 768px) {
      font-size: 24px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
    display: flex;
    align-items: center;
    gap: 4px;

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
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

const RecentActivity = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div<{ $type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$type) {
      case 'invoice': return 'var(--accent-100)';
      case 'payment': return 'var(--secondary-100)';
      case 'expense': return 'var(--error-100)';
      default: return 'var(--primary-100)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'invoice': return 'var(--accent-600)';
      case 'payment': return 'var(--secondary-600)';
      case 'expense': return 'var(--error-600)';
      default: return 'var(--primary-600)';
    }
  }};
`;

const ActivityContent = styled.div`
  flex: 1;
  
  h4 {
    font-size: 14px;
    font-weight: 500;
    color: white;
    margin-bottom: 2px;
  }
  
  p {
    font-size: 12px;
    color: var(--gray-300);
  }
`;

const ActivityAmount = styled.div<{ $type: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => {
    switch (props.$type) {
      case 'expense': return 'var(--error-600)';
      case 'payment': return 'var(--secondary-600)';
      default: return 'var(--gray-800)';
    }
  }};
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
`;

const ActionCard = styled(Card)`
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  pointer-events: auto;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  .icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-600);
    color: white;
    pointer-events: none;

    @media (max-width: 480px) {
      width: 40px;
      height: 40px;
      margin: 0 auto 12px;
    }
  }
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
    pointer-events: none;

    @media (max-width: 480px) {
      font-size: 14px;
      margin-bottom: 4px;
    }
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
    pointer-events: none;

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
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

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.log('No user ID available for dashboard data');
        setLoading(false);
        return;
      }

      console.log('Fetching dashboard data for user:', user.id);
      
      const supabase = createSupabaseClient();
      
      if (!supabase) {
        console.error('Supabase client is not initialized');
        setLoading(false);
        return;
      }
      
      // Fetch all data in parallel
      const [
        { data: invoices, error: invoicesError },
        { data: expenses, error: expensesError },
        { data: projects, error: projectsError },
        { data: clients, error: clientsError },
        { data: payments, error: paymentsError },
        { data: budgets, error: budgetsError },
        { data: budgetItems, error: budgetItemsError },
        { data: savingsGoals, error: savingsGoalsError },
        { data: savingsTransactions, error: savingsTransactionsError },
        { data: budgetAlerts, error: budgetAlertsError }
      ] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user!.id),
        supabase.from('expenses').select('*').eq('user_id', user?.id),
        supabase.from('projects').select('*').eq('user_id', user?.id),
        supabase.from('clients').select('*').eq('user_id', user?.id),
        supabase.from('payments').select('*').eq('user_id', user?.id),
        supabase.from('budgets').select('*').eq('user_id', user?.id),
        supabase.from('budget_items').select('*').eq('user_id', user?.id),
        supabase.from('savings_goals').select('*').eq('user_id', user?.id),
        supabase.from('savings_transactions').select('*').eq('user_id', user?.id),
        supabase.from('budget_alerts').select('*').eq('user_id', user?.id).eq('status', 'active')
      ]);

      // Log any errors
      if (clientsError) console.error('Error fetching clients:', clientsError);
      if (projectsError) console.error('Error fetching projects:', projectsError);
      if (invoicesError) console.error('Error fetching invoices:', invoicesError);
      if (expensesError) console.error('Error fetching expenses:', expensesError);

      // Log data counts
      console.log('Dashboard data fetched:');
      console.log('- Clients:', clients?.length || 0);
      console.log('- Projects:', projects?.length || 0);
      console.log('- Invoices:', invoices?.length || 0);
      console.log('- Expenses:', expenses?.length || 0);

      // Calculate stats
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const currentBalance = totalRevenue - totalExpenses;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const totalClients = clients?.length || 0;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'sent').length || 0;

      // Budget calculations
      const totalBudget = budgets?.reduce((sum, budget) => sum + (budget.amount || 0), 0) || 0;
      const totalSpent = budgetItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      const activeBudgets = budgets?.filter(b => b.status === 'active').length || 0;
      const criticalAlerts = budgetAlerts?.filter(alert => alert.severity === 'critical').length || 0;

      // Savings calculations
      const totalSavingsGoals = savingsGoals?.reduce((sum, goal) => sum + (goal.target_amount || 0), 0) || 0;
      const totalSaved = savingsTransactions?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
      const savingsProgress = totalSavingsGoals > 0 ? (totalSaved / totalSavingsGoals) * 100 : 0;
      const activeGoals = savingsGoals?.filter(g => g.status === 'active').length || 0;
      const completedGoals = savingsGoals?.filter(g => g.status === 'completed').length || 0;

      // Recent transactions (last 5)
      const recentTransactions = [
        ...(invoices?.slice(-3).map(inv => ({
          type: 'invoice',
          description: `Invoice #${inv.invoice_number}`,
          amount: inv.total_amount,
          date: inv.created_at
        })) || []),
        ...(expenses?.slice(-2).map(exp => ({
          type: 'expense',
          description: exp.description,
          amount: exp.amount,
          date: exp.created_at
        })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      setStats({
        totalRevenue,
        totalExpenses,
        currentBalance,
        activeProjects,
        totalClients,
        pendingInvoices,
        recentTransactions: recentTransactions.map((tx, idx) => ({
          id: `${tx.type}-${idx}`,
          type: tx.type,
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          category: tx.type === 'expense' ? 'Expense' : 'Invoice'
        })),
        budgetData: {
          totalBudget,
          totalSpent,
          budgetUtilization,
          activeBudgets,
          criticalAlerts
        },
        savingsData: {
          totalSavingsGoals,
          totalSaved,
          savingsProgress,
          activeGoals,
          completedGoals
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Dashboard</h1>
          <p>Welcome back! Here&apos;s what&apos;s happening with your business today.</p>
        </Header>

        <StatsGrid>
          <StatCard variant="glass" color="var(--secondary-500)">
            <StatHeader>
              <StatIcon $color="var(--secondary-100)">
                <TrendingUp size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatPKR(stats?.totalRevenue || 0)}</h3>
              <p>
                <TrendingUp size={16} />
                Total Revenue
              </p>
            </StatValue>
          </StatCard>

          <StatCard variant="glass" color="var(--error-500)">
            <StatHeader>
              <StatIcon $color="var(--error-100)">
                <TrendingDown size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatPKR(stats?.totalExpenses || 0)}</h3>
              <p>
                <TrendingDown size={16} />
                Total Expenses
              </p>
            </StatValue>
          </StatCard>

          {/* Balance Card */}
          <StatCard variant="glass" color={(stats?.currentBalance ?? 0) >= 0 ? "var(--success-500)" : "var(--error-500)"}>
            <StatHeader>
              <StatIcon $color={(stats?.currentBalance ?? 0) >= 0 ? "var(--success-100)" : "var(--error-100)"}>
                <DollarSign size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatPKR(stats?.currentBalance || 0)}</h3>
              <p>
                <DollarSign size={16} />
                Current Balance
              </p>
            </StatValue>
          </StatCard>

          <StatCard variant="glass" color="var(--primary-500)">
            <StatHeader>
              <StatIcon $color="var(--primary-100)">
                <Users size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{stats?.totalClients || 0}</h3>
              <p>
                <Users size={16} />
                Total Clients
              </p>
            </StatValue>
          </StatCard>

          <StatCard variant="glass" color="var(--accent-500)">
            <StatHeader>
              <StatIcon $color="var(--accent-100)">
                <FileText size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{stats?.activeProjects || 0}</h3>
              <p>
                <FileText size={16} />
                Active Projects
              </p>
            </StatValue>
          </StatCard>

          {/* Budget Overview Card */}
          <StatCard variant="glass" color="var(--warning-500)">
            <StatHeader>
              <StatIcon $color="var(--warning-100)">
                <Target size={24} />
              </StatIcon>
              {stats?.budgetData?.criticalAlerts && stats.budgetData.criticalAlerts > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error-500)' }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>
                    {stats.budgetData.criticalAlerts} Alert{stats.budgetData.criticalAlerts > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </StatHeader>
            <StatValue>
              <h3>{formatPKR(stats?.budgetData?.totalBudget || 0)}</h3>
              <p>
                <Target size={16} />
                Total Budget ({stats?.budgetData?.activeBudgets || 0} active)
              </p>
              {stats?.budgetData && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: stats.budgetData.budgetUtilization > 90 ? 'var(--error-400)' : 
                         stats.budgetData.budgetUtilization > 75 ? 'var(--warning-400)' : 'var(--success-400)'
                }}>
                  {stats.budgetData.budgetUtilization.toFixed(1)}% utilized
                </div>
              )}
            </StatValue>
          </StatCard>

          {/* Savings Overview Card */}
          <StatCard variant="glass" color="var(--success-500)">
            <StatHeader>
              <StatIcon $color="var(--success-100)">
                <PiggyBank size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatPKR(stats?.savingsData?.totalSaved || 0)}</h3>
              <p>
                <PiggyBank size={16} />
                Total Saved ({stats?.savingsData?.activeGoals || 0} goals)
              </p>
              {stats?.savingsData && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: 'var(--success-400)'
                }}>
                  {stats.savingsData.savingsProgress.toFixed(1)}% of goals achieved
                </div>
              )}
            </StatValue>
          </StatCard>
        </StatsGrid>

        <ChartsGrid>
          <Card variant="glass" padding="lg">
            <Card.Header>
              <h3>Revenue Overview</h3>
              <p>Monthly revenue and expenses comparison</p>
            </Card.Header>
            <Card.Content>
              <RevenueChart />
            </Card.Content>
          </Card>

          <Card variant="glass" padding="lg">
            <Card.Header>
              <h3>Expense Breakdown</h3>
              <p>Categories distribution</p>
            </Card.Header>
            <Card.Content>
              <ExpenseBreakdownChart />
            </Card.Content>
          </Card>
        </ChartsGrid>

        <RecentActivity>
          <Card variant="glass" padding="lg">
            <Card.Header>
              <h3>Recent Activity</h3>
              <p>Latest transactions and updates</p>
            </Card.Header>
            <Card.Content>
              {stats?.recentTransactions.slice(0, 5).map((transaction, index) => (
                <ActivityItem key={index}>
                  <ActivityIcon $type={transaction.type}>
                    {transaction.type === 'invoice' ? <FileText size={20} /> : <CreditCard size={20} />}
                  </ActivityIcon>
                  <ActivityContent>
                    <h4>{transaction.description}</h4>
                    <p>{new Date(transaction.date).toLocaleDateString()}</p>
                  </ActivityContent>
                  <ActivityAmount $type={transaction.type}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatPKR(transaction.amount)}
                  </ActivityAmount>
                </ActivityItem>
              ))}
              {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: 'var(--gray-400)' 
                }}>
                  <Activity size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No recent activity to display</p>
                </div>
              )}
              {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/activity')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '14px',
                      padding: '8px 16px'
                    }}
                  >
                    See All Activities
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card variant="glass" padding="lg">
            <Card.Header>
              <h3>Quick Actions</h3>
              <p>Common tasks and shortcuts</p>
            </Card.Header>
            <Card.Content>
              <QuickActions>
                <ActionCard 
                  variant="glass" 
                  padding="md"
                  onClick={() => router.push('/invoices/new')}
                >
                  <div className="icon">
                    <Plus size={24} />
                  </div>
                  <h3>New Invoice</h3>
                  <p>Create invoice</p>
                </ActionCard>

                <ActionCard 
                  variant="glass" 
                  padding="md"
                  onClick={() => router.push('/expenses/new')}
                >
                  <div className="icon">
                    <CreditCard size={24} />
                  </div>
                  <h3>Add Expense</h3>
                  <p>Record expense</p>
                </ActionCard>

                <ActionCard 
                  variant="glass" 
                  padding="md"
                  onClick={() => router.push('/clients/new')}
                >
                  <div className="icon">
                    <Users size={24} />
                  </div>
                  <h3>New Client</h3>
                  <p>Add client</p>
                </ActionCard>

                <ActionCard 
                  variant="glass" 
                  padding="md"
                  onClick={() => router.push('/projects/new')}
                >
                  <div className="icon">
                    <FileText size={24} />
                  </div>
                  <h3>New Project</h3>
                  <p>Start project</p>
                </ActionCard>
              </QuickActions>
            </Card.Content>
          </Card>
        </RecentActivity>
      </Container>
    </DashboardLayout>
  );
}