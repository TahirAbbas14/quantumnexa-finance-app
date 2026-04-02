'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import styled from 'styled-components'
import { 
  TrendingUp, 
  TrendingDown, 
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
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths, subYears, differenceInDays, parseISO } from 'date-fns'

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    color: #ffffff;
    font-size: 26px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.01em;
  }

  p {
    color: rgba(255, 255, 255, 0.65);
    margin: 8px 0 0 0;
    font-size: 14px;
    line-height: 1.4;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`

const ControlsBar = styled.div`
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
`

const ControlsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

const Select = styled.select`
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

  option {
    background: #101010;
    color: #ffffff;
  }
`

const DateInput = styled.input`
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
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 18px;
`

const MetricCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$variant'
})<{ $variant?: 'positive' | 'negative' | 'neutral' | 'warning' }>`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
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
      props.$variant === 'positive' ? 'linear-gradient(90deg, #10b981, #059669)' :
      props.$variant === 'negative' ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
      props.$variant === 'warning' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
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
      props.$variant === 'positive' ? 'rgba(16, 185, 129, 0.14)' :
      props.$variant === 'negative' ? 'rgba(239, 68, 68, 0.14)' :
      props.$variant === 'warning' ? 'rgba(245, 158, 11, 0.14)' :
      'rgba(99, 102, 241, 0.1)'
    };
    color: ${props => 
      props.$variant === 'positive' ? '#34d399' :
      props.$variant === 'negative' ? '#f87171' :
      props.$variant === 'warning' ? '#fbbf24' :
      '#6366f1'
    };
  }

  .metric-value {
    font-size: 24px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 6px;
  }

  .metric-label {
    color: rgba(255, 255, 255, 0.65);
    font-size: 13px;
    margin-bottom: 8px;
  }

  .metric-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: ${props => 
      props.$variant === 'positive' ? '#34d399' :
      props.$variant === 'negative' ? '#f87171' :
      props.$variant === 'warning' ? '#fbbf24' :
      'rgba(255,255,255,0.65)'
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
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 18px;

  h2 {
    color: rgba(255, 255, 255, 0.92);
    font-size: 16px;
    font-weight: 900;
    margin: 0 0 12px 0;
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
  const [exportingPDF, setExportingPDF] = useState(false)
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: { current: 0, previous: 0, growth: 0 },
    expenses: { current: 0, previous: 0, growth: 0 },
    profitMargin: { current: 0, previous: 0, change: 0 },
    customerMetrics: { totalClients: 0, newClients: 0, clientRetention: 0 },
    operationalMetrics: { averageInvoiceValue: 0, paymentCycleTime: 0, projectCompletionRate: 0 },
    financialRatios: { currentRatio: 0, quickRatio: 0, debtToEquity: 0, returnOnAssets: 0 }
  });

  // Initialize Supabase client
  const supabase = createSupabaseClient();

  const [dateRange, setDateRange] = useState<'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'last_year' | 'custom'>('last_6_months')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const period = useMemo(() => {
    const now = new Date()
    const toISO = (d: Date) => format(d, 'yyyy-MM-dd')

    if (dateRange === 'this_month') {
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      return { startISO: toISO(start), endISO: toISO(end), label: 'This Month' }
    }
    if (dateRange === 'last_month') {
      const start = startOfMonth(subMonths(now, 1))
      const end = endOfMonth(start)
      return { startISO: toISO(start), endISO: toISO(end), label: 'Last Month' }
    }
    if (dateRange === 'last_3_months') {
      const start = startOfMonth(subMonths(now, 2))
      const end = endOfMonth(now)
      return { startISO: toISO(start), endISO: toISO(end), label: 'Last 3 Months' }
    }
    if (dateRange === 'last_6_months') {
      const start = startOfMonth(subMonths(now, 5))
      const end = endOfMonth(now)
      return { startISO: toISO(start), endISO: toISO(end), label: 'Last 6 Months' }
    }
    if (dateRange === 'this_year') {
      const start = startOfYear(now)
      const end = endOfYear(now)
      return { startISO: toISO(start), endISO: toISO(end), label: 'This Year' }
    }
    if (dateRange === 'last_year') {
      const start = startOfYear(subYears(now, 1))
      const end = endOfYear(start)
      return { startISO: toISO(start), endISO: toISO(end), label: 'Last Year' }
    }

    const parsedFrom = customFrom ? new Date(customFrom) : startOfMonth(now)
    const parsedTo = customTo ? new Date(customTo) : endOfMonth(now)
    const s = parsedFrom <= parsedTo ? parsedFrom : parsedTo
    const e = parsedFrom <= parsedTo ? parsedTo : parsedFrom
    return { startISO: toISO(s), endISO: toISO(e), label: 'Custom' }
  }, [customFrom, customTo, dateRange])

  const [startDate, setStartDate] = useState(period.startISO);
  const [endDate, setEndDate] = useState(period.endISO);

  useEffect(() => {
    setStartDate(period.startISO)
    setEndDate(period.endISO)
  }, [period.endISO, period.startISO])

  const fetchBusinessMetrics = useCallback(async () => {
    if (!user || !supabase) return;
    
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
      const [paymentsData, expensesData, clientsData, projectsData] = await Promise.all([
        // Current period payments (for accurate revenue calculation)
        supabase
          .from('payments')
          .select('amount, payment_date, invoices!inner(user_id, client_id, due_date)')
          .eq('invoices.user_id', user.id)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate),
        
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
      const [prevPaymentsData, prevExpensesData] = await Promise.all([
        supabase
          .from('payments')
          .select('amount, payment_date, invoices!inner(user_id)')
          .eq('invoices.user_id', user.id)
          .gte('payment_date', format(previousStart, 'yyyy-MM-dd'))
          .lte('payment_date', format(previousEnd, 'yyyy-MM-dd')),
        
        supabase
          .from('expenses')
          .select('amount, date')
          .eq('user_id', user.id)
          .gte('date', format(previousStart, 'yyyy-MM-dd'))
          .lte('date', format(previousEnd, 'yyyy-MM-dd'))
      ]);

      if (paymentsData.error) throw paymentsData.error;
      if (expensesData.error) throw expensesData.error;
      if (clientsData.error) throw clientsData.error;
      if (projectsData.error) throw projectsData.error;
      if (prevPaymentsData.error) throw prevPaymentsData.error;
      if (prevExpensesData.error) throw prevExpensesData.error;

      // Calculate revenue metrics
      const currentRevenue = paymentsData.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const previousRevenue = prevPaymentsData.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
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
      const paidPayments = paymentsData.data || [];
      const averageInvoiceValue = paidPayments.length > 0 ? paidPayments.reduce((sum, payment) => sum + payment.amount, 0) / paidPayments.length : 0;
      
      // Calculate average payment cycle time
      const paymentCycleTime = paidPayments.length > 0 ? 
        paidPayments.reduce((sum, payment) => {
          const paymentDate = parseISO(payment.payment_date);
          // Handle the invoices data structure properly - it's an array from the join
          const invoiceData = payment.invoices[0]; // Get the first (and typically only) invoice
          if (invoiceData && invoiceData.due_date) {
            const dueDate = parseISO(invoiceData.due_date);
            return sum + differenceInDays(paymentDate, dueDate);
          }
          return sum; // Skip if no invoice data
        }, 0) / paidPayments.length : 0;

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
  }, [endDate, startDate, supabase, user]);

  useEffect(() => {
    fetchBusinessMetrics();
  }, [fetchBusinessMetrics]);

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
      setExportingPDF(true)
      const { exportToPDF: exportPDF, formatCurrencyForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Business Performance Metrics',
        subtitle: period.label,
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

      await exportPDF('business-metrics-export-content', exportData, {
        filename: `business-metrics-${startDate}-to-${endDate}`,
        orientation: 'landscape',
        format: 'a4',
        includeHeader: true,
        includeFooter: true
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF');
    } finally {
      setExportingPDF(false)
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
            <Button onClick={fetchBusinessMetrics}>
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
              <Button variant="outline" onClick={exportToPDF} disabled={exportingPDF}>
                <Download size={16} />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <FileText size={16} />
                Export Excel
              </Button>
              <Button onClick={fetchBusinessMetrics}>
                <RefreshCw size={16} />
                Refresh
              </Button>
            </HeaderActions>
          </Header>

          <ControlsBar>
            <ControlsLeft>
              <Select value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)}>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom</option>
              </Select>
              {dateRange === 'custom' && (
                <>
                  <DateInput type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                  <DateInput type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </>
              )}
            </ControlsLeft>
          </ControlsBar>

          <div id="business-metrics-content">

        <MetricsGrid>
          <MetricCard $variant={metrics.revenue.growth >= 0 ? 'positive' : 'negative'}>
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

          <MetricCard $variant={metrics.profitMargin.change >= 0 ? 'positive' : 'negative'}>
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

          <MetricCard $variant="neutral">
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

          <MetricCard $variant="warning">
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

        <div
          id="business-metrics-export-content"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '1120px',
            padding: '24px',
            background: '#ffffff',
            color: '#111827',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>Business Performance Metrics</div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>{period.label}</div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                {format(new Date(startDate), 'MMM dd, yyyy')} - {format(new Date(endDate), 'MMM dd, yyyy')}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{format(new Date(), 'MMM dd, yyyy')}</div>
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
            {[
              { label: 'Revenue', value: formatCurrency(metrics.revenue.current) },
              { label: 'Expenses', value: formatCurrency(metrics.expenses.current) },
              { label: 'Profit Margin', value: formatPercentage(metrics.profitMargin.current) },
              { label: 'Clients', value: String(metrics.customerMetrics.totalClients) }
            ].map((item) => (
              <div key={item.label} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {item.label}
                </div>
                <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 900 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', marginTop: '16px', marginBottom: '12px' }} />

          <div style={{ fontSize: '13px', fontWeight: 900, marginBottom: '8px' }}>KPI Summary</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['KPI', 'Current', 'Target', 'Status', 'Category'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === 'KPI' || h === 'Category' ? 'left' : 'right',
                        padding: '10px 12px',
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#6b7280',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getKPIs().map((kpi, idx) => {
                  const statusLabel = kpi.status === 'positive' ? 'On track' : kpi.status === 'warning' ? 'Watch' : kpi.status === 'negative' ? 'Needs work' : 'Info'
                  const statusColor = kpi.status === 'positive' ? '#16a34a' : kpi.status === 'warning' ? '#d97706' : kpi.status === 'negative' ? '#dc2626' : '#6b7280'
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>{kpi.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', whiteSpace: 'nowrap' }}>{kpi.value}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', whiteSpace: 'nowrap' }}>{kpi.target}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', whiteSpace: 'nowrap', color: statusColor, fontWeight: 800 }}>
                        {statusLabel}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>{kpi.category}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </DashboardLayout>
  );
}
