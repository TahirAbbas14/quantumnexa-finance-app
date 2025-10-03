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
  Search, 
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
  background: transparent;
  min-height: 100vh;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'var(--primary-100)'};
  color: var(--primary-600);
`;

const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const GoalCard = styled(Card)<{ goalColor?: string }>`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
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
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'completed': return 'var(--success-100)';
      case 'active': return 'var(--primary-100)';
      case 'paused': return 'var(--warning-100)';
      case 'cancelled': return 'var(--error-100)';
      default: return 'var(--gray-100)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'completed': return 'var(--success-700)';
      case 'active': return 'var(--primary-700)';
      case 'paused': return 'var(--warning-700)';
      case 'cancelled': return 'var(--error-700)';
      default: return 'var(--gray-700)';
    }
  }};
`;

const PriorityBadge = styled.span<{ priority?: 'high' | 'medium' | 'low' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.priority) {
      case 'high': return 'var(--error-100)';
      case 'medium': return 'var(--warning-100)';
      case 'low': return 'var(--success-100)';
      default: return 'var(--gray-100)';
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case 'high': return 'var(--error-700)';
      case 'medium': return 'var(--warning-700)';
      case 'low': return 'var(--success-700)';
      default: return 'var(--gray-700)';
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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
}

export default function SavingsPage() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const fetchSavingsGoals = useCallback(async () => {
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavingsGoals(data || []);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  const fetchRecentTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase!
        .from('savings_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user?.id, supabase]);

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
          <h1>Savings Goals</h1>
          <Button onClick={() => setShowAddGoal(true)}>
            <Plus size={16} />
            Add Savings Goal
          </Button>
        </Header>

        <StatsGrid>
          <StatCard>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Target</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalTarget)}
                </p>
              </div>
              <StatIcon color="var(--primary-100)">
                <Target size={24} />
              </StatIcon>
            </div>
            <p className="text-sm text-gray-600">
              {stats.activeGoals} active goals
            </p>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Saved</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalSaved)}
                </p>
              </div>
              <StatIcon color="var(--success-100)">
                <PiggyBank size={24} />
              </StatIcon>
            </div>
            <p className="text-sm text-gray-600">
              {stats.overallProgress.toFixed(1)}% of target
            </p>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Completed Goals</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalCompleted)}
                </p>
              </div>
              <StatIcon color="var(--accent-100)">
                <Trophy size={24} />
              </StatIcon>
            </div>
            <p className="text-sm text-gray-600">
              {stats.completedGoals} goals achieved
            </p>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Overall Progress</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overallProgress.toFixed(1)}%
                </p>
              </div>
              <StatIcon color="var(--warning-100)">
                <TrendingUp size={24} />
              </StatIcon>
            </div>
            <ProgressBar style={{ height: '6px', margin: '0' }}>
              <ProgressFill percentage={stats.overallProgress} />
            </ProgressBar>
          </StatCard>
        </StatsGrid>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search savings goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {filteredGoals.length === 0 ? (
          <Card className="p-12 text-center">
            <Target size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No savings goals found</h3>
            <p className="text-gray-600 mb-6">
              {savingsGoals.length === 0 
                ? "Start your savings journey by creating your first goal"
                : "Try adjusting your filters to see more goals"
              }
            </p>
            <Button onClick={() => setShowAddGoal(true)}>
              <Plus size={16} />
              Create Your First Goal
            </Button>
          </Card>
        ) : (
          <GoalsGrid>
            {filteredGoals.map(goal => {
              const progress = getGoalProgress(goal);
              const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;
              
              return (
                <GoalCard key={goal.id} goalColor={goal.color}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                        <StatusBadge status={goal.status}>
                          {goal.status === 'completed' && <CheckCircle size={12} />}
                          {goal.status === 'active' && <Clock size={12} />}
                          {goal.status === 'paused' && <Pause size={12} />}
                          {goal.status === 'cancelled' && <X size={12} />}
                          {goal.status}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={goal.priority}>
                          {goal.priority} priority
                        </PriorityBadge>
                        {daysRemaining !== null && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            daysRemaining < 0 
                              ? 'bg-red-100 text-red-700' 
                              : daysRemaining < 30 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {daysRemaining < 0 
                              ? `${Math.abs(daysRemaining)} days overdue`
                              : `${daysRemaining} days left`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowAddTransaction(true);
                        }}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <DollarSign size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  )}

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {formatPKR(goal.current_amount)} / {formatPKR(goal.target_amount)}
                      </span>
                    </div>
                    <ProgressBar>
                      <ProgressFill 
                        percentage={progress} 
                        color={goal.color}
                      />
                    </ProgressBar>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{progress.toFixed(1)}% completed</span>
                      <span>{formatPKR(goal.target_amount - goal.current_amount)} remaining</span>
                    </div>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>Target: {format(new Date(goal.target_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </GoalCard>
              );
            })}
          </GoalsGrid>
        )}

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
      </Container>
    </DashboardLayout>
  );
}

// Modal Components
function AddSavingsGoalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_date: '',
    priority: 'medium',
    color: '#10b981'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        setError('Supabase client is not initialized');
        return;
      }
      const { error } = await supabase
        .from('savings_goals')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          target_amount: parseFloat(formData.target_amount),
          target_date: formData.target_date || null,
          priority: formData.priority,
          color: formData.color,
          user_id: user?.id
        }]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating savings goal:', error);
      setError('Failed to create savings goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Savings Goal</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Optional description for your goal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Amount *
              </label>
              <input
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Create Goal'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}

function AddTransactionModal({ goal, onClose, onSuccess }: {
  goal: SavingsGoal;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'contribution',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) {
      setError('Please enter an amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        setError('Supabase client is not initialized');
        return;
      }
      const { error } = await supabase
        .from('savings_transactions')
        .insert([{
          savings_goal_id: goal.id,
          amount: parseFloat(formData.amount),
          transaction_type: formData.transaction_type,
          description: formData.description || null,
          transaction_date: formData.transaction_date,
          user_id: user?.id
        }]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {formData.transaction_type === 'contribution' ? 'Add Contribution' : 'Add Withdrawal'}
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{goal.name}</h3>
          <p className="text-sm text-gray-600">
            Current: {formatPKR(goal.current_amount)} / {formatPKR(goal.target_amount)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, transaction_type: 'contribution'})}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  formData.transaction_type === 'contribution'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <ArrowUp size={16} className="inline mr-2" />
                Contribution
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, transaction_type: 'withdrawal'})}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  formData.transaction_type === 'withdrawal'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <ArrowDown size={16} className="inline mr-2" />
                Withdrawal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Optional description"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}