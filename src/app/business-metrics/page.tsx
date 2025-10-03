'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  FileText,
  BarChart3,
  Target,
  Users,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  CreditCard
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns'

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    color: var(--heading-primary);
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }

  p {
    color: var(--text-secondary);
    margin: 0.5rem 0 0 0;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`

const Button = styled.button<{ variant?: 'primary' | 'outline' | 'ghost' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid;

  ${props => props.variant === 'primary' && `
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border-color: #ef4444;

    &:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  `}

  ${props => props.variant === 'outline' && `
    background: transparent;
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
      color: #ef4444;
    }
  `}

  ${props => props.variant === 'ghost' && `
    background: transparent;
    color: var(--text-secondary);
    border-color: transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }
  `}
`

const DateRangeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;

  .date-inputs {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.5rem;
    color: var(--text-primary);
    font-size: 0.875rem;

    &:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  }

  .quick-dates {
    display: flex;
    gap: 0.5rem;
  }

  .quick-date-btn {
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover, &.active {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
      color: #ef4444;
    }
  }
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const MetricCard = styled.div<{ variant?: 'positive' | 'negative' | 'neutral' | 'warning' }>`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => 
      props.variant === 'positive' ? 'linear-gradient(90deg, #10b981, #059669)' :
      props.variant === 'negative' ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
      props.variant === 'warning' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
      'linear-gradient(90deg, #6366f1, #4f46e5)'
    };
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => 
      props.variant === 'positive' ? 'rgba(16, 185, 129, 0.1)' :
      props.variant === 'negative' ? 'rgba(239, 68, 68, 0.1)' :
      props.variant === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
      'rgba(99, 102, 241, 0.1)'
    };
    color: ${props => 
      props.variant === 'positive' ? '#10b981' :
      props.variant === 'negative' ? '#ef4444' :
      props.variant === 'warning' ? '#f59e0b' :
      '#6366f1'
    };
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--heading-primary);
    margin-bottom: 0.5rem;
  }

  .metric-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .metric-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: ${props => 
      props.variant === 'positive' ? '#10b981' :
      props.variant === 'negative' ? '#ef4444' :
      props.variant === 'warning' ? '#f59e0b' :
      'var(--text-secondary)'
    };
  }

  .metric-trend {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`

const ReportSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;

  h2 {
    color: var(--heading-primary);
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`

const KPITable = styled.div`
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    &.section-header {
      font-weight: 600;
      color: var(--heading-primary);
      background: rgba(239, 68, 68, 0.05);
      border-radius: 8px;
      margin: 0.5rem 0;
      padding: 1rem;
    }
  }

  .kpi-name {
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .kpi-value {
    color: var(--text-primary);
    font-weight: 500;
    text-align: right;
    font-family: 'Courier New', monospace;
  }

  .kpi-target {
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-align: right;
  }

  .kpi-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .positive {
    color: #10b981;
  }

  .negative {
    color: #ef4444;
  }

  .warning {
    color: #f59e0b;
  }

  .neutral {
    color: var(--text-secondary);
  }
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: var(--text-secondary);
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--text-secondary);
  text-align: center;

  .error-icon {
    margin-bottom: 1rem;
    color: #ef4444;
  }

  h3 {
    color: var(--heading-primary);
    margin-bottom: 0.5rem;
  }
`

// Types
interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  expenses: {
    current: number;
    previous: number;
    growth: number;
  };
  profitMargin: {
    current: number;
    previous: number;
    change: number;
  };
  customerMetrics: {
    totalClients: number;
    newClients: number;
    clientRetention: number;
  };
  operationalMetrics: {
    averageInvoiceValue: number;
    paymentCycleTime: number;
    projectCompletionRate: number;
  };
  financialRatios: {
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    returnOnAssets: number;
  };
}

interface KPI {
  name: string;
  value: string;
  target: string;
  status: 'positive' | 'negative' | 'warning' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  category: string;
}

export default function BusinessMetricsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: { current: 0, previous: 0, growth: 0 },
    expenses: { current: 0, previous: 0, growth: 0 },
    profitMargin: { current: 0, previous: 0, change: 0 },
    customerMetrics: { totalClients: 0, newClients: 0, clientRetention: 0 },
    operationalMetrics: { averageInvoiceValue: 0, paymentCycleTime: 0, projectCompletionRate: 0 },
    financialRatios: { currentRatio: 0, quickRatio: 0, debtToEquity: 0, returnOnAssets: 0 }
  });

  // Date range state
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [activeQuickDate, setActiveQuickDate] = useState('last-month');

  const quickDateOptions = [
    { key: 'this-month', label: 'This Month', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { key: 'last-month', label: 'Last Month', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { key: 'last-3-months', label: 'Last 3 Months', start: startOfMonth(subMonths(new Date(), 3)), end: endOfMonth(new Date()) },
    { key: 'ytd', label: 'Year to Date', start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
  ];

  const fetchBusinessMetrics = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Calculate previous period for comparison
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const periodLength = differenceInDays(currentEnd, currentStart);
      const previousStart = new Date(currentStart.getTime() - (periodLength + 1) * 24 * 60 * 60 * 1000);
      const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);

      // Fetch current period data
      const [invoicesData, expensesData, clientsData, projectsData] = await Promise.all([
        // Current period invoices
        supabase
          .from('invoices')
          .select('amount, status, created_at, due_date, client_id')
          .eq('user_id', user.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        
        // Current period expenses
        supabase
          .from('expenses')
          .select('amount, date')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        
        // All clients
        supabase
          .from('clients')
          .select('id, created_at')
          .eq('user_id', user.id),
        
        // All projects
        supabase
          .from('projects')
          .select('id, status, created_at, end_date')
          .eq('user_id', user.id)
      ]);

      // Fetch previous period data for comparison
      const [prevInvoicesData, prevExpensesData] = await Promise.all([
        supabase
          .from('invoices')
          .select('amount, status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', format(previousStart, 'yyyy-MM-dd'))
          .lte('created_at', format(previousEnd, 'yyyy-MM-dd')),
        
        supabase
          .from('expenses')
          .select('amount, date')
          .eq('user_id', user.id)
          .gte('date', format(previousStart, 'yyyy-MM-dd'))
          .lte('date', format(previousEnd, 'yyyy-MM-dd'))
      ]);

      if (invoicesData.error) throw invoicesData.error;
      if (expensesData.error) throw expensesData.error;
      if (clientsData.error) throw clientsData.error;
      if (projectsData.error) throw projectsData.error;
      if (prevInvoicesData.error) throw prevInvoicesData.error;
      if (prevExpensesData.error) throw prevExpensesData.error;

      // Calculate revenue metrics
      const currentRevenue = invoicesData.data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const previousRevenue = prevInvoicesData.data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calculate expense metrics
      const currentExpenses = expensesData.data?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const previousExpenses = prevExpensesData.data?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const expenseGrowth = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;

      // Calculate profit margin
      const currentProfitMargin = currentRevenue > 0 ? ((currentRevenue - currentExpenses) / currentRevenue) * 100 : 0;
      const previousProfitMargin = previousRevenue > 0 ? ((previousRevenue - previousExpenses) / previousRevenue) * 100 : 0;
      const profitMarginChange = currentProfitMargin - previousProfitMargin;

      // Calculate customer metrics
      const totalClients = clientsData.data?.length || 0;
      const newClients = clientsData.data?.filter(client => {
        const clientDate = parseISO(client.created_at);
        return clientDate >= currentStart && clientDate <= currentEnd;
      }).length || 0;
      
      // Simplified client retention calculation
      const clientRetention = totalClients > 0 ? Math.max(0, ((totalClients - newClients) / totalClients) * 100) : 0;

      // Calculate operational metrics
      const paidInvoices = invoicesData.data?.filter(inv => inv.status === 'paid') || [];
      const averageInvoiceValue = paidInvoices.length > 0 ? paidInvoices.reduce((sum, inv) => sum + inv.amount, 0) / paidInvoices.length : 0;
      
      // Calculate average payment cycle time
      const paymentCycleTime = paidInvoices.length > 0 ? 
        paidInvoices.reduce((sum, inv) => {
          const created = parseISO(inv.created_at);
          const due = parseISO(inv.due_date);
          return sum + differenceInDays(due, created);
        }, 0) / paidInvoices.length : 0;

      // Calculate project completion rate
      const completedProjects = projectsData.data?.filter(proj => proj.status === 'completed').length || 0;
      const totalProjects = projectsData.data?.length || 0;
      const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      // Calculate simplified financial ratios
      const currentAssets = currentRevenue; // Simplified
      const currentLiabilities = currentExpenses; // Simplified
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const quickRatio = currentRatio * 0.8; // Simplified
      const debtToEquity = currentLiabilities > 0 && currentAssets > 0 ? currentLiabilities / (currentAssets - currentLiabilities) : 0;
      const returnOnAssets = currentAssets > 0 ? ((currentRevenue - currentExpenses) / currentAssets) * 100 : 0;

      setMetrics({
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth
        },
        expenses: {
          current: currentExpenses,
          previous: previousExpenses,
          growth: expenseGrowth
        },
        profitMargin: {
          current: currentProfitMargin,
          previous: previousProfitMargin,
          change: profitMarginChange
        },
        customerMetrics: {
          totalClients,
          newClients,
          clientRetention
        },
        operationalMetrics: {
          averageInvoiceValue,
          paymentCycleTime,
          projectCompletionRate
        },
        financialRatios: {
          currentRatio,
          quickRatio,
          debtToEquity,
          returnOnAssets
        }
      });

    } catch (err) {
      console.error('Error fetching business metrics:', err);
      setError('Failed to load business metrics');
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    fetchBusinessMetrics();
  }, [user, startDate, endDate, fetchBusinessMetrics]);

  const handleQuickDateSelect = (option: typeof quickDateOptions[0]) => {
    setStartDate(format(option.start, 'yyyy-MM-dd'));
    setEndDate(format(option.end, 'yyyy-MM-dd'));
    setActiveQuickDate(option.key);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatNumber = (number: number, decimals: number = 1) => {
    return number.toFixed(decimals);
  };

  const getKPIs = (): KPI[] => [
    // Revenue KPIs
    {
      name: 'Revenue Growth Rate',
      value: formatPercentage(metrics.revenue.growth),
      target: '15.0%',
      status: metrics.revenue.growth >= 15 ? 'positive' : metrics.revenue.growth >= 5 ? 'warning' : 'negative',
      trend: metrics.revenue.growth > 0 ? 'up' : metrics.revenue.growth < 0 ? 'down' : 'stable',
      category: 'Revenue'
    },
    {
      name: 'Profit Margin',
      value: formatPercentage(metrics.profitMargin.current),
      target: '20.0%',
      status: metrics.profitMargin.current >= 20 ? 'positive' : metrics.profitMargin.current >= 10 ? 'warning' : 'negative',
      trend: metrics.profitMargin.change > 0 ? 'up' : metrics.profitMargin.change < 0 ? 'down' : 'stable',
      category: 'Profitability'
    },
    // Customer KPIs
    {
      name: 'Client Retention Rate',
      value: formatPercentage(metrics.customerMetrics.clientRetention),
      target: '90.0%',
      status: metrics.customerMetrics.clientRetention >= 90 ? 'positive' : metrics.customerMetrics.clientRetention >= 75 ? 'warning' : 'negative',
      trend: 'stable',
      category: 'Customer'
    },
    {
      name: 'Average Invoice Value',
      value: formatCurrency(metrics.operationalMetrics.averageInvoiceValue),
      target: formatCurrency(50000),
      status: metrics.operationalMetrics.averageInvoiceValue >= 50000 ? 'positive' : metrics.operationalMetrics.averageInvoiceValue >= 25000 ? 'warning' : 'negative',
      trend: 'stable',
      category: 'Operations'
    },
    // Operational KPIs
    {
      name: 'Project Completion Rate',
      value: formatPercentage(metrics.operationalMetrics.projectCompletionRate),
      target: '95.0%',
      status: metrics.operationalMetrics.projectCompletionRate >= 95 ? 'positive' : metrics.operationalMetrics.projectCompletionRate >= 80 ? 'warning' : 'negative',
      trend: 'stable',
      category: 'Operations'
    },
    {
      name: 'Payment Cycle Time',
      value: `${formatNumber(metrics.operationalMetrics.paymentCycleTime, 0)} days`,
      target: '30 days',
      status: metrics.operationalMetrics.paymentCycleTime <= 30 ? 'positive' : metrics.operationalMetrics.paymentCycleTime <= 45 ? 'warning' : 'negative',
      trend: 'stable',
      category: 'Operations'
    },
    // Financial KPIs
    {
      name: 'Current Ratio',
      value: formatNumber(metrics.financialRatios.currentRatio, 2),
      target: '2.00',
      status: metrics.financialRatios.currentRatio >= 2 ? 'positive' : metrics.financialRatios.currentRatio >= 1.5 ? 'warning' : 'negative',
      trend: 'stable',
      category: 'Financial Health'
    },
    {
      name: 'Return on Assets',
      value: formatPercentage(metrics.financialRatios.returnOnAssets),
      target: '15.0%',
      status: metrics.financialRatios.returnOnAssets >= 15 ? 'positive' : metrics.financialRatios.returnOnAssets >= 8 ? 'warning' : 'negative',
      trend: 'stable',
      category: 'Financial Health'
    }
  ];

  const exportToPDF = async () => {
    try {
      const { exportToPDF: exportPDF, formatCurrencyForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Business Performance Metrics',
        subtitle: 'Comprehensive business KPIs and performance indicators',
        dateRange: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        data: getKPIs().map(item => ({
          'KPI': item.name,
          'Current Value': item.value,
          'Target': item.target,
          'Status': item.status,
          'Category': item.category
        })),
        summary: {
          'Total Revenue': formatCurrencyForExport(metrics.revenue.current),
          'Total Expenses': formatCurrencyForExport(metrics.expenses.current),
          'Profit Margin': formatPercentage(metrics.profitMargin.current),
          'Total Clients': metrics.customerMetrics.totalClients.toString(),
          'Average Invoice Value': formatCurrencyForExport(metrics.operationalMetrics.averageInvoiceValue),
          'Revenue Growth Rate': formatPercentage(metrics.revenue.growth)
        }
      };

      await exportPDF('business-metrics-content', exportData, {
        filename: `business-metrics-${format(new Date(), 'yyyy-MM-dd')}`,
        orientation: 'landscape'
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const { exportToExcel: exportExcel, formatCurrencyForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Business Performance Metrics',
        subtitle: 'Comprehensive business KPIs and performance indicators',
        dateRange: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        data: getKPIs().map(item => ({
          'KPI': item.name,
          'Current Value': item.value,
          'Target': item.target,
          'Status': item.status,
          'Category': item.category
        })),
        summary: {
          'Total Revenue': formatCurrencyForExport(metrics.revenue.current),
          'Total Expenses': formatCurrencyForExport(metrics.expenses.current),
          'Profit Margin': formatPercentage(metrics.profitMargin.current),
          'Total Clients': metrics.customerMetrics.totalClients.toString(),
          'Average Invoice Value': formatCurrencyForExport(metrics.operationalMetrics.averageInvoiceValue),
          'Revenue Growth Rate': formatPercentage(metrics.revenue.growth)
        }
      };

      exportExcel(exportData, {
        filename: `business-metrics-${format(new Date(), 'yyyy-MM-dd')}`
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export to Excel');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <LoadingContainer>
            <Loader2 className="animate-spin" size={32} />
            <span style={{ marginLeft: '1rem' }}>Loading Business Metrics...</span>
          </LoadingContainer>
        </Container>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container>
          <ErrorContainer>
            <AlertCircle className="error-icon" size={48} />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <Button variant="primary" onClick={fetchBusinessMetrics}>
              <RefreshCw size={16} />
              Try Again
            </Button>
          </ErrorContainer>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
          <Header>
            <div>
              <h1>Business Performance Metrics</h1>
              <p>Track key performance indicators and business health</p>
            </div>
            <HeaderActions>
              <Button variant="outline" onClick={exportToPDF}>
                <Download size={16} />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <FileText size={16} />
                Export Excel
              </Button>
              <Button variant="primary" onClick={fetchBusinessMetrics}>
                <RefreshCw size={16} />
                Refresh
              </Button>
            </HeaderActions>
          </Header>

          <DateRangeSelector>
            <Calendar size={20} />
            <div className="date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="quick-dates">
              {quickDateOptions.map((option) => (
                <button
                  key={option.key}
                  className={`quick-date-btn ${activeQuickDate === option.key ? 'active' : ''}`}
                  onClick={() => handleQuickDateSelect(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </DateRangeSelector>

          <div id="business-metrics-content">

        <MetricsGrid>
          <MetricCard variant={metrics.revenue.growth >= 0 ? 'positive' : 'negative'}>
            <div className="metric-header">
              <div className="metric-icon">
                <TrendingUp size={24} />
              </div>
              <div className="metric-trend">
                {metrics.revenue.growth > 0 ? <ArrowUpRight size={16} /> : 
                 metrics.revenue.growth < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
                {formatPercentage(Math.abs(metrics.revenue.growth))}
              </div>
            </div>
            <div className="metric-value">{formatCurrency(metrics.revenue.current)}</div>
            <div className="metric-label">Total Revenue</div>
            <div className="metric-change">
              {metrics.revenue.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              vs previous period
            </div>
          </MetricCard>

          <MetricCard variant={metrics.profitMargin.change >= 0 ? 'positive' : 'negative'}>
            <div className="metric-header">
              <div className="metric-icon">
                <Target size={24} />
              </div>
              <div className="metric-trend">
                {metrics.profitMargin.change > 0 ? <ArrowUpRight size={16} /> : 
                 metrics.profitMargin.change < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
                {formatPercentage(Math.abs(metrics.profitMargin.change))}
              </div>
            </div>
            <div className="metric-value">{formatPercentage(metrics.profitMargin.current)}</div>
            <div className="metric-label">Profit Margin</div>
            <div className="metric-change">
              {metrics.profitMargin.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              Margin change
            </div>
          </MetricCard>

          <MetricCard variant="neutral">
            <div className="metric-header">
              <div className="metric-icon">
                <Users size={24} />
              </div>
              <div className="metric-trend">
                <Eye size={16} />
                {metrics.customerMetrics.newClients}
              </div>
            </div>
            <div className="metric-value">{metrics.customerMetrics.totalClients}</div>
            <div className="metric-label">Total Clients</div>
            <div className="metric-change">
              <Users size={12} />
              {metrics.customerMetrics.newClients} new this period
            </div>
          </MetricCard>

          <MetricCard variant="warning">
            <div className="metric-header">
              <div className="metric-icon">
                <CreditCard size={24} />
              </div>
              <div className="metric-trend">
                <Clock size={16} />
                {formatNumber(metrics.operationalMetrics.paymentCycleTime, 0)}d
              </div>
            </div>
            <div className="metric-value">{formatCurrency(metrics.operationalMetrics.averageInvoiceValue)}</div>
            <div className="metric-label">Avg Invoice Value</div>
            <div className="metric-change">
              <Clock size={12} />
              {formatNumber(metrics.operationalMetrics.paymentCycleTime, 0)} day cycle
            </div>
          </MetricCard>
        </MetricsGrid>

        <ReportSection>
          <h2>
            <BarChart3 size={24} />
            Key Performance Indicators
          </h2>
          
          <KPITable>
            <div className="table-header">
              <div>KPI</div>
              <div>Current Value</div>
              <div>Target</div>
              <div>Status</div>
            </div>

            {/* Revenue KPIs */}
            <div className="table-row section-header">
              <div>REVENUE & GROWTH</div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            
            {getKPIs()
              .filter(kpi => kpi.category === 'Revenue' || kpi.category === 'Profitability')
              .map((kpi, index) => (
                <div key={`revenue-${index}`} className="table-row">
                  <div className="kpi-name">{kpi.name}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-target">{kpi.target}</div>
                  <div className={`kpi-status ${kpi.status}`}>
                    {kpi.trend === 'up' && <ArrowUpRight size={12} />}
                    {kpi.trend === 'down' && <ArrowDownRight size={12} />}
                    {kpi.trend === 'stable' && <Minus size={12} />}
                    {kpi.status === 'positive' && 'On Target'}
                    {kpi.status === 'warning' && 'Needs Attention'}
                    {kpi.status === 'negative' && 'Below Target'}
                  </div>
                </div>
              ))}

            {/* Customer KPIs */}
            <div className="table-row section-header">
              <div>CUSTOMER METRICS</div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            {getKPIs()
              .filter(kpi => kpi.category === 'Customer')
              .map((kpi, index) => (
                <div key={`customer-${index}`} className="table-row">
                  <div className="kpi-name">{kpi.name}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-target">{kpi.target}</div>
                  <div className={`kpi-status ${kpi.status}`}>
                    {kpi.trend === 'up' && <ArrowUpRight size={12} />}
                    {kpi.trend === 'down' && <ArrowDownRight size={12} />}
                    {kpi.trend === 'stable' && <Minus size={12} />}
                    {kpi.status === 'positive' && 'Excellent'}
                    {kpi.status === 'warning' && 'Good'}
                    {kpi.status === 'negative' && 'Needs Improvement'}
                  </div>
                </div>
              ))}

            {/* Operational KPIs */}
            <div className="table-row section-header">
              <div>OPERATIONAL EFFICIENCY</div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            {getKPIs()
              .filter(kpi => kpi.category === 'Operations')
              .map((kpi, index) => (
                <div key={`operations-${index}`} className="table-row">
                  <div className="kpi-name">{kpi.name}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-target">{kpi.target}</div>
                  <div className={`kpi-status ${kpi.status}`}>
                    {kpi.trend === 'up' && <ArrowUpRight size={12} />}
                    {kpi.trend === 'down' && <ArrowDownRight size={12} />}
                    {kpi.trend === 'stable' && <Minus size={12} />}
                    {kpi.status === 'positive' && 'Efficient'}
                    {kpi.status === 'warning' && 'Moderate'}
                    {kpi.status === 'negative' && 'Inefficient'}
                  </div>
                </div>
              ))}

            {/* Financial Health KPIs */}
            <div className="table-row section-header">
              <div>FINANCIAL HEALTH</div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            {getKPIs()
              .filter(kpi => kpi.category === 'Financial Health')
              .map((kpi, index) => (
                <div key={`financial-${index}`} className="table-row">
                  <div className="kpi-name">{kpi.name}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-target">{kpi.target}</div>
                  <div className={`kpi-status ${kpi.status}`}>
                    {kpi.trend === 'up' && <ArrowUpRight size={12} />}
                    {kpi.trend === 'down' && <ArrowDownRight size={12} />}
                    {kpi.trend === 'stable' && <Minus size={12} />}
                    {kpi.status === 'positive' && 'Healthy'}
                    {kpi.status === 'warning' && 'Stable'}
                    {kpi.status === 'negative' && 'At Risk'}
                  </div>
                </div>
              ))}
          </KPITable>
        </ReportSection>
        </div>
      </Container>
    </DashboardLayout>
  );
}