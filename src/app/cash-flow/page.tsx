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
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Droplets
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns'

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div<{ variant?: 'positive' | 'negative' | 'neutral' }>`
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
      'linear-gradient(90deg, #6366f1, #4f46e5)'
    };
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => 
      props.variant === 'positive' ? 'rgba(16, 185, 129, 0.1)' :
      props.variant === 'negative' ? 'rgba(239, 68, 68, 0.1)' :
      'rgba(99, 102, 241, 0.1)'
    };
    color: ${props => 
      props.variant === 'positive' ? '#10b981' :
      props.variant === 'negative' ? '#ef4444' :
      '#6366f1'
    };
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--heading-primary);
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .stat-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: ${props => 
      props.variant === 'positive' ? '#10b981' :
      props.variant === 'negative' ? '#ef4444' :
      'var(--text-secondary)'
    };
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

const CashFlowTable = styled.div`
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

    &.total-row {
      font-weight: 700;
      color: var(--heading-primary);
      border-top: 2px solid rgba(255, 255, 255, 0.2);
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      background: rgba(239, 68, 68, 0.05);
    }
  }

  .line-item {
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .amount {
    color: var(--text-primary);
    font-weight: 500;
    text-align: right;
    font-family: 'Courier New', monospace;
  }

  .positive {
    color: #10b981;
  }

  .negative {
    color: #ef4444;
  }
`

const MonthlyBreakdown = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`

const MonthCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;

  .month-header {
    font-weight: 600;
    color: var(--heading-primary);
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .month-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .month-stat {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    
    .label {
      color: var(--text-secondary);
    }
    
    .value {
      color: var(--text-primary);
      font-weight: 500;
    }
  }

  .net-flow {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    
    &.positive .value {
      color: #10b981;
    }
    
    &.negative .value {
      color: #ef4444;
    }
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
interface CashFlowData {
  category: 'inflow' | 'outflow';
  subcategory: string;
  lineItem: string;
  amount: number;
  month: string;
}

interface CashFlowSummary {
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  operatingCashFlow: number;
  monthlyData: Array<{
    month: string;
    inflows: number;
    outflows: number;
    netFlow: number;
  }>;
}

export default function CashFlowPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({
    totalInflows: 0,
    totalOutflows: 0,
    netCashFlow: 0,
    operatingCashFlow: 0,
    monthlyData: []
  });

  // Date range state
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [activeQuickDate, setActiveQuickDate] = useState('last-6-months');

  const quickDateOptions = [
    { key: 'last-3-months', label: 'Last 3 Months', start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) },
    { key: 'last-6-months', label: 'Last 6 Months', start: startOfMonth(subMonths(new Date(), 5)), end: endOfMonth(new Date()) },
    { key: 'last-12-months', label: 'Last 12 Months', start: startOfMonth(subMonths(new Date(), 11)), end: endOfMonth(new Date()) },
    { key: 'ytd', label: 'Year to Date', start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
  ];

  const fetchCashFlowData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch invoice payments (cash inflows)
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount, status, created_at, due_date')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (invoiceError) throw invoiceError;

      // Fetch expenses (cash outflows)
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, category, date, description')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (expenseError) throw expenseError;

      // Generate monthly breakdown
      const months = eachMonthOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate)
      });

      const monthlyData = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        // Calculate inflows for this month
        const monthInflows = invoiceData?.filter(invoice => {
          const invoiceDate = parseISO(invoice.created_at);
          return invoiceDate >= monthStart && invoiceDate <= monthEnd;
        }).reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

        // Calculate outflows for this month
        const monthOutflows = expenseData?.filter(expense => {
          const expenseDate = parseISO(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        }).reduce((sum, expense) => sum + expense.amount, 0) || 0;

        return {
          month: format(month, 'MMM yyyy'),
          inflows: monthInflows,
          outflows: monthOutflows,
          netFlow: monthInflows - monthOutflows
        };
      });

      // Build cash flow data structure
      const cashFlowItems: CashFlowData[] = [];

      // Group inflows
      invoiceData?.forEach(invoice => {
        const month = format(parseISO(invoice.created_at), 'MMM yyyy');
        cashFlowItems.push({
          category: 'inflow',
          subcategory: 'revenue',
          lineItem: 'Invoice Payments',
          amount: invoice.amount,
          month
        });
      });

      // Group outflows by category
      const expensesByCategory = expenseData?.reduce((acc, expense) => {
        const category = expense.category || 'Other Expenses';
        const month = format(parseISO(expense.date), 'MMM yyyy');
        const key = `${category}-${month}`;
        
        if (!acc[key]) {
          acc[key] = {
            category: 'outflow' as const,
            subcategory: 'operating_expenses',
            lineItem: category,
            amount: 0,
            month
          };
        }
        acc[key].amount += expense.amount;
        return acc;
      }, {} as Record<string, CashFlowData>) || {};

      cashFlowItems.push(...Object.values(expensesByCategory));

      setCashFlowData(cashFlowItems);

      // Calculate summary
      const totalInflows = monthlyData.reduce((sum, month) => sum + month.inflows, 0);
      const totalOutflows = monthlyData.reduce((sum, month) => sum + month.outflows, 0);
      const netCashFlow = totalInflows - totalOutflows;

      setSummary({
        totalInflows,
        totalOutflows,
        netCashFlow,
        operatingCashFlow: netCashFlow, // Simplified for now
        monthlyData
      });

    } catch (err) {
      console.error('Error fetching cash flow data:', err);
      setError('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    fetchCashFlowData();
  }, [fetchCashFlowData]);

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

  const exportToPDF = async () => {
    try {
      const { exportToPDF: exportPDF, formatCurrencyForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Cash Flow Analysis',
        subtitle: 'Detailed cash inflows and outflows tracking',
        dateRange: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        data: summary.monthlyData.map(item => ({
          'Month': item.month,
          'Cash Inflows': formatCurrencyForExport(item.inflows),
          'Cash Outflows': formatCurrencyForExport(item.outflows),
          'Net Cash Flow': formatCurrencyForExport(item.netFlow)
        })),
        summary: {
          'Total Inflows': formatCurrencyForExport(summary.totalInflows),
          'Total Outflows': formatCurrencyForExport(summary.totalOutflows),
          'Net Cash Flow': formatCurrencyForExport(summary.netCashFlow),
          'Operating Cash Flow': formatCurrencyForExport(summary.operatingCashFlow)
        }
      };

      await exportPDF('cash-flow-content', exportData, {
        filename: `cash-flow-analysis-${format(new Date(), 'yyyy-MM-dd')}`,
        orientation: 'portrait'
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
        title: 'Cash Flow Analysis',
        subtitle: 'Detailed cash inflows and outflows tracking',
        dateRange: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        data: summary.monthlyData.map(item => ({
          'Month': item.month,
          'Cash Inflows': formatCurrencyForExport(item.inflows),
          'Cash Outflows': formatCurrencyForExport(item.outflows),
          'Net Cash Flow': formatCurrencyForExport(item.netFlow)
        })),
        summary: {
          'Total Inflows': formatCurrencyForExport(summary.totalInflows),
          'Total Outflows': formatCurrencyForExport(summary.totalOutflows),
          'Net Cash Flow': formatCurrencyForExport(summary.netCashFlow),
          'Operating Cash Flow': formatCurrencyForExport(summary.operatingCashFlow)
        }
      };

      exportExcel(exportData, {
        filename: `cash-flow-analysis-${format(new Date(), 'yyyy-MM-dd')}`
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
            <span style={{ marginLeft: '1rem' }}>Loading Cash Flow data...</span>
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
            <Button variant="primary" onClick={fetchCashFlowData}>
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
              <h1>Cash Flow Analysis</h1>
              <p>Track cash inflows and outflows over time</p>
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
              <Button variant="primary" onClick={fetchCashFlowData}>
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

          <div id="cash-flow-content">

        <StatsGrid>
          <StatCard variant="positive">
            <div className="stat-header">
              <div className="stat-icon">
                <ArrowUpCircle size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalInflows)}</div>
            <div className="stat-label">Total Cash Inflows</div>
            <div className="stat-change">
              <TrendingUp size={12} />
              From invoice payments
            </div>
          </StatCard>

          <StatCard variant="negative">
            <div className="stat-header">
              <div className="stat-icon">
                <ArrowDownCircle size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalOutflows)}</div>
            <div className="stat-label">Total Cash Outflows</div>
            <div className="stat-change">
              <TrendingDown size={12} />
              Operating expenses
            </div>
          </StatCard>

          <StatCard variant={summary.netCashFlow >= 0 ? 'positive' : 'negative'}>
            <div className="stat-header">
              <div className="stat-icon">
                <Droplets size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.netCashFlow)}</div>
            <div className="stat-label">Net Cash Flow</div>
            <div className="stat-change">
              {summary.netCashFlow >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {summary.netCashFlow >= 0 ? 'Positive flow' : 'Negative flow'}
            </div>
          </StatCard>

          <StatCard variant="neutral">
            <div className="stat-header">
              <div className="stat-icon">
                <Activity size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.operatingCashFlow)}</div>
            <div className="stat-label">Operating Cash Flow</div>
            <div className="stat-change">
              <Activity size={12} />
              Core business operations
            </div>
          </StatCard>
        </StatsGrid>

        <ReportSection>
          <h2>
            <BarChart3 size={24} />
            Cash Flow Statement
          </h2>
          
          <CashFlowTable>
            <div className="table-header">
              <div>Cash Flow Item</div>
              <div>Amount</div>
              <div>Category</div>
              <div>Period</div>
            </div>

            {/* Cash Inflows Section */}
            <div className="table-row section-header">
              <div>CASH INFLOWS</div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            
            {Object.values(cashFlowData
              .filter(item => item.category === 'inflow')
              .reduce((acc, item) => {
                const key = `${item.lineItem}-${item.subcategory}`;
                if (!acc[key]) {
                  acc[key] = { ...item, amount: 0 };
                }
                acc[key].amount += item.amount;
                return acc;
              }, {} as Record<string, CashFlowData>))
              .map((item, index) => (
                <div key={`inflow-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount positive">{formatCurrency(item.amount)}</div>
                  <div>{item.subcategory.replace('_', ' ').toUpperCase()}</div>
                  <div>{format(parseISO(startDate), 'MMM yyyy')} - {format(parseISO(endDate), 'MMM yyyy')}</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>Total Cash Inflows</div>
              <div className="amount positive">{formatCurrency(summary.totalInflows)}</div>
              <div></div>
              <div></div>
            </div>

            {/* Cash Outflows Section */}
            <div className="table-row section-header">
              <div>CASH OUTFLOWS</div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            {Object.values(cashFlowData
              .filter(item => item.category === 'outflow')
              .reduce((acc, item) => {
                const key = `${item.lineItem}-${item.subcategory}`;
                if (!acc[key]) {
                  acc[key] = { ...item, amount: 0 };
                }
                acc[key].amount += item.amount;
                return acc;
              }, {} as Record<string, CashFlowData>))
              .map((item, index) => (
                <div key={`outflow-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount negative">({formatCurrency(item.amount)})</div>
                  <div>{item.subcategory.replace('_', ' ').toUpperCase()}</div>
                  <div>{format(parseISO(startDate), 'MMM yyyy')} - {format(parseISO(endDate), 'MMM yyyy')}</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>Total Cash Outflows</div>
              <div className="amount negative">({formatCurrency(summary.totalOutflows)})</div>
              <div></div>
              <div></div>
            </div>

            {/* Net Cash Flow */}
            <div className="table-row total-row">
              <div>NET CASH FLOW</div>
              <div className={`amount ${summary.netCashFlow >= 0 ? 'positive' : 'negative'}`}>
                {summary.netCashFlow >= 0 ? formatCurrency(summary.netCashFlow) : `(${formatCurrency(Math.abs(summary.netCashFlow))})`}
              </div>
              <div></div>
              <div></div>
            </div>
          </CashFlowTable>
        </ReportSection>

        <ReportSection>
          <h2>
            <Calendar size={24} />
            Monthly Cash Flow Breakdown
          </h2>
          
          <MonthlyBreakdown>
            {summary.monthlyData.map((month, index) => (
              <MonthCard key={index}>
                <div className="month-header">{month.month}</div>
                <div className="month-stats">
                  <div className="month-stat">
                    <span className="label">Inflows:</span>
                    <span className="value positive">{formatCurrency(month.inflows)}</span>
                  </div>
                  <div className="month-stat">
                    <span className="label">Outflows:</span>
                    <span className="value negative">({formatCurrency(month.outflows)})</span>
                  </div>
                  <div className={`net-flow ${month.netFlow >= 0 ? 'positive' : 'negative'}`}>
                    <span className="label">Net Flow:</span>
                    <span className="value">
                      {month.netFlow >= 0 ? formatCurrency(month.netFlow) : `(${formatCurrency(Math.abs(month.netFlow))})`}
                    </span>
                  </div>
                </div>
              </MonthCard>
            ))}
          </MonthlyBreakdown>
        </ReportSection>
        </div>
      </Container>
    </DashboardLayout>
  );
}