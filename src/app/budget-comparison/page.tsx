'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

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

const DateSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  button {
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--gray-50);
      border-color: var(--primary-300);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .current-month {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--gray-900);
    min-width: 200px;
    text-align: center;
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
  background: ${props => props.color || 'var(--primary-100)'};
  color: ${props => props.textColor || 'var(--primary-600)'};
  margin-bottom: 1rem;
`;

const ComparisonCard = styled(Card)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CategoryCard = styled(Card)`
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
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${props => {
    switch (props.status) {
      case 'over': return 'var(--error-100)';
      case 'warning': return 'var(--warning-100)';
      case 'good': return 'var(--success-100)';
      default: return 'var(--gray-100)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'over': return 'var(--error-700)';
      case 'warning': return 'var(--warning-700)';
      case 'good': return 'var(--success-700)';
      default: return 'var(--gray-700)';
    }
  }};
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  
  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--gray-900);
  }
`;

// Interfaces
interface Budget {
  id: string;
  name: string;
  total_amount: number;
  period_type: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused';
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
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [showDetails, setShowDetails] = useState(true);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

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
  }, [user, selectedDate]);

  // Memoize calculateComparison to satisfy exhaustive-deps
  const calculateComparison = useCallback(() => {
    if (!selectedBudget) return;

    const budgetItemsForBudget = budgetItems.filter(item => item.budget_id === selectedBudget.id);
    
    const comparison: ComparisonData[] = budgetItemsForBudget.map(item => {
      const categoryExpenses = expenses.filter(expense => 
        expense.category.toLowerCase() === item.category_name.toLowerCase()
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
    const unbudgetedExpenses = expenses.filter(expense => 
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
  }, [selectedBudget, budgetItems, expenses]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate, fetchData]);

  useEffect(() => {
    if (budgets.length > 0 && !selectedBudget) {
      // Auto-select the first active budget
      const activeBudget = budgets.find(b => b.status === 'active') || budgets[0];
      setSelectedBudget(activeBudget);
    }
  }, [budgets, selectedBudget]);

  useEffect(() => {
    if (selectedBudget && budgetItems.length > 0 && expenses.length > 0) {
      calculateComparison();
    }
  }, [selectedBudget, budgetItems, expenses, selectedDate, calculateComparison]);

  const fetchBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setBudgets(data || []);
  };

  const fetchBudgetItems = async () => {
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
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user?.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const stats = getOverallStats();
  const chartData = getChartData();
  const pieData = getPieChartData();

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
          <h1>Budget vs Actual Comparison</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button onClick={fetchData}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </Header>

        <DateSelector>
          <button onClick={() => navigateMonth('prev')}>
            <ArrowDown className="rotate-90" size={16} />
          </button>
          <div className="current-month">
            {format(selectedDate, 'MMMM yyyy')}
          </div>
          <button onClick={() => navigateMonth('next')}>
            <ArrowUp className="rotate-90" size={16} />
          </button>
        </DateSelector>

        {selectedBudget && (
          <ComparisonCard>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedBudget.name}</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedBudget.start_date), 'MMM dd')} - {format(new Date(selectedBudget.end_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(selectedBudget.total_amount)}
                </p>
                <p className="text-sm text-gray-600">Total Budget</p>
              </div>
            </div>
          </ComparisonCard>
        )}

        <StatsGrid>
          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon color="var(--primary-100)" textColor="var(--primary-600)">
                  <Target size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Total Budgeted</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalBudgeted)}
                </p>
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon color="var(--warning-100)" textColor="var(--warning-600)">
                  <Wallet size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(stats.totalActual)}
                </p>
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon 
                  color={stats.totalDifference > 0 ? 'var(--error-100)' : 'var(--success-100)'} 
                  textColor={stats.totalDifference > 0 ? 'var(--error-600)' : 'var(--success-600)'}
                >
                  {stats.totalDifference > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Difference</h3>
                <p className={`text-2xl font-bold ${stats.totalDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.totalDifference > 0 ? '+' : ''}{formatPKR(stats.totalDifference)}
                </p>
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon 
                  color={stats.overallPercentage > 100 ? 'var(--error-100)' : 'var(--success-100)'} 
                  textColor={stats.overallPercentage > 100 ? 'var(--error-600)' : 'var(--success-600)'}
                >
                  <BarChart3 size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Overall Usage</h3>
                <p className={`text-2xl font-bold ${stats.overallPercentage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                  {stats.overallPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </StatCard>
        </StatsGrid>

        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
          </div>
        )}

        {showDetails && (
          <CategoryGrid>
            {comparisonData.map((item, index) => (
              <CategoryCard key={index}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">{item.category}</h3>
                  <StatusBadge status={item.status}>
                    {item.status === 'over' && <AlertTriangle size={12} />}
                    {item.status === 'warning' && <AlertTriangle size={12} />}
                    {item.status === 'good' && <CheckCircle size={12} />}
                    {item.status === 'over' ? 'Over Budget' : 
                     item.status === 'warning' ? 'Warning' : 'On Track'}
                  </StatusBadge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budgeted:</span>
                    <span className="font-medium">{formatPKR(item.budgeted)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-medium">{formatPKR(item.actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Difference:</span>
                    <span className={`font-medium ${item.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.difference > 0 ? '+' : ''}{formatPKR(item.difference)}
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

                <div className="flex justify-between text-xs text-gray-600">
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
          <Card className="p-12 text-center">
            <BarChart3 size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No comparison data available</h3>
            <p className="text-gray-600 mb-6">
              Create a budget and add some expenses to see the comparison
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/budgets'}>
                Create Budget
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/expenses'}>
                Add Expenses
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </DashboardLayout>
  );
}