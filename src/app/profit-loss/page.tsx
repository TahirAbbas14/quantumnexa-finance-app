'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: between;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

const PLTable = styled.div`
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
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

  .percentage {
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-align: right;
  }

  .positive {
    color: #10b981;
  }

  .negative {
    color: #ef4444;
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
interface PLData {
  category: string;
  subcategory: string;
  lineItem: string;
  amount: number;
  percentage: number;
  type: string;
}

interface PLSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export default function ProfitLossPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plData, setPLData] = useState<PLData[]>([]);
  const [summary, setSummary] = useState<PLSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0
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

  const fetchPLData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch revenue data from invoices
      const { data: invoiceData, error: invoiceError } = await supabase!
        .from('invoices')
        .select('amount, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (invoiceError) throw invoiceError;

      // Fetch expense data
      const { data: expenseData, error: expenseError } = await supabase!
        .from('expenses')
        .select('amount, category, date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (expenseError) throw expenseError;

      // Calculate revenue
      const totalRevenue = invoiceData?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

      // Group expenses by category
      const expensesByCategory = expenseData?.reduce((acc, expense) => {
        const category = expense.category || 'Other Expenses';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>) || {};

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

      // Build P&L data structure
      const plItems: PLData[] = [];

      // Revenue section
      if (totalRevenue > 0) {
        plItems.push({
          category: 'revenue',
          subcategory: 'sales_revenue',
          lineItem: 'Invoice Revenue',
          amount: totalRevenue,
          percentage: 100,
          type: 'revenue'
        });
      }

      // Expenses section
      Object.entries(expensesByCategory).forEach(([category, amount]) => {
        plItems.push({
          category: 'operating_expenses',
          subcategory: category.toLowerCase().replace(/\s+/g, '_'),
          lineItem: category,
          amount: amount,
          percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
          type: 'expense'
        });
      });

      setPLData(plItems);

      // Calculate summary
      const grossProfit = totalRevenue;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setSummary({
        totalRevenue,
        totalExpenses,
        grossProfit,
        netProfit,
        profitMargin
      });

    } catch (err) {
      console.error('Error fetching P&L data:', err);
      setError('Failed to load profit & loss data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLData();
  }, [user, startDate, endDate]);

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

  const exportToPDF = async () => {
    try {
      const { exportToPDF: exportPDF, formatCurrencyForExport, formatPercentageForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Profit & Loss Statement',
        subtitle: 'Detailed revenue and expense breakdown',
        dateRange: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        data: plData.map(item => ({
          'Line Item': item.lineItem,
          'Category': item.category,
          'Amount': formatCurrencyForExport(item.amount),
          'Type': item.type
        })),
        summary: {
          'Total Revenue': formatCurrencyForExport(summary.totalRevenue),
          'Total Expenses': formatCurrencyForExport(summary.totalExpenses),
          'Gross Profit': formatCurrencyForExport(summary.grossProfit),
          'Net Profit': formatCurrencyForExport(summary.netProfit),
          'Profit Margin': formatPercentageForExport(summary.profitMargin)
        }
      };

      await exportPDF('profit-loss-content', exportData, {
        filename: `profit-loss-statement-${format(new Date(), 'yyyy-MM-dd')}`,
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const { exportToExcel: exportExcel, formatCurrencyForExport, formatPercentageForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Profit & Loss Statement',
        subtitle: 'Detailed revenue and expense breakdown',
        dateRange: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        data: plData.map(item => ({
          'Line Item': item.lineItem,
          'Category': item.category,
          'Amount': formatCurrencyForExport(item.amount),
          'Type': item.type
        })),
        summary: {
          'Total Revenue': formatCurrencyForExport(summary.totalRevenue),
          'Total Expenses': formatCurrencyForExport(summary.totalExpenses),
          'Gross Profit': formatCurrencyForExport(summary.grossProfit),
          'Net Profit': formatCurrencyForExport(summary.netProfit),
          'Profit Margin': formatPercentageForExport(summary.profitMargin)
        }
      };

      exportExcel(exportData, {
        filename: `profit-loss-statement-${format(new Date(), 'yyyy-MM-dd')}`
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
            <span style={{ marginLeft: '1rem' }}>Loading Profit & Loss data...</span>
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
            <Button variant="primary" onClick={fetchPLData}>
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
              <h1>Profit & Loss Statement</h1>
              <p>Detailed revenue and expense breakdown</p>
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
              <Button variant="primary" onClick={fetchPLData}>
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

          <div id="profit-loss-content">

        <StatsGrid>
          <StatCard variant="positive">
            <div className="stat-header">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-change">
              <TrendingUp size={12} />
              Revenue from paid invoices
            </div>
          </StatCard>

          <StatCard variant="negative">
            <div className="stat-header">
              <div className="stat-icon">
                <TrendingDown size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalExpenses)}</div>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-change">
              <TrendingDown size={12} />
              Operating expenses
            </div>
          </StatCard>

          <StatCard variant={summary.netProfit >= 0 ? 'positive' : 'negative'}>
            <div className="stat-header">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.netProfit)}</div>
            <div className="stat-label">Net Profit</div>
            <div className="stat-change">
              {summary.netProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatPercentage(summary.profitMargin)} margin
            </div>
          </StatCard>
        </StatsGrid>

        <ReportSection>
          <h2>
            <BarChart3 size={24} />
            Detailed Profit & Loss Statement
          </h2>
          
          <PLTable>
            <div className="table-header">
              <div>Line Item</div>
              <div>Amount</div>
              <div>% of Revenue</div>
            </div>

            {/* Revenue Section */}
            <div className="table-row section-header">
              <div>REVENUE</div>
              <div></div>
              <div></div>
            </div>
            
            {plData
              .filter(item => item.category === 'revenue')
              .map((item, index) => (
                <div key={`revenue-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount positive">{formatCurrency(item.amount)}</div>
                  <div className="percentage">{formatPercentage(item.percentage)}</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>Total Revenue</div>
              <div className="amount positive">{formatCurrency(summary.totalRevenue)}</div>
              <div className="percentage">100.0%</div>
            </div>

            {/* Expenses Section */}
            <div className="table-row section-header">
              <div>OPERATING EXPENSES</div>
              <div></div>
              <div></div>
            </div>

            {plData
              .filter(item => item.category === 'operating_expenses')
              .map((item, index) => (
                <div key={`expense-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount negative">({formatCurrency(item.amount)})</div>
                  <div className="percentage">({formatPercentage(item.percentage)})</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>Total Operating Expenses</div>
              <div className="amount negative">({formatCurrency(summary.totalExpenses)})</div>
              <div className="percentage">({formatPercentage(summary.totalExpenses / summary.totalRevenue * 100)})</div>
            </div>

            {/* Net Profit */}
            <div className="table-row total-row">
              <div>NET PROFIT</div>
              <div className={`amount ${summary.netProfit >= 0 ? 'positive' : 'negative'}`}>
                {summary.netProfit >= 0 ? formatCurrency(summary.netProfit) : `(${formatCurrency(Math.abs(summary.netProfit))})`}
              </div>
              <div className="percentage">{formatPercentage(summary.profitMargin)}</div>
            </div>
          </PLTable>
          </ReportSection>
        </div>
      </Container>
    </DashboardLayout>
  );
}