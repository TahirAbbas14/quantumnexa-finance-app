'use client';

import { useState, useEffect, useCallback } from 'react'; // <-- useCallback added
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Filter,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  PiggyBank,
  Wallet,
  BarChart3,
  Eye,
} from 'lucide-react';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

interface StatCardProps {
  color?: string;
}

const StatCard = styled(Card)<StatCardProps>`
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  
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


interface StatIconProps {
  color?: string;
  textColor?: string;
}

const StatIcon = styled.div<StatIconProps>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.textColor || 'white'};
`;


const TabsContainer = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 4px;
  margin-bottom: 24px;
  display: flex;
  gap: 2px;
`;

interface TabButtonProps {
  active?: boolean;
}

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})<TabButtonProps>`
  padding: 10px 16px;
  background: ${props => props.active ? 'white' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#1f2937' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.active ? '600' : '500'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  flex: 1;
  justify-content: center;
  
  &:hover {
    background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.active ? '#1f2937' : 'rgba(255, 255, 255, 0.9)'};
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;


const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const BudgetCard = styled(Card)`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const BudgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const BudgetInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
    margin: 0;
    text-transform: capitalize;
  }
`;

const BudgetAmount = styled.div`
  text-align: right;
  
  .amount {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
  }
  
  .period {
    font-size: 12px;
    color: var(--gray-300);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ProgressSection = styled.div`
  margin-top: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
  position: relative;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: ${props => {
    if (props.$percentage > 100) return 'var(--error-500)';
    if (props.$percentage > 80) return 'var(--warning-500)';
    return 'var(--success-500)';
  }};
  width: ${props => Math.min(props.$percentage, 100)}%;
  transition: width 0.3s ease;
  border-radius: 4px;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

// Interfaces
interface Budget {
  id: string;
  name: string;
  description?: string;
  budget_type: 'monthly' | 'yearly' | 'quarterly';
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  budget_items?: BudgetItem[];
}

interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  budget_categories?: {
    name: string;
    color: string;
    icon: string;
  };
}

interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
}

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
}

export default function BudgetsPage() {
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  // Memoize fetch functions to avoid missing dependencies in useEffect
  const fetchBudgets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_items (
            *,
            budget_categories (
              name,
              color,
              icon
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  }, [supabase, user?.id]);

  const fetchSavingsGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavingsGoals(data || []);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    }
  }, [supabase, user?.id]);

  const fetchBudgetCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBudgetCategories(data || []);
    } catch (error) {
      console.error('Error fetching budget categories:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchSavingsGoals();
      fetchBudgetCategories();
    }
  }, [user, fetchBudgets, fetchSavingsGoals, fetchBudgetCategories]); // <-- add fetch functions to deps

  const calculateBudgetStats = () => {
    const activeBudgets = budgets.filter(b => b.is_active);
    const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + budget.total_amount, 0);
    
    let totalSpent = 0;
    let totalRemaining = 0;
    
    activeBudgets.forEach(budget => {
      if (budget.budget_items) {
        budget.budget_items.forEach(item => {
          totalSpent += item.spent_amount;
          totalRemaining += item.remaining_amount;
        });
      }
    });

    const activeGoals = savingsGoals.filter(g => g.status === 'active');
    const totalSavingsTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalSavingsCurrent = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      activeBudgets: activeBudgets.length,
      totalSavingsTarget,
      totalSavingsCurrent,
      activeGoals: activeGoals.length
    };
  };

  const stats = calculateBudgetStats();

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
          <h1>Budget & Financial Planning</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddGoal(true)}
            >
              <Target size={16} />
              Add Savings Goal
            </Button>
            <Button
              onClick={() => setShowAddBudget(true)}
            >
              <Plus size={16} />
              Create Budget
            </Button>
          </div>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatHeader>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Budgeted</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalBudgeted)}
                </p>
              </div>
              <StatIcon color="var(--primary-100)" textColor="var(--primary-600)">
                <Wallet size={24} />
              </StatIcon>
            </StatHeader>
            <p className="text-sm text-gray-600">
              {stats.activeBudgets} active budgets
            </p>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalSpent)}
                </p>
              </div>
              <StatIcon color="var(--error-100)" textColor="var(--error-600)">
                <TrendingDown size={24} />
              </StatIcon>
            </StatHeader>
            <p className="text-sm text-gray-600">
              {stats.totalBudgeted > 0 ? 
                `${((stats.totalSpent / stats.totalBudgeted) * 100).toFixed(1)}% of budget` : 
                '0% of budget'
              }
            </p>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Remaining Budget</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalRemaining)}
                </p>
              </div>
              <StatIcon color="var(--success-100)" textColor="var(--success-600)">
                <TrendingUp size={24} />
              </StatIcon>
            </StatHeader>
            <p className="text-sm text-gray-600">
              Available to spend
            </p>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Savings Progress</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalSavingsCurrent)}
                </p>
              </div>
              <StatIcon color="var(--accent-100)" textColor="var(--accent-600)">
                <PiggyBank size={24} />
              </StatIcon>
            </StatHeader>
            <p className="text-sm text-gray-600">
              {stats.totalSavingsTarget > 0 ? 
                `${((stats.totalSavingsCurrent / stats.totalSavingsTarget) * 100).toFixed(1)}% of ${formatPKR(stats.totalSavingsTarget)}` : 
                `${stats.activeGoals} active goals`
              }
            </p>
          </StatCard>
        </StatsGrid>

        <TabsContainer>
          <TabButton 
            active={activeTab === 'budgets'} 
            onClick={() => setActiveTab('budgets')}
          >
            <Wallet size={16} />
            Budgets
          </TabButton>
          <TabButton 
            active={activeTab === 'savings'} 
            onClick={() => setActiveTab('savings')}
          >
            <Target size={16} />
            Savings Goals
          </TabButton>
          <TabButton 
            active={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')}
          >
            <BarChart3 size={16} />
            Categories
          </TabButton>
        </TabsContainer>

        <ContentGrid>
          <div>
            {activeTab === 'budgets' && (
              <BudgetsList 
                budgets={budgets} 
              />
            )}
            {activeTab === 'savings' && (
              <SavingsGoalsList 
                goals={savingsGoals} 
              />
            )}
            {activeTab === 'categories' && (
              <CategoriesList 
                categories={budgetCategories} 
              />
            )}
          </div>
          
          <div>
            <RecentActivity />
          </div>
        </ContentGrid>

        {showAddBudget && (
          <AddBudgetModal
            onClose={() => setShowAddBudget(false)}
            onSuccess={() => {
              setShowAddBudget(false);
              fetchBudgets();
            }}
          />
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
      </Container>
    </DashboardLayout>
  );
}

// Component placeholders - will be implemented in separate files
function BudgetsList({ budgets }: { budgets: Budget[] }) {
  const [searchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory] = useState('all');
  const [selectedStatus] = useState('all');
  // Filter controls UI will be added later to utilize selectedStatus

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      (budget.budget_items &&
        budget.budget_items.some(item => item.category_id === selectedCategory));
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && budget.is_active) ||
      (selectedStatus === 'inactive' && !budget.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (budgets.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Wallet size={32} color="#ef4444" />
        </div>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'white', 
          marginBottom: '12px',
          margin: 0
        }}>
          No budgets yet
        </h3>
        <p style={{ 
          fontSize: '16px', 
          color: 'rgba(255, 255, 255, 0.7)', 
          marginBottom: '32px',
          maxWidth: '400px',
          lineHeight: '1.5',
          margin: '0 0 32px 0'
        }}>
          Create your first budget to start tracking your spending and take control of your finances.
        </p>
        <Button 
          variant="primary" 
          size="lg"
          style={{
            background: '#ef4444',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Create Your First Budget
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        gap: '16px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: 'white', 
          margin: 0 
        }}>
          Active Budgets
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Filter size={16} />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={16} />
            Search
          </Button>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gap: '20px' 
      }}>
        {filteredBudgets.map((budget) => {
          // Calculate total spent for this budget
          const totalSpent = budget.budget_items
            ? budget.budget_items.reduce((sum, item) => sum + item.spent_amount, 0)
            : 0;
          return (
            <BudgetCard key={budget.id}>
              <BudgetHeader>
                <BudgetInfo>
                  <h4>{budget.name}</h4>
                  <p>{budget.budget_type}</p>
                </BudgetInfo>
                <BudgetAmount>
                  <div className="amount">{formatPKR(budget.total_amount)}</div>
                  <div className="period">{budget.budget_type}</div>
                </BudgetAmount>
              </BudgetHeader>
              
              <ProgressSection>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: 'var(--gray-300)' }}>
                    Progress
                  </span>
                  <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>
                    {budget.total_amount > 0 ? Math.round((totalSpent / budget.total_amount) * 100) : 0}%
                  </span>
                </div>
                <ProgressBar>
                  <ProgressFill $percentage={budget.total_amount > 0 ? (totalSpent / budget.total_amount) * 100 : 0} />
                </ProgressBar>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                    Spent: {formatPKR(totalSpent)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                    Remaining: {formatPKR(budget.total_amount - totalSpent)}
                  </span>
                </div>
              </ProgressSection>
            </BudgetCard>
          );
        })}
      </div>
    </div>
  );
}

function SavingsGoalsList({ goals }: { goals: SavingsGoal[] }) {
  if (goals.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Target size={32} color="#ef4444" />
        </div>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'white', 
          marginBottom: '12px',
          margin: 0
        }}>
          No goals yet
        </h3>
        <p style={{ 
          fontSize: '16px', 
          color: 'rgba(255, 255, 255, 0.7)', 
          marginBottom: '32px',
          maxWidth: '400px',
          lineHeight: '1.5',
          margin: '0 0 32px 0'
        }}>
          Create a goal to start tracking your savings progress.
        </p>
        <Button 
          variant="primary" 
          size="lg"
          style={{
            background: '#ef4444',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Create Your First Goal
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '700', 
        color: 'white', 
        marginBottom: '24px' 
      }}>
        Savings Goals
      </h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        {goals.map((goal) => (
          <BudgetCard key={goal.id}>
            <BudgetHeader>
              <BudgetInfo>
                <h4>{goal.name}</h4>
                <p>{goal.priority} priority</p>
              </BudgetInfo>
              <BudgetAmount>
                <div className="amount">{formatPKR(goal.target_amount)}</div>
                <div className="period">TARGET</div>
              </BudgetAmount>
            </BudgetHeader>
            
            <ProgressSection>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--gray-300)' }}>
                  Progress
                </span>
                <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>
                  {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                </span>
              </div>
              <ProgressBar>
                <ProgressFill $percentage={(goal.current_amount / goal.target_amount) * 100} />
              </ProgressBar>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                  Saved: {formatPKR(goal.current_amount)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                  Remaining: {formatPKR(goal.target_amount - goal.current_amount)}
                </span>
              </div>
            </ProgressSection>
          </BudgetCard>
        ))}
      </div>
    </div>
  );
}

function CategoriesList({ categories }: { categories: BudgetCategory[] }) {
  if (categories.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Main Categories Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <BarChart3 size={32} color="#ef4444" />
          </div>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'white', 
            marginBottom: '12px',
            margin: 0
          }}>
            No categories yet
          </h3>
          <p style={{ 
            fontSize: '16px', 
            color: 'rgba(255, 255, 255, 0.7)', 
            marginBottom: '32px',
            maxWidth: '400px',
            lineHeight: '1.5',
            margin: '0 0 32px 0'
          }}>
            Organize your spending by creating categories like Groceries, Rent, and Utilities.
          </p>
          <Button 
            variant="primary" 
            size="lg"
            style={{
              background: '#ef4444',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            Create Your First Category
          </Button>
        </div>

        {/* Insights Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'white', 
            marginBottom: '12px',
            margin: '0 0 12px 0'
          }}>
            Insights
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.7)', 
            lineHeight: '1.5',
            margin: '0 0 24px 0'
          }}>
            Categories help you compare budgeted vs spent amounts and stay on track.
          </p>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={24} color="#ef4444" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '700', 
        color: 'white', 
        marginBottom: '24px' 
      }}>
        Categories
      </h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        {categories.map((category) => (
          <BudgetCard key={category.id}>
            <BudgetHeader>
              <BudgetInfo>
                <h4>{category.name}</h4>
                <p>{category.description || 'No description'}</p>
              </BudgetInfo>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: category.color || 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={24} color="white" />
              </div>
            </BudgetHeader>
          </BudgetCard>
        ))}
      </div>
    </div>
  );
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  color: 'green' | 'yellow' | 'blue';
}

function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    }
  }, [user]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Fetch recent budget activities (created, updated budgets)
      const { data: budgetActivities } = await supabase
        .from('budgets')
        .select('id, name, budget_type, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Fetch recent savings goals activities
      const { data: goalsActivities } = await supabase
        .from('savings_goals')
        .select('id, name, target_amount, current_amount, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(2);

      // Fetch budget alerts (items with high usage percentage)
      const { data: budgetAlerts } = await supabase
        .from('budget_items')
        .select(`
          id, 
          allocated_amount, 
          spent_amount, 
          percentage_used,
          updated_at,
          budget_categories(name)
        `)
        .eq('user_id', user?.id)
        .gte('percentage_used', 75)
        .order('percentage_used', { ascending: false })
        .limit(2);

      // Combine and format activities
      const formattedActivities: Activity[] = [];

      // Add budget activities
      if (budgetActivities) {
        budgetActivities.forEach(budget => {
          const isNew = new Date(budget.created_at).getTime() === new Date(budget.updated_at).getTime();
          formattedActivities.push({
            id: `budget-${budget.id}`,
            type: isNew ? 'budget_created' : 'budget_updated',
            title: isNew ? 'Budget created' : 'Budget updated',
            description: `${budget.budget_type} budget: ${budget.name}`,
            timestamp: budget.updated_at,
            icon: CheckCircle,
            color: 'green'
          });
        });
      }

      // Add savings goal activities
      if (goalsActivities) {
        goalsActivities.forEach(goal => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          
          if (progress >= 25 && progress < 100) {
            formattedActivities.push({
              id: `goal-${goal.id}`,
              type: 'goal_milestone',
              title: 'Goal milestone',
              description: `${goal.name} ${Math.round(progress)}% complete`,
              timestamp: goal.updated_at,
              icon: Target,
              color: 'blue'
            });
          }
        });
      }

      // Add budget alerts
      if (budgetAlerts) {
        budgetAlerts.forEach(alert => {
          formattedActivities.push({
            id: `alert-${alert.id}`,
            type: 'budget_alert',
            title: 'Budget alert',
            description: `${alert.budget_categories?.[0]?.name || 'Category'} budget ${Math.round(alert.percentage_used)}% used`,
            timestamp: alert.updated_at,
            icon: AlertTriangle,
            color: 'yellow'
          });
        });
      }

      // Sort by timestamp and take the most recent 5
      const sortedActivities = formattedActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getTimeAgo = (timestamp: string | number | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityStyle = (color: string) => {
    const styles = {
      green: {
        bg: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10',
        border: 'border-green-500/20',
        iconBg: 'bg-green-500/20',
        iconColor: 'text-green-400'
      },
      yellow: {
        bg: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10',
        border: 'border-yellow-500/20',
        iconBg: 'bg-yellow-500/20',
        iconColor: 'text-yellow-400'
      },
      blue: {
        bg: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10',
        border: 'border-blue-500/20',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400'
      }
    };
    return styles[color as keyof typeof styles] || styles.green;
  };

  return (
    <Sidebar>
      <BudgetCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Button variant="ghost" size="sm" onClick={fetchRecentActivities}>
            <Eye size={16} />
          </Button>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const style = getActivityStyle(activity.color);
              const IconComponent = activity.icon;
              
              return (
                <div key={activity.id} className={`flex items-start gap-3 p-4 ${style.bg} rounded-xl border ${style.border}`}>
                  <div className={`w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <IconComponent size={16} className={style.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-gray-300 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{getTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No recent activity</p>
              <p className="text-gray-500 text-xs mt-1">Create budgets and goals to see activity here</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <Button variant="outline" size="sm" className="w-full text-white border-gray-600 hover:border-gray-500 hover:bg-gray-800/50">
            View All Activity
          </Button>
        </div>
      </BudgetCard>
      
      <BudgetCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start text-white border-red-500/50 hover:border-red-400 hover:bg-red-500/10 bg-red-500/5">
            <Plus size={16} />
            Add Expense
          </Button>
          <Button variant="outline" className="w-full justify-start text-white border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 bg-blue-500/5">
            <Target size={16} />
            Update Goal
          </Button>
          <Button variant="outline" className="w-full justify-start text-white border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 bg-purple-500/5">
            <BarChart3 size={16} />
            View Reports
          </Button>
        </div>
      </BudgetCard>
    </Sidebar>
  );
}

// Modal components will be implemented separately
function AddBudgetModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create New Budget</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600">Budget creation form will be implemented here</p>
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSuccess}>Create Budget</Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function AddSavingsGoalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Savings Goal</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600">Savings goal creation form will be implemented here</p>
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSuccess}>Create Goal</Button>
        </div>
      </ModalContent>
    </Modal>
  );
}