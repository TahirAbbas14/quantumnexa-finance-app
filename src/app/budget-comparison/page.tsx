'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Target,
  Wallet,
  Filter,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

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
  gap: 24px;
  margin-bottom: 18px;
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

const ComparisonCard = styled(Card)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px;
  margin-bottom: 18px;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
`;

const CategoryCard = styled(Card)`
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

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin: 1rem 0;
`;

interface ProgressFillProps {
  percentage: number;
  color?: string;
}

const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  background: ${props => props.color || 'var(--primary-500)'};
  width: ${props => Math.min(props.percentage, 100)}%;
  transition: width 0.3s ease;
  border-radius: 6px;
  position: relative;
  
  ${props => props.percentage > 100 && `
    background: var(--error-500);
    animation: pulse 2s infinite;
  `}
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

interface StatusBadgeProps {
  status: 'over' | 'warning' | 'good' | string;
}

const StatusBadge = styled.span<StatusBadgeProps>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${props => {
    switch (props.status) {
      case 'over': return 'rgba(239, 68, 68, 0.18)';
      case 'warning': return 'rgba(245, 158, 11, 0.18)';
      case 'good': return 'rgba(16, 185, 129, 0.18)';
      default: return 'rgba(255, 255, 255, 0.10)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'over': return '#f87171';
      case 'warning': return '#fbbf24';
      case 'good': return '#34d399';
      default: return 'rgba(255, 255, 255, 0.80)';
    }
  }};
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 18px;
  
  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
  }
`;

const PeriodBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 18px;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PeriodLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const PeriodTitle = styled.div`
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
`;

const PeriodHint = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PeriodControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const ControlSelect = styled.select`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;

  &:focus {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }

  option {
    background: #101010;
    color: #ffffff;
  }
`;

const ControlInput = styled.input`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled(Card)`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 28px;
  text-align: center;
`;

interface Budget {
  id: string;
  name: string;
  total_amount: number;
  budget_type: 'monthly' | 'yearly' | 'quarterly';
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  category_name: string;
  allocated_amount: number;
  spent_amount: number;
}

interface Expense {
  id: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

interface ComparisonData {
  category: string;
  budgeted: number;
  actual: number;
  difference: number;
  percentage: number;
  status: 'over' | 'warning' | 'good';
}

export default function BudgetComparisonPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [showDetails, setShowDetails] = useState(true);
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'custom'>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const toISODate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const period = useMemo(() => {
    const now = new Date();
    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

    if (periodPreset === 'this_month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return { preset: periodPreset, start, end, startISO: toISODate(start), endISO: toISODate(end) };
    }

    if (periodPreset === 'last_month') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = startOfMonth(last);
      const end = endOfMonth(last);
      return { preset: periodPreset, start, end, startISO: toISODate(start), endISO: toISODate(end) };
    }

    const safeFrom = customFrom || toISODate(startOfMonth(now));
    const safeTo = customTo || toISODate(endOfMonth(now));
    const start = new Date(safeFrom);
    const end = new Date(safeTo);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      const fallbackStart = startOfMonth(now);
      const fallbackEnd = endOfMonth(now);
      return { preset: periodPreset, start: fallbackStart, end: fallbackEnd, startISO: toISODate(fallbackStart), endISO: toISODate(fallbackEnd) };
    }
    const normalizedStart = start <= end ? start : end;
    const normalizedEnd = start <= end ? end : start;
    return { preset: periodPreset, start: normalizedStart, end: normalizedEnd, startISO: toISODate(normalizedStart), endISO: toISODate(normalizedEnd) };
  }, [customFrom, customTo, periodPreset]);

  useEffect(() => {
    if (periodPreset !== 'custom') return;
    if (customFrom || customTo) return;
    setCustomFrom(period.startISO);
    setCustomTo(period.endISO);
  }, [customFrom, customTo, period.endISO, period.startISO, periodPreset]);

  // Memoize fetchData to satisfy exhaustive-deps
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBudgets(),
        fetchBudgetItems(),
        fetchExpenses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.endISO, period.startISO, user]);

  // Memoize calculateComparison to satisfy exhaustive-deps
  const calculateComparison = useCallback(() => {
    if (!selectedBudget) return;

    const compareISO = (a: string, b: string) => a.localeCompare(b);
    const maxISO = (a: string, b: string) => (compareISO(a, b) >= 0 ? a : b);
    const minISO = (a: string, b: string) => (compareISO(a, b) <= 0 ? a : b);

    const effectiveStartISO =
      selectedBudget.budget_type === 'monthly' ? period.startISO : selectedBudget.start_date;
    const effectiveEndISO =
      selectedBudget.budget_type === 'monthly' ? period.endISO : selectedBudget.end_date;
    const windowStartISO = maxISO(effectiveStartISO, period.startISO);
    const windowEndISO = minISO(effectiveEndISO, period.endISO);

    const normalize = (v: string) => v.trim().toLowerCase();
    const expensesInWindow = expenses.filter((e) => {
      const d = (e.date || '').slice(0, 10);
      if (!d) return false;
      return compareISO(d, windowStartISO) >= 0 && compareISO(d, windowEndISO) <= 0;
    });

    const budgetItemsForBudget = budgetItems.filter(item => item.budget_id === selectedBudget.id);
    
    const comparison: ComparisonData[] = budgetItemsForBudget.map(item => {
      const categoryExpenses = expensesInWindow.filter(expense => 
        normalize(expense.category || '') === normalize(item.category_name || '')
      );
      
      const actualSpent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budgeted = item.allocated_amount;
      const difference = actualSpent - budgeted;
      const percentage = budgeted > 0 ? (actualSpent / budgeted) * 100 : 0;
      
      let status: 'over' | 'warning' | 'good' = 'good';
      if (percentage > 100) status = 'over';
      else if (percentage > 80) status = 'warning';
      
      return {
        category: item.category_name,
        budgeted,
        actual: actualSpent,
        difference,
        percentage,
        status
      };
    });

    // Add categories with expenses but no budget
    const budgetedCategories = budgetItemsForBudget.map(item => item.category_name.toLowerCase());
    const unbudgetedExpenses = expensesInWindow.filter(expense => 
      !budgetedCategories.includes(expense.category.toLowerCase())
    );
    
    const unbudgetedByCategory = unbudgetedExpenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(unbudgetedByCategory).forEach(([category, amount]) => {
      comparison.push({
        category,
        budgeted: 0,
        actual: amount,
        difference: amount,
        percentage: 0,
        status: 'over'
      });
    });

    setComparisonData(comparison.sort((a, b) => b.actual - a.actual));
  }, [budgetItems, expenses, period.endISO, period.startISO, selectedBudget]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  useEffect(() => {
    if (budgets.length > 0 && !selectedBudget) {
      // Auto-select the first active budget
      const activeBudget = budgets.find(b => b.is_active) || budgets[0];
      setSelectedBudget(activeBudget);
    }
  }, [budgets, selectedBudget]);

  useEffect(() => {
    if (selectedBudget && budgetItems.length > 0 && expenses.length > 0) {
      calculateComparison();
    }
  }, [selectedBudget, budgetItems, expenses, calculateComparison]);

  const fetchBudgets = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setBudgets(data || []);
  };

  const fetchBudgetItems = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('budget_items')
      .select(`
        *,
        budget_categories(name)
      `)
      .eq('user_id', user?.id);

    if (error) throw error;
    
    const itemsWithCategoryNames = data?.map(item => ({
      ...item,
      category_name: item.budget_categories?.name || 'Unknown'
    })) || [];
    
    setBudgetItems(itemsWithCategoryNames);
  };

  const fetchExpenses = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user?.id)
      .gte('date', period.startISO)
      .lte('date', period.endISO)
      .order('date', { ascending: false });

    if (error) throw error;
    setExpenses(data || []);
  };

  const getOverallStats = () => {
    const totalBudgeted = comparisonData.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = comparisonData.reduce((sum, item) => sum + item.actual, 0);
    const totalDifference = totalActual - totalBudgeted;
    const overallPercentage = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
    
    const categoriesOver = comparisonData.filter(item => item.status === 'over').length;
    const categoriesWarning = comparisonData.filter(item => item.status === 'warning').length;
    const categoriesGood = comparisonData.filter(item => item.status === 'good').length;

    return {
      totalBudgeted,
      totalActual,
      totalDifference,
      overallPercentage,
      categoriesOver,
      categoriesWarning,
      categoriesGood
    };
  };

  const getChartData = () => {
    return comparisonData.map(item => ({
      category: item.category.length > 10 ? item.category.substring(0, 10) + '...' : item.category,
      budgeted: item.budgeted,
      actual: item.actual,
      fullCategory: item.category
    }));
  };

  const getPieChartData = () => {
    return comparisonData
      .filter(item => item.actual > 0)
      .map(item => ({
        name: item.category,
        value: item.actual,
        color: item.status === 'over' ? '#ef4444' : item.status === 'warning' ? '#f59e0b' : '#10b981'
      }));
  };

  const stats = getOverallStats();
  const chartData = getChartData();
  const pieData = getPieChartData();

  const effectiveBudgetWindow = useMemo(() => {
    if (!selectedBudget) return null;
    const compareISO = (a: string, b: string) => a.localeCompare(b);
    const maxISO = (a: string, b: string) => (compareISO(a, b) >= 0 ? a : b);
    const minISO = (a: string, b: string) => (compareISO(a, b) <= 0 ? a : b);

    const effectiveStartISO =
      selectedBudget.budget_type === 'monthly' ? period.startISO : selectedBudget.start_date;
    const effectiveEndISO =
      selectedBudget.budget_type === 'monthly' ? period.endISO : selectedBudget.end_date;
    const windowStartISO = maxISO(effectiveStartISO, period.startISO);
    const windowEndISO = minISO(effectiveEndISO, period.endISO);
    if (compareISO(windowStartISO, windowEndISO) > 0) return { startISO: period.startISO, endISO: period.endISO };
    return { startISO: windowStartISO, endISO: windowEndISO };
  }, [period.endISO, period.startISO, selectedBudget]);

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
            <h1>Budget Comparison</h1>
            <p>Compare budget allocations to actual expenses for a selected period.</p>
          </TitleBlock>
          <HeaderActions>
            <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button onClick={fetchData}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </HeaderActions>
        </Header>

        <PeriodBar>
          <PeriodLeft>
            <PeriodTitle>
              <Filter size={16} />
              Period
            </PeriodTitle>
            <PeriodHint>
              {period.start.toLocaleDateString()} – {period.end.toLocaleDateString()}
            </PeriodHint>
          </PeriodLeft>
          <PeriodControls>
            <ControlSelect value={periodPreset} onChange={(e) => setPeriodPreset(e.target.value as typeof periodPreset)}>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom</option>
            </ControlSelect>
            {periodPreset === 'custom' && (
              <>
                <ControlInput type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <ControlInput type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </>
            )}
            <ControlSelect
              value={selectedBudget?.id || ''}
              onChange={(e) => {
                const next = budgets.find((b) => b.id === e.target.value) || null;
                setSelectedBudget(next);
              }}
              style={{ minWidth: '220px' }}
            >
              <option value="">Select budget</option>
              {[...budgets]
                .sort((a, b) => Number(b.is_active) - Number(a.is_active))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.is_active ? '(Active)' : ''}
                  </option>
                ))}
            </ControlSelect>
          </PeriodControls>
        </PeriodBar>

        {selectedBudget && (
          <ComparisonCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.95)' }}>
                  {selectedBudget.name}
                </div>
                <div style={{ marginTop: '6px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>
                  {selectedBudget.budget_type} •{' '}
                  {format(new Date(effectiveBudgetWindow?.startISO || period.startISO), 'MMM dd')} -{' '}
                  {format(new Date(effectiveBudgetWindow?.endISO || period.endISO), 'MMM dd, yyyy')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>{formatPKR(selectedBudget.total_amount)}</div>
                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <StatusBadge status={selectedBudget.is_active ? 'good' : 'warning'}>
                    {selectedBudget.is_active ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    {selectedBudget.is_active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>
              </div>
            </div>
          </ComparisonCard>
        )}

        <StatsGrid>
          <StatCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Total Budgeted</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
                  {formatPKR(stats.totalBudgeted)}
                </div>
              </div>
              <StatIcon $color="var(--primary-100)" $textColor="var(--primary-600)">
                <Target size={24} />
              </StatIcon>
            </div>
          </StatCard>

          <StatCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Total Spent</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
                  {formatPKR(stats.totalActual)}
                </div>
              </div>
              <StatIcon $color="var(--warning-100)" $textColor="var(--warning-600)">
                <Wallet size={24} />
              </StatIcon>
            </div>
          </StatCard>

          <StatCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Difference</div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: stats.totalDifference > 0 ? '#f87171' : '#34d399',
                    marginTop: '6px'
                  }}
                >
                  {stats.totalDifference > 0 ? '+' : ''}
                  {formatPKR(stats.totalDifference)}
                </div>
              </div>
              <StatIcon
                $color={stats.totalDifference > 0 ? 'var(--error-100)' : 'var(--success-100)'}
                $textColor={stats.totalDifference > 0 ? 'var(--error-600)' : 'var(--success-600)'}
              >
                {stats.totalDifference > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </StatIcon>
            </div>
          </StatCard>

          <StatCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Overall Usage</div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: stats.overallPercentage > 100 ? '#f87171' : '#ffffff',
                    marginTop: '6px'
                  }}
                >
                  {stats.overallPercentage.toFixed(1)}%
                </div>
              </div>
              <StatIcon
                $color={stats.overallPercentage > 100 ? 'var(--error-100)' : 'var(--success-100)'}
                $textColor={stats.overallPercentage > 100 ? 'var(--error-600)' : 'var(--success-600)'}
              >
                <BarChart3 size={24} />
              </StatIcon>
            </div>
          </StatCard>
        </StatsGrid>

        {chartData.length > 0 && (
          <TwoCol>
            <ChartContainer>
              <h3>Budget vs Actual by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="category" 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [formatPKR(Number(value)), name === 'budgeted' ? 'Budgeted' : 'Actual']}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.category === label);
                      return item?.fullCategory || label;
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="budgeted" fill="var(--primary-500)" name="budgeted" />
                  <Bar dataKey="actual" fill="var(--warning-500)" name="actual" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer>
              <h3>Spending Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatPKR(Number(value)), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TwoCol>
        )}

        {showDetails && (
          <CategoryGrid>
            {comparisonData.map((item, index) => (
              <CategoryCard key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.95)' }}>{item.category}</div>
                  <StatusBadge status={item.status}>
                    {item.status === 'over' && <AlertTriangle size={12} />}
                    {item.status === 'warning' && <AlertTriangle size={12} />}
                    {item.status === 'good' && <CheckCircle size={12} />}
                    {item.status === 'over' ? 'Over Budget' : 
                     item.status === 'warning' ? 'Warning' : 'On Track'}
                  </StatusBadge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Budgeted</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.92)', fontWeight: 800 }}>{formatPKR(item.budgeted)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Actual</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.92)', fontWeight: 800 }}>{formatPKR(item.actual)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Difference</span>
                    <span style={{ fontWeight: 900, color: item.difference > 0 ? '#f87171' : '#34d399' }}>
                      {item.difference > 0 ? '+' : ''}
                      {formatPKR(item.difference)}
                    </span>
                  </div>
                </div>

                <ProgressBar>
                  <ProgressFill 
                    percentage={item.percentage} 
                    color={item.status === 'over' ? 'var(--error-500)' : 
                           item.status === 'warning' ? 'var(--warning-500)' : 'var(--success-500)'}
                  />
                </ProgressBar>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
                  <span>{item.percentage.toFixed(1)}% used</span>
                  {item.budgeted > 0 && (
                    <span>{formatPKR(Math.max(0, item.budgeted - item.actual))} remaining</span>
                  )}
                </div>
              </CategoryCard>
            ))}
          </CategoryGrid>
        )}

        {comparisonData.length === 0 && (
          <EmptyState>
            <BarChart3 size={40} style={{ marginBottom: '12px', color: 'rgba(255, 255, 255, 0.55)' }} />
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.95)' }}>No comparison data</div>
            <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)' }}>
              Select a budget and add expenses in the chosen period to see a category-by-category comparison.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
              <Button onClick={() => (window.location.href = '/budgets')}>Create Budget</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/expenses')}>
                Add Expenses
              </Button>
            </div>
          </EmptyState>
        )}
      </Container>
    </DashboardLayout>
  );
}
