'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Edit, 
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Pause,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  PiggyBank,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TitleBlock = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
  }

  p {
    margin: 8px 0 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.4;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.10);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
`;

const StatValue = styled.div`
  margin-top: 6px;
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
`;

const StatHint = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
`;

interface StatIconProps {
  $color?: string;
  $textColor?: string;
}

const StatIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$color' && prop !== '$textColor'
})<StatIconProps>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$color || 'var(--primary-100)'};
  color: ${props => props.$textColor || 'var(--primary-600)'};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ControlsBar = styled.div`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 16px;
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const TextInput = styled.input`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  outline: none;
  min-width: 220px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  outline: none;
  min-width: 160px;

  option {
    background: #101010;
    color: #fff;
  }
`;

const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const GoalCard = styled(Card)<{ goalColor?: string }>`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.10);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.goalColor || 'var(--primary-500)'};
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div<{ percentage: number; color?: string }>`
  height: 100%;
  background: ${props => props.color || 'var(--success-500)'};
  width: ${props => Math.min(props.percentage, 100)}%;
  transition: width 0.3s ease;
  border-radius: 6px;
`;

const StatusBadge = styled.span<{ status: 'completed' | 'active' | 'paused' | 'cancelled' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  background: ${props => {
    switch (props.status) {
      case 'completed': return 'rgba(16, 185, 129, 0.18)';
      case 'active': return 'rgba(59, 130, 246, 0.18)';
      case 'paused': return 'rgba(245, 158, 11, 0.18)';
      case 'cancelled': return 'rgba(239, 68, 68, 0.18)';
      default: return 'rgba(255, 255, 255, 0.10)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#34d399';
      case 'active': return '#60a5fa';
      case 'paused': return '#fbbf24';
      case 'cancelled': return '#f87171';
      default: return 'rgba(255, 255, 255, 0.80)';
    }
  }};
`;

const PriorityBadge = styled.span<{ priority?: 'high' | 'medium' | 'low' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  background: ${props => {
    switch (props.priority) {
      case 'high': return 'rgba(239, 68, 68, 0.18)';
      case 'medium': return 'rgba(245, 158, 11, 0.18)';
      case 'low': return 'rgba(16, 185, 129, 0.18)';
      default: return 'rgba(255, 255, 255, 0.10)';
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      case 'low': return '#34d399';
      default: return 'rgba(255, 255, 255, 0.80)';
    }
  }};
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const ModalTitle = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    color: #fff;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.85);
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  outline: none;
  resize: vertical;
`;

const InlineCard = styled.div`
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
`;

const ErrorText = styled.div`
  margin-top: 10px;
  font-size: 13px;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyCard = styled(Card)`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SidebarCard = styled(Card)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
`;

const SidebarTitle = styled.div`
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 12px;
`;

const TxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TxItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
`;

const TxIcon = styled.div<{ $tone: 'green' | 'red' }>`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  background: ${props => (props.$tone === 'green' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)')};
  color: ${props => (props.$tone === 'green' ? '#34d399' : '#f87171')};
`;

const TxText = styled.div`
  flex: 1;
  min-width: 0;
`;

const TxTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
`;

const TxMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.35;
`;

const TxAmount = styled.div`
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
`;

const ActionIconButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    color: #fff;
  }
`;

// Interfaces
interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface SavingsTransaction {
  id: string;
  savings_goal_id: string;
  amount: number;
  transaction_type: 'contribution' | 'withdrawal';
  description?: string;
  transaction_date: string;
  created_at: string;
  savings_goals?: {
    name?: string;
    color?: string;
  } | null;
}

export default function SavingsPage() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { user } = useAuth();

  const fetchSavingsGoals = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const goals = (data || []) as SavingsGoal[];
      const goalIds = goals.map((g) => g.id).filter(Boolean);

      if (goalIds.length === 0) {
        setSavingsGoals([]);
        return;
      }

      const { data: txData, error: txError } = await supabase
        .from('savings_transactions')
        .select('savings_goal_id, amount, transaction_type')
        .eq('user_id', user?.id)
        .in('savings_goal_id', goalIds);
      if (txError) throw txError;

      const totals = new Map<string, number>();
      (txData || []).forEach((t: { savings_goal_id: string; amount: number; transaction_type: string }) => {
        const prev = totals.get(t.savings_goal_id) || 0;
        const amt = Number(t.amount || 0);
        const delta = t.transaction_type === 'withdrawal' ? -amt : amt;
        totals.set(t.savings_goal_id, prev + delta);
      });

      setSavingsGoals(
        goals.map((g) => {
          const computed = totals.get(g.id) ?? Number(g.current_amount || 0);
          const computedSafe = Math.max(0, computed);
          const computedStatus: SavingsGoal['status'] =
            g.target_amount > 0 && computedSafe >= g.target_amount ? 'completed' : g.status;
          return { ...g, current_amount: computedSafe, status: computedStatus };
        })
      );
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchRecentTransactions = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*, savings_goals ( name, color )')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user?.id]);

  const deleteGoal = async (goalId: string) => {
    if (!user?.id) return;
    const supabase = createSupabaseClient();
    if (!supabase) return;
    const confirmed = window.confirm('Delete this savings goal? This will also delete its transactions.');
    if (!confirmed) return;
    const { error: txError } = await supabase
      .from('savings_transactions')
      .delete()
      .eq('savings_goal_id', goalId)
      .eq('user_id', user.id);
    if (txError) {
      alert('Failed to delete goal transactions');
      return;
    }
    const { error } = await supabase.from('savings_goals').delete().eq('id', goalId).eq('user_id', user.id);
    if (error) {
      alert('Failed to delete goal');
      return;
    }
    await fetchSavingsGoals();
    await fetchRecentTransactions();
  };

  useEffect(() => {
    if (user) {
      fetchSavingsGoals();
      fetchRecentTransactions();
    }
  }, [user, fetchSavingsGoals, fetchRecentTransactions]);

  const calculateStats = () => {
    const activeGoals = savingsGoals.filter(g => g.status === 'active');
    const completedGoals = savingsGoals.filter(g => g.status === 'completed');
    
    const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const totalCompleted = completedGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalSaved,
      totalCompleted,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      overallProgress
    };
  };

  const getGoalProgress = (goal: SavingsGoal) => {
    return goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  };

  const getDaysRemaining = (targetDate: string) => {
    return differenceInDays(new Date(targetDate), new Date());
  };

  const filteredGoals = savingsGoals.filter(goal => {
    const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || goal.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = calculateStats();

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin" size={32} />
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <TitleBlock>
            <h1>Savings</h1>
            <p>Create savings goals and record contributions/withdrawals.</p>
          </TitleBlock>
          <HeaderActions>
            <Button onClick={() => setShowAddGoal(true)}>
              <Plus size={16} />
              Add Savings Goal
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Total Target</StatLabel>
                <StatValue>{formatPKR(stats.totalTarget)}</StatValue>
              </div>
              <StatIcon $color="var(--primary-100)" $textColor="var(--primary-600)">
                <Target size={24} />
              </StatIcon>
            </StatHeader>
            <StatHint>{stats.activeGoals} active goals</StatHint>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Total Saved</StatLabel>
                <StatValue>{formatPKR(stats.totalSaved)}</StatValue>
              </div>
              <StatIcon $color="var(--success-100)" $textColor="var(--success-600)">
                <PiggyBank size={24} />
              </StatIcon>
            </StatHeader>
            <StatHint>{stats.overallProgress.toFixed(1)}% of target</StatHint>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Completed Goals</StatLabel>
                <StatValue>{formatPKR(stats.totalCompleted)}</StatValue>
              </div>
              <StatIcon $color="var(--accent-100)" $textColor="var(--accent-600)">
                <Trophy size={24} />
              </StatIcon>
            </StatHeader>
            <StatHint>{stats.completedGoals} goals achieved</StatHint>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Overall Progress</StatLabel>
                <StatValue>{stats.overallProgress.toFixed(1)}%</StatValue>
              </div>
              <StatIcon $color="var(--warning-100)" $textColor="var(--warning-600)">
                <TrendingUp size={24} />
              </StatIcon>
            </StatHeader>
            <ProgressBar style={{ height: '6px', margin: '0' }}>
              <ProgressFill percentage={stats.overallProgress} color="#10b981" />
            </ProgressBar>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <div>
            <ControlsBar>
              <ControlsRow>
                <TextInput
                  placeholder="Search goals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </ControlsRow>
            </ControlsBar>

            {filteredGoals.length === 0 ? (
              <EmptyCard>
                <Target size={40} style={{ marginBottom: '12px', color: 'rgba(255, 255, 255, 0.55)' }} />
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.95)' }}>
                  {savingsGoals.length === 0 ? 'No savings goals yet' : 'No goals match your filters'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)' }}>
                  {savingsGoals.length === 0
                    ? 'Create a goal and start tracking progress with contributions.'
                    : 'Try adjusting search, status, or priority filters.'}
                </div>
                <div style={{ marginTop: '14px' }}>
                  <Button onClick={() => setShowAddGoal(true)}>
                    <Plus size={16} />
                    Create Goal
                  </Button>
                </div>
              </EmptyCard>
            ) : (
              <GoalsGrid>
                {filteredGoals.map(goal => {
                  const progress = getGoalProgress(goal);
                  const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;

                  return (
                    <GoalCard key={goal.id} goalColor={goal.color}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.95)' }}>
                              {goal.name}
                            </div>
                            <StatusBadge status={goal.status}>
                              {goal.status === 'completed' && <CheckCircle size={12} />}
                              {goal.status === 'active' && <Clock size={12} />}
                              {goal.status === 'paused' && <Pause size={12} />}
                              {goal.status === 'cancelled' && <X size={12} />}
                              {goal.status}
                            </StatusBadge>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <PriorityBadge priority={goal.priority}>{goal.priority} priority</PriorityBadge>
                            {daysRemaining !== null && (
                              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
                                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <ActionIconButton
                            onClick={() => {
                              setSelectedGoal(goal);
                              setShowAddTransaction(true);
                            }}
                            title="Add transaction"
                          >
                            <DollarSign size={16} />
                          </ActionIconButton>
                          <ActionIconButton
                            onClick={() => {
                              setEditingGoal(goal);
                              setShowEditGoal(true);
                            }}
                            title="Edit goal"
                          >
                            <Edit size={16} />
                          </ActionIconButton>
                          <ActionIconButton onClick={() => deleteGoal(goal.id)} title="Delete goal">
                            <X size={16} />
                          </ActionIconButton>
                        </div>
                      </div>

                      {goal.description && (
                        <div style={{ marginTop: '10px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.70)' }}>
                          {goal.description}
                        </div>
                      )}

                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                          <div style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Progress</div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.92)', fontWeight: 800 }}>
                            {formatPKR(goal.current_amount)} / {formatPKR(goal.target_amount)}
                          </div>
                        </div>

                        <ProgressBar>
                          <ProgressFill percentage={progress} color={goal.color} />
                        </ProgressBar>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.60)' }}>
                          <span>{progress.toFixed(1)}% completed</span>
                          <span>{formatPKR(Math.max(goal.target_amount - goal.current_amount, 0))} remaining</span>
                        </div>
                      </div>

                      {goal.target_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
                          <Calendar size={14} />
                          <span>Target: {format(new Date(goal.target_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </GoalCard>
                  );
                })}
              </GoalsGrid>
            )}
          </div>

          <Sidebar>
            <SidebarCard>
              <SidebarTitle>Recent Transactions</SidebarTitle>
              {transactions.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>No transactions yet.</div>
              ) : (
                <TxList>
                  {transactions.map((t) => {
                    const tone = t.transaction_type === 'contribution' ? 'green' : 'red';
                    const title = t.savings_goals?.name || 'Savings goal';
                    const dateText = t.transaction_date ? format(new Date(t.transaction_date), 'MMM d, yyyy') : '';
                    return (
                      <TxItem key={t.id}>
                        <TxIcon $tone={tone}>
                          {t.transaction_type === 'contribution' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </TxIcon>
                        <TxText>
                          <TxTitle>{title}</TxTitle>
                          <TxMeta>
                            {t.description ? `${t.description} • ` : ''}
                            {dateText}
                          </TxMeta>
                        </TxText>
                        <TxAmount>
                          {t.transaction_type === 'withdrawal' ? '-' : '+'}
                          {formatPKR(Number(t.amount || 0))}
                        </TxAmount>
                      </TxItem>
                    );
                  })}
                </TxList>
              )}
            </SidebarCard>
          </Sidebar>
        </ContentGrid>

        {showAddGoal && (
          <AddSavingsGoalModal
            onClose={() => setShowAddGoal(false)}
            onSuccess={() => {
              setShowAddGoal(false);
              fetchSavingsGoals();
            }}
          />
        )}

        {showAddTransaction && selectedGoal && (
          <AddTransactionModal
            goal={selectedGoal}
            onClose={() => {
              setShowAddTransaction(false);
              setSelectedGoal(null);
            }}
            onSuccess={() => {
              setShowAddTransaction(false);
              setSelectedGoal(null);
              fetchSavingsGoals();
              fetchRecentTransactions();
            }}
          />
        )}

        {showEditGoal && editingGoal && (
          <EditSavingsGoalModal
            goal={editingGoal}
            onClose={() => {
              setShowEditGoal(false);
              setEditingGoal(null);
            }}
            onSuccess={() => {
              setShowEditGoal(false);
              setEditingGoal(null);
              fetchSavingsGoals();
            }}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

function AddSavingsGoalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: '#10b981'
  });

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError('You must be logged in.');
        return;
      }

      const target = Number(formData.target_amount);
      if (!formData.name.trim()) {
        setError('Goal name is required.');
        return;
      }
      if (!Number.isFinite(target) || target <= 0) {
        setError('Target amount must be greater than 0.');
        return;
      }
      if (!supabase) {
        setError('Database connection unavailable.');
        return;
      }

      const { error: insertError } = await supabase.from('savings_goals').insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        target_amount: target,
        current_amount: 0,
        target_date: formData.target_date || null,
        priority: formData.priority,
        status: 'active',
        currency: 'PKR',
        color: formData.color,
        icon: 'Target',
        user_id: user.id
      });

      if (insertError) throw insertError;
      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create goal';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeaderRow>
          <ModalTitle>Create savings goal</ModalTitle>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </ModalHeaderRow>

        <FieldGrid>
          <Field>
            <label>Goal name</label>
            <TextInput
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Emergency Fund"
            />
          </Field>
          <Field>
            <label>Priority</label>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as typeof p.priority }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field>
            <label>Target amount</label>
            <TextInput
              inputMode="decimal"
              value={formData.target_amount}
              onChange={(e) => setFormData((p) => ({ ...p, target_amount: e.target.value }))}
              placeholder="0"
            />
          </Field>
          <Field>
            <label>Target date (optional)</label>
            <TextInput
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData((p) => ({ ...p, target_date: e.target.value }))}
            />
          </Field>
        </FieldGrid>

        <Field style={{ marginTop: '12px' }}>
          <label>Description (optional)</label>
          <TextArea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            placeholder="Short note about this goal"
          />
        </Field>

        <Field style={{ marginTop: '12px' }}>
          <label>Color</label>
          <TextInput
            value={formData.color}
            onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
            placeholder="#10b981"
          />
        </Field>

        {error && (
          <ErrorText>
            <AlertCircle size={16} />
            {error}
          </ErrorText>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function EditSavingsGoalModal({
  goal,
  onClose,
  onSuccess
}: {
  goal: SavingsGoal;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: goal.name,
    description: goal.description || '',
    target_amount: String(goal.target_amount ?? ''),
    target_date: (goal.target_date || '').slice(0, 10),
    priority: (goal.priority || 'medium') as 'low' | 'medium' | 'high',
    status: goal.status as SavingsGoal['status'],
    color: goal.color || '#10b981'
  });

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError('You must be logged in.');
        return;
      }

      if (!supabase) {
        setError('Database connection unavailable.');
        return;
      }

      const target = Number(formData.target_amount);
      if (!formData.name.trim()) {
        setError('Goal name is required.');
        return;
      }
      if (!Number.isFinite(target) || target <= 0) {
        setError('Target amount must be greater than 0.');
        return;
      }

      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          target_amount: target,
          target_date: formData.target_date || null,
          priority: formData.priority,
          status: formData.status,
          color: formData.color
        })
        .eq('id', goal.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update goal';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeaderRow>
          <ModalTitle>Edit savings goal</ModalTitle>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </ModalHeaderRow>

        <InlineCard style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)' }}>{goal.name}</div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
            Current: {formatPKR(goal.current_amount)} • Target: {formatPKR(goal.target_amount)}
          </div>
        </InlineCard>

        <FieldGrid>
          <Field>
            <label>Goal name</label>
            <TextInput value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field>
            <label>Status</label>
            <Select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as SavingsGoal['status'] }))}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>
          <Field>
            <label>Target amount</label>
            <TextInput
              inputMode="decimal"
              value={formData.target_amount}
              onChange={(e) => setFormData((p) => ({ ...p, target_amount: e.target.value }))}
            />
          </Field>
          <Field>
            <label>Target date (optional)</label>
            <TextInput type="date" value={formData.target_date} onChange={(e) => setFormData((p) => ({ ...p, target_date: e.target.value }))} />
          </Field>
          <Field>
            <label>Priority</label>
            <Select value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as typeof p.priority }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field>
            <label>Color</label>
            <TextInput value={formData.color} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} />
          </Field>
        </FieldGrid>

        <Field style={{ marginTop: '12px' }}>
          <label>Description (optional)</label>
          <TextArea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          />
        </Field>

        {error && (
          <ErrorText>
            <AlertCircle size={16} />
            {error}
          </ErrorText>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function AddTransactionModal({
  goal,
  onClose,
  onSuccess
}: {
  goal: SavingsGoal;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'contribution' as 'contribution' | 'withdrawal',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError('You must be logged in.');
        return;
      }

      if (!supabase) {
        setError('Database connection unavailable.');
        return;
      }

      const amount = Number(formData.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Amount must be greater than 0.');
        return;
      }

      if (formData.transaction_type === 'withdrawal') {
        const { data: txRows, error: txSumError } = await supabase
          .from('savings_transactions')
          .select('amount, transaction_type')
          .eq('user_id', user.id)
          .eq('savings_goal_id', goal.id);
        if (txSumError) throw txSumError;
        const currentComputed = (txRows || []).reduce((sum: number, t: { amount: number; transaction_type: string }) => {
          const a = Number(t.amount || 0);
          return sum + (t.transaction_type === 'withdrawal' ? -a : a);
        }, 0);
        if (amount > Math.max(0, currentComputed)) {
          setError('Withdrawal amount cannot exceed current saved amount.');
          return;
        }
      }

      const { error: insertError } = await supabase.from('savings_transactions').insert({
        savings_goal_id: goal.id,
        amount,
        transaction_type: formData.transaction_type,
        description: formData.description.trim() || null,
        transaction_date: formData.transaction_date,
        user_id: user.id
      });

      if (insertError) throw insertError;

      const { data: goalRow, error: goalFetchError } = await supabase
        .from('savings_goals')
        .select('target_amount, status')
        .eq('id', goal.id)
        .eq('user_id', user.id)
        .single();
      if (goalFetchError) throw goalFetchError;

      const { data: txRowsAfter, error: txAfterError } = await supabase
        .from('savings_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id)
        .eq('savings_goal_id', goal.id);
      if (txAfterError) throw txAfterError;

      const computed = (txRowsAfter || []).reduce((sum: number, t: { amount: number; transaction_type: string }) => {
        const a = Number(t.amount || 0);
        return sum + (t.transaction_type === 'withdrawal' ? -a : a);
      }, 0);
      const nextAmount = Math.max(0, computed);
      const target = Number(goalRow?.target_amount || 0);
      const nextStatus: SavingsGoal['status'] =
        target > 0 && nextAmount >= target ? 'completed' : ((goalRow?.status as SavingsGoal['status']) || 'active');

      const { error: goalUpdateError } = await supabase
        .from('savings_goals')
        .update({
          current_amount: nextAmount,
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id)
        .eq('user_id', user.id);
      if (goalUpdateError) throw goalUpdateError;

      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add transaction';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeaderRow>
          <ModalTitle>{formData.transaction_type === 'contribution' ? 'Add contribution' : 'Add withdrawal'}</ModalTitle>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </ModalHeaderRow>

        <InlineCard style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)' }}>{goal.name}</div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
            Current: {formatPKR(goal.current_amount)} / {formatPKR(goal.target_amount)}
          </div>
        </InlineCard>

        <Field>
          <label>Transaction type</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant={formData.transaction_type === 'contribution' ? 'primary' : 'outline'}
              onClick={() => setFormData((p) => ({ ...p, transaction_type: 'contribution' }))}
              type="button"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <ArrowUp size={16} />
              Contribution
            </Button>
            <Button
              variant={formData.transaction_type === 'withdrawal' ? 'primary' : 'outline'}
              onClick={() => setFormData((p) => ({ ...p, transaction_type: 'withdrawal' }))}
              type="button"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <ArrowDown size={16} />
              Withdrawal
            </Button>
          </div>
        </Field>

        <FieldGrid style={{ marginTop: '12px' }}>
          <Field>
            <label>Amount</label>
            <TextInput inputMode="decimal" value={formData.amount} onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))} placeholder="0" />
          </Field>
          <Field>
            <label>Date</label>
            <TextInput type="date" value={formData.transaction_date} onChange={(e) => setFormData((p) => ({ ...p, transaction_date: e.target.value }))} />
          </Field>
        </FieldGrid>

        <Field style={{ marginTop: '12px' }}>
          <label>Description (optional)</label>
          <TextInput value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Optional note" />
        </Field>

        {error && (
          <ErrorText>
            <AlertCircle size={16} />
            {error}
          </ErrorText>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Add Transaction'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
