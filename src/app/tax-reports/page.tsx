'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  Calculator, 
  FileText, 
  DollarSign, 
  Calendar,
  Download,
  Receipt,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock
} from 'lucide-react'
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, getQuarter } from 'date-fns'

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

const Button = styled.button<{ variant?: 'primary' | 'outline' | 'ghost' | 'success' | 'warning' }>`
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

  ${props => props.variant === 'success' && `
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-color: #10b981;

    &:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  `}

  ${props => props.variant === 'warning' && `
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    border-color: #f59e0b;

    &:hover {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
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

const PeriodSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;

  .period-options {
    display: flex;
    gap: 0.5rem;
  }

  .period-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover, &.active {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
      color: #ef4444;
    }
  }

  .year-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;

    select {
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
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div<{ variant?: 'positive' | 'negative' | 'neutral' | 'warning' }>`
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
      props.variant === 'warning' ? '#f59e0b' :
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

const TaxTable = styled.div`
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

  .tax-rate {
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-align: center;
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
`

const ComplianceStatus = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`

const ComplianceCard = styled.div<{ status: 'compliant' | 'warning' | 'overdue' }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${props => 
    props.status === 'compliant' ? 'rgba(16, 185, 129, 0.3)' :
    props.status === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
    'rgba(239, 68, 68, 0.3)'
  };
  border-radius: 12px;
  padding: 1.5rem;

  .compliance-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .status-icon {
      color: ${props => 
        props.status === 'compliant' ? '#10b981' :
        props.status === 'warning' ? '#f59e0b' :
        '#ef4444'
      };
    }

    .title {
      font-weight: 600;
      color: var(--heading-primary);
    }
  }

  .compliance-details {
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .due-date {
    margin-top: 0.5rem;
    font-weight: 500;
    color: ${props => 
      props.status === 'compliant' ? '#10b981' :
      props.status === 'warning' ? '#f59e0b' :
      '#ef4444'
    };
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
interface TaxData {
  category: 'income' | 'deduction' | 'tax_liability';
  subcategory: string;
  lineItem: string;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  type: string;
}

interface TaxSummary {
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTaxLiability: number;
  effectiveTaxRate: number;
  quarterlyBreakdown: Array<{
    quarter: number;
    income: number;
    deductions: number;
    taxLiability: number;
  }>;
}

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'compliant' | 'warning' | 'overdue';
}

export default function TaxReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxData, setTaxData] = useState<TaxData[]>([]);
  const [summary, setSummary] = useState<TaxSummary>({
    totalIncome: 0,
    totalDeductions: 0,
    taxableIncome: 0,
    totalTaxLiability: 0,
    effectiveTaxRate: 0,
    quarterlyBreakdown: []
  });

  // Period state
  const [selectedPeriod, setSelectedPeriod] = useState<'quarterly' | 'annual'>('annual');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(getQuarter(new Date()));

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      title: 'Quarterly Tax Return',
      description: 'Submit quarterly tax return for business income and expenses',
      dueDate: format(endOfQuarter(new Date()), 'MMM dd, yyyy'),
      status: 'warning'
    },
    {
      id: '2',
      title: 'Annual Tax Filing',
      description: 'Complete annual tax return filing with all supporting documents',
      dueDate: 'April 15, 2024',
      status: 'compliant'
    },
    {
      id: '3',
      title: 'Sales Tax Report',
      description: 'Monthly sales tax report and payment submission',
      dueDate: format(new Date(), 'MMM dd, yyyy'),
      status: 'overdue'
    },
    {
      id: '4',
      title: 'Payroll Tax',
      description: 'Employee payroll tax withholdings and employer contributions',
      dueDate: format(new Date(), 'MMM dd, yyyy'),
      status: 'compliant'
    }
  ];

  const fetchTaxData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      let startDate: Date;
      let endDate: Date;

      if (selectedPeriod === 'quarterly') {
        startDate = startOfQuarter(new Date(selectedYear, (selectedQuarter - 1) * 3));
        endDate = endOfQuarter(new Date(selectedYear, (selectedQuarter - 1) * 3));
      } else {
        startDate = startOfYear(new Date(selectedYear, 0));
        endDate = endOfYear(new Date(selectedYear, 0));
      }

      // Fetch income data from invoices
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', format(startDate, 'yyyy-MM-dd'))
        .lte('created_at', format(endDate, 'yyyy-MM-dd'));

      if (invoiceError) throw invoiceError;

      // Fetch deductible expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, category, date, description')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (expenseError) throw expenseError;


      // Calculate income
      const totalIncome = invoiceData?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

      // Group deductible expenses
      const deductibleCategories = [
        'Office Supplies', 'Travel', 'Marketing', 'Professional Services', 
        'Software', 'Equipment', 'Utilities', 'Rent'
      ];

      const deductibleExpenses = expenseData?.filter(expense => 
        deductibleCategories.includes(expense.category || '')
      ) || [];

      const totalDeductions = deductibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Build tax data structure
      const taxItems: TaxData[] = [];

      // Income items
      if (totalIncome > 0) {
        taxItems.push({
          category: 'income',
          subcategory: 'business_income',
          lineItem: 'Invoice Revenue',
          amount: totalIncome,
          type: 'income'
        });
      }

      // Deduction items
      const deductionsByCategory = deductibleExpenses.reduce((acc, expense) => {
        const category = expense.category || 'Other Deductions';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(deductionsByCategory).forEach(([category, amount]) => {
        taxItems.push({
          category: 'deduction',
          subcategory: category.toLowerCase().replace(/\s+/g, '_'),
          lineItem: category,
          amount: amount,
          type: 'deduction'
        });
      });

      // Calculate tax liability (simplified Pakistani tax rates)
      const taxableIncome = Math.max(0, totalIncome - totalDeductions);
      let taxLiability = 0;

      // Simplified Pakistani tax brackets for businesses
      if (taxableIncome > 0) {
        if (taxableIncome <= 600000) {
          taxLiability = 0; // Tax-free threshold
        } else if (taxableIncome <= 1200000) {
          taxLiability = (taxableIncome - 600000) * 0.05; // 5%
        } else if (taxableIncome <= 2400000) {
          taxLiability = 30000 + (taxableIncome - 1200000) * 0.10; // 10%
        } else if (taxableIncome <= 3600000) {
          taxLiability = 150000 + (taxableIncome - 2400000) * 0.15; // 15%
        } else if (taxableIncome <= 6000000) {
          taxLiability = 330000 + (taxableIncome - 3600000) * 0.20; // 20%
        } else {
          taxLiability = 810000 + (taxableIncome - 6000000) * 0.25; // 25%
        }

        taxItems.push({
          category: 'tax_liability',
          subcategory: 'income_tax',
          lineItem: 'Income Tax',
          amount: taxableIncome,
          taxRate: (taxLiability / taxableIncome) * 100,
          taxAmount: taxLiability,
          type: 'tax_liability'
        });
      }

      setTaxData(taxItems);

      // Generate quarterly breakdown for annual view
      const quarterlyBreakdown = [];
      if (selectedPeriod === 'annual') {
        for (let q = 1; q <= 4; q++) {
          const qStart = startOfQuarter(new Date(selectedYear, (q - 1) * 3));
          const qEnd = endOfQuarter(new Date(selectedYear, (q - 1) * 3));

          const qIncome = invoiceData?.filter(invoice => {
            const invoiceDate = new Date(invoice.created_at);
            return invoiceDate >= qStart && invoiceDate <= qEnd;
          }).reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

          const qDeductions = deductibleExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= qStart && expenseDate <= qEnd;
          }).reduce((sum, expense) => sum + expense.amount, 0);

          const qTaxableIncome = Math.max(0, qIncome - qDeductions);
          let qTaxLiability = 0;

          // Calculate quarterly tax liability
          if (qTaxableIncome > 150000) { // Quarterly threshold
            qTaxLiability = qTaxableIncome * 0.15; // Simplified quarterly rate
          }

          quarterlyBreakdown.push({
            quarter: q,
            income: qIncome,
            deductions: qDeductions,
            taxLiability: qTaxLiability
          });
        }
      }

      const effectiveTaxRate = taxableIncome > 0 ? (taxLiability / taxableIncome) * 100 : 0;

      setSummary({
        totalIncome,
        totalDeductions,
        taxableIncome,
        totalTaxLiability: taxLiability,
        effectiveTaxRate,
        quarterlyBreakdown
      });

    } catch (err) {
      console.error('Error fetching tax data:', err);
      setError('Failed to load tax data');
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod, selectedYear, selectedQuarter]);

  useEffect(() => {
    fetchTaxData();
  }, [user, selectedPeriod, selectedYear, selectedQuarter, fetchTaxData]);

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
      const { exportToPDF: exportPDF, formatCurrencyForExport } = await import('@/lib/exportUtils');
      
      const exportData = {
        title: 'Tax Reports',
        subtitle: 'Comprehensive tax calculations and compliance tracking',
        dateRange: selectedPeriod === 'quarterly' 
          ? `Q${selectedQuarter} ${selectedYear}`
          : `Year ${selectedYear}`,
        data: taxData.map(item => ({
          'Category': item.category,
          'Amount': formatCurrencyForExport(item.amount),
          'Tax Rate': `${item.taxRate}%`,
          'Tax Amount': formatCurrencyForExport(item.taxAmount || 0),
          'Type': item.type
        })),
        summary: {
          'Total Income': formatCurrencyForExport(summary.totalIncome),
          'Total Deductions': formatCurrencyForExport(summary.totalDeductions),
          'Taxable Income': formatCurrencyForExport(summary.taxableIncome),
          'Tax Liability': formatCurrencyForExport(summary.totalTaxLiability),
          'Effective Tax Rate': `${summary.effectiveTaxRate}%`
        }
      };

      await exportPDF('tax-reports-content', exportData, {
        filename: `tax-reports-${selectedPeriod}-${selectedYear}-${selectedPeriod === 'quarterly' ? `Q${selectedQuarter}` : ''}-${format(new Date(), 'yyyy-MM-dd')}`,
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
        title: 'Tax Reports',
        subtitle: 'Comprehensive tax calculations and compliance tracking',
        dateRange: selectedPeriod === 'quarterly' 
          ? `Q${selectedQuarter} ${selectedYear}`
          : `Year ${selectedYear}`,
        data: taxData.map(item => ({
          'Category': item.category,
          'Amount': formatCurrencyForExport(item.amount),
          'Tax Rate': `${item.taxRate}%`,
          'Tax Amount': formatCurrencyForExport(item.taxAmount || 0),
          'Type': item.type
        })),
        summary: {
          'Total Income': formatCurrencyForExport(summary.totalIncome),
          'Total Deductions': formatCurrencyForExport(summary.totalDeductions),
          'Taxable Income': formatCurrencyForExport(summary.taxableIncome),
          'Tax Liability': formatCurrencyForExport(summary.totalTaxLiability),
          'Effective Tax Rate': `${summary.effectiveTaxRate}%`
        }
      };

      exportExcel(exportData, {
        filename: `tax-reports-${selectedPeriod}-${selectedYear}-${selectedPeriod === 'quarterly' ? `Q${selectedQuarter}` : ''}-${format(new Date(), 'yyyy-MM-dd')}`
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
            <span style={{ marginLeft: '1rem' }}>Loading Tax Reports...</span>
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
            <Button variant="primary" onClick={fetchTaxData}>
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
            <h1>Tax Reports & Calculations</h1>
            <p>Comprehensive tax analysis and compliance tracking for your business</p>
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
            <Button variant="primary" onClick={fetchTaxData}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </HeaderActions>
        </Header>

        <PeriodSelector>
          <Calendar size={20} />
          <div className="period-options">
            <button
              className={`period-btn ${selectedPeriod === 'quarterly' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('quarterly')}
            >
              Quarterly
            </button>
            <button
              className={`period-btn ${selectedPeriod === 'annual' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('annual')}
            >
              Annual
            </button>
          </div>
          
          <div className="year-selector">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            {selectedPeriod === 'quarterly' && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            )}
          </div>
        </PeriodSelector>

        <div id="tax-reports-content">

        <StatsGrid>
          <StatCard variant="positive">
            <div className="stat-header">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalIncome)}</div>
            <div className="stat-label">Total Income</div>
            <div className="stat-change">
              <TrendingUp size={12} />
              Taxable business income
            </div>
          </StatCard>

          <StatCard variant="neutral">
            <div className="stat-header">
              <div className="stat-icon">
                <Receipt size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalDeductions)}</div>
            <div className="stat-label">Total Deductions</div>
            <div className="stat-change">
              <Receipt size={12} />
              Business expense deductions
            </div>
          </StatCard>

          <StatCard variant="warning">
            <div className="stat-header">
              <div className="stat-icon">
                <Calculator size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.taxableIncome)}</div>
            <div className="stat-label">Taxable Income</div>
            <div className="stat-change">
              <Calculator size={12} />
              After deductions
            </div>
          </StatCard>

          <StatCard variant="negative">
            <div className="stat-header">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="stat-value">{formatCurrency(summary.totalTaxLiability)}</div>
            <div className="stat-label">Tax Liability</div>
            <div className="stat-change">
              <TrendingDown size={12} />
              {formatPercentage(summary.effectiveTaxRate)} effective rate
            </div>
          </StatCard>
        </StatsGrid>

        <ReportSection>
          <h2>
            <BarChart3 size={24} />
            Detailed Tax Calculation
          </h2>
          
          <TaxTable>
            <div className="table-header">
              <div>Line Item</div>
              <div>Amount</div>
              <div>Tax Rate</div>
              <div>Tax Amount</div>
            </div>

            {/* Income Section */}
            <div className="table-row section-header">
              <div>INCOME</div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            
            {taxData
              .filter(item => item.category === 'income')
              .map((item, index) => (
                <div key={`income-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount positive">{formatCurrency(item.amount)}</div>
                  <div className="tax-rate">-</div>
                  <div className="amount">-</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>Total Income</div>
              <div className="amount positive">{formatCurrency(summary.totalIncome)}</div>
              <div className="tax-rate">-</div>
              <div className="amount">-</div>
            </div>

            {/* Deductions Section */}
            <div className="table-row section-header">
              <div>DEDUCTIONS</div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            {taxData
              .filter(item => item.category === 'deduction')
              .map((item, index) => (
                <div key={`deduction-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount negative">({formatCurrency(item.amount)})</div>
                  <div className="tax-rate">-</div>
                  <div className="amount">-</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>Total Deductions</div>
              <div className="amount negative">({formatCurrency(summary.totalDeductions)})</div>
              <div className="tax-rate">-</div>
              <div className="amount">-</div>
            </div>

            {/* Tax Liability Section */}
            <div className="table-row section-header">
              <div>TAX LIABILITY</div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            <div className="table-row">
              <div className="line-item">Taxable Income</div>
              <div className="amount warning">{formatCurrency(summary.taxableIncome)}</div>
              <div className="tax-rate">-</div>
              <div className="amount">-</div>
            </div>

            {taxData
              .filter(item => item.category === 'tax_liability')
              .map((item, index) => (
                <div key={`tax-${index}`} className="table-row">
                  <div className="line-item">{item.lineItem}</div>
                  <div className="amount">{formatCurrency(item.amount)}</div>
                  <div className="tax-rate">{item.taxRate ? formatPercentage(item.taxRate) : '-'}</div>
                  <div className="amount negative">{item.taxAmount ? formatCurrency(item.taxAmount) : '-'}</div>
                </div>
              ))}

            <div className="table-row total-row">
              <div>TOTAL TAX LIABILITY</div>
              <div className="amount"></div>
              <div className="tax-rate">{formatPercentage(summary.effectiveTaxRate)}</div>
              <div className="amount negative">{formatCurrency(summary.totalTaxLiability)}</div>
            </div>
          </TaxTable>
        </ReportSection>

        {selectedPeriod === 'annual' && summary.quarterlyBreakdown.length > 0 && (
          <ReportSection>
            <h2>
              <PieChart size={24} />
              Quarterly Breakdown
            </h2>
            
            <TaxTable>
              <div className="table-header">
                <div>Quarter</div>
                <div>Income</div>
                <div>Deductions</div>
                <div>Tax Liability</div>
              </div>

              {summary.quarterlyBreakdown.map((quarter, index) => (
                <div key={index} className="table-row">
                  <div className="line-item">Q{quarter.quarter} {selectedYear}</div>
                  <div className="amount positive">{formatCurrency(quarter.income)}</div>
                  <div className="amount negative">({formatCurrency(quarter.deductions)})</div>
                  <div className="amount warning">{formatCurrency(quarter.taxLiability)}</div>
                </div>
              ))}
            </TaxTable>
          </ReportSection>
        )}

        <ReportSection>
          <h2>
            <Shield size={24} />
            Tax Compliance Status
          </h2>
          
          <ComplianceStatus>
            {complianceItems.map((item) => (
              <ComplianceCard key={item.id} status={item.status}>
                <div className="compliance-header">
                  <div className="status-icon">
                    {item.status === 'compliant' && <CheckCircle size={20} />}
                    {item.status === 'warning' && <Clock size={20} />}
                    {item.status === 'overdue' && <AlertTriangle size={20} />}
                  </div>
                  <div className="title">{item.title}</div>
                </div>
                <div className="compliance-details">
                  {item.description}
                </div>
                <div className="due-date">
                  Due: {item.dueDate}
                </div>
              </ComplianceCard>
            ))}
          </ComplianceStatus>
        </ReportSection>
        </div>
      </Container>
    </DashboardLayout>
  );
}