'use client';

import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Download,
  Search,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  RefreshCw,
  FileText,
  Activity,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Loader2
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import styled from 'styled-components';
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from 'date-fns';

// Styled Components
const GlassCard = styled(Card)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const AccountHeader = styled(GlassCard)`
  padding: 2rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

const StatsCard = styled(GlassCard)`
  padding: 1.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  }
`;

const TransactionCard = styled(GlassCard)`
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
  }
`;

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--gray-600)'};
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(59, 130, 246, 0.1)'};
    color: ${props => props.active ? 'white' : 'var(--gray-800)'};
  }
`;

const GradientButton = styled(Button)`
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(59, 130, 246, 0.1);
    border-left: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const ChartContainer = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const GlassModal = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'savings' | 'investment';
  balance: number;
  currency: string;
  bank_name?: string;
  account_number?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  account_id: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  description: string;
  reference?: string;
  date: string;
  created_at: string;
}

const ACCOUNT_TYPES = {
  bank: { label: 'Bank Account', icon: Landmark, color: 'blue' },
  cash: { label: 'Cash', icon: Wallet, color: 'green' },
  credit: { label: 'Credit Card', icon: CreditCard, color: 'orange' },
  savings: { label: 'Savings Account', icon: PiggyBank, color: 'purple' },
  investment: { label: 'Investment Account', icon: TrendingUp, color: 'indigo' }
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const supabase = createSupabaseClient();

  // Fix: Memoize fetchAccountDetails and fetchTransactions
  const fetchAccountDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setAccount(data);
    } catch (error) {
      console.error('Error fetching account:', error);
      router.push('/accounts');
    }
  }, [supabase, accountId, user?.id, router]);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('account_transactions')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, accountId, user?.id]);

  useEffect(() => {
    if (user && accountId) {
      fetchAccountDetails();
      fetchTransactions();
    }
  }, [user, accountId, fetchAccountDetails, fetchTransactions]);

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchAccountDetails(), fetchTransactions()]);
    setRefreshing(false);
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      router.push('/accounts');
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const toggleAccountStatus = async () => {
    if (!account) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !account.is_active })
        .eq('id', accountId);

      if (error) throw error;
      fetchAccountDetails();
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter(transaction =>
        isWithinInterval(new Date(transaction.date), { start: startDate, end: endDate })
      );
    }

    return filtered;
  };

  const getTransactionStats = () => {
    const filtered = getFilteredTransactions();
    const credits = filtered.filter(t => t.type === 'credit');
    const debits = filtered.filter(t => t.type === 'debit');
    
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
    const netFlow = totalCredits - totalDebits;
    
    return {
      totalCredits,
      totalDebits,
      netFlow,
      transactionCount: filtered.length,
      avgTransaction: filtered.length > 0 ? (totalCredits + totalDebits) / filtered.length : 0
    };
  };

  const getMonthlyData = () => {
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t =>
        isWithinInterval(new Date(t.date), { start, end })
      );
      
      const credits = monthTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const debits = monthTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      
      monthlyData.push({
        month: format(date, 'MMM yyyy'),
        credits,
        debits,
        net: credits - debits
      });
    }
    return monthlyData;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Account not found</h3>
            <p className="text-gray-600 mb-6">The account you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Button onClick={() => router.push('/accounts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Accounts
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const accountType = ACCOUNT_TYPES[account.type];
  const IconComponent = accountType.icon;
  const stats = getTransactionStats();
  const monthlyData = getMonthlyData();

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/accounts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {account.name}
              </h1>
              <p className="text-gray-600 mt-1">{accountType.label}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowBalances(!showBalances)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBalances ? 'Hide' : 'Show'} Balance
            </Button>
            <Button
              onClick={refreshData}
              variant="outline"
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddTransaction(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Account Overview */}
        <AccountHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 bg-gradient-to-br from-${accountType.color}-500 to-${accountType.color}-600 rounded-2xl text-white`}>
                <IconComponent size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {showBalances ? formatPKR(account.balance) : '••••••'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {account.bank_name && (
                    <div className="flex items-center gap-1">
                      <Building2 size={16} />
                      <span>{account.bank_name}</span>
                    </div>
                  )}
                  {account.account_number && (
                    <div className="flex items-center gap-1">
                      <CreditCard size={16} />
                      <span>••••{account.account_number.slice(-4)}</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    account.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {account.is_active ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {account.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                {account.description && (
                  <p className="text-gray-600 mt-2">{account.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {/* Edit functionality */}}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={toggleAccountStatus}
                className="flex items-center gap-2"
              >
                {account.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {account.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="outline"
                onClick={deleteAccount}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </AccountHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                <ArrowDownLeft className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Credits</p>
            <p className="text-2xl font-bold text-green-600">
              {showBalances ? formatPKR(stats.totalCredits) : '••••••'}
            </p>
          </StatsCard>
          
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Debits</p>
            <p className="text-2xl font-bold text-red-600">
              {showBalances ? formatPKR(stats.totalDebits) : '••••••'}
            </p>
          </StatsCard>
          
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className={`p-3 bg-gradient-to-br ${stats.netFlow >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} rounded-full`}>
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Net Flow</p>
            <p className={`text-2xl font-bold ${stats.netFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {showBalances ? `${stats.netFlow >= 0 ? '+' : ''}${formatPKR(stats.netFlow)}` : '••••••'}
            </p>
          </StatsCard>
          
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.transactionCount}
            </p>
          </StatsCard>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'transactions'}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </TabButton>
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <TransactionCard key={transaction.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'credit' ? 'bg-green-100 text-green-600' :
                          transaction.type === 'debit' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {transaction.type === 'credit' ? <ArrowDownLeft size={16} /> :
                           transaction.type === 'debit' ? <ArrowUpRight size={16} /> :
                           <ArrowRightLeft size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                            {transaction.reference && ` • ${transaction.reference}`}
                          </p>
                        </div>
                      </div>
                      <div className={`text-right ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <p className="font-semibold">
                          {transaction.type === 'credit' ? '+' : '-'}{formatPKR(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </TransactionCard>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No transactions yet</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Monthly Trend */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Monthly Trend
              </h3>
              <ChartContainer>
                <div className="text-center">
                  <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600">Chart visualization would go here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Showing {monthlyData.length} months of data
                  </p>
                </div>
              </ChartContainer>
            </GlassCard>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Filters */}
            <GlassCard className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                  <option value="transfer">Transfers</option>
                </select>
                
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </GlassCard>

            {/* Transactions List */}
            <GlassCard className="p-6">
              <div className="space-y-2">
                {getFilteredTransactions().map((transaction) => (
                  <TransactionCard key={transaction.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'credit' ? 'bg-green-100 text-green-600' :
                          transaction.type === 'debit' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {transaction.type === 'credit' ? <ArrowDownLeft size={16} /> :
                           transaction.type === 'debit' ? <ArrowUpRight size={16} /> :
                           <ArrowRightLeft size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                            {transaction.reference && ` • ${transaction.reference}`}
                          </p>
                        </div>
                      </div>
                      <div className={`text-right ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <p className="font-semibold">
                          {transaction.type === 'credit' ? '+' : '-'}{formatPKR(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </TransactionCard>
                ))}
                
                {getFilteredTransactions().length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || typeFilter !== 'all' || dateRange !== 'all'
                        ? 'No transactions match your current filters.'
                        : 'This account has no transactions yet.'}
                    </p>
                    <GradientButton
                      onClick={() => setShowAddTransaction(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Transaction
                    </GradientButton>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Transaction Distribution
              </h3>
              <ChartContainer>
                <div className="text-center">
                  <PieChart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600">Pie chart visualization would go here</p>
                </div>
              </ChartContainer>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Account Performance
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Transaction</span>
                  <span className="font-semibold">{formatPKR(stats.avgTransaction)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Largest Credit</span>
                  <span className="font-semibold text-green-600">
                    {formatPKR(Math.max(...transactions.filter(t => t.type === 'credit').map(t => t.amount), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Largest Debit</span>
                  <span className="font-semibold text-red-600">
                    {formatPKR(Math.max(...transactions.filter(t => t.type === 'debit').map(t => t.amount), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Age</span>
                  <span className="font-semibold">
                    {Math.floor((new Date().getTime() - new Date(account.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <AddTransactionModal
            account={account}
            onClose={() => setShowAddTransaction(false)}
            onSuccess={() => {
              setShowAddTransaction(false);
              refreshData();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function AddTransactionModal({ 
  account,
  onClose, 
  onSuccess 
}: { 
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'credit',
    amount: '',
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(formData.amount);
      
      // Create transaction
      const { error: transactionError } = await supabase
        .from('account_transactions')
        .insert([{
          account_id: account.id,
          type: formData.type,
          amount: amount,
          description: formData.description,
          reference: formData.reference || null,
          date: formData.date,
          user_id: user?.id
        }]);

      if (transactionError) throw transactionError;

      // Update account balance
      const balanceChange = formData.type === 'credit' ? amount : -amount;
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceChange })
        .eq('id', account.id);

      if (balanceError) throw balanceError;

      onSuccess();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <GlassModal className="w-full max-w-lg">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Add Transaction
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="credit">Credit (Money In)</option>
                    <option value="debit">Debit (Money Out)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Salary deposit, Grocery shopping"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional reference number or code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Cancel
              </Button>
              <GradientButton
                type="submit"
                disabled={loading}
                className="px-6 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Adding...' : 'Add Transaction'}
              </GradientButton>
            </div>
          </form>
        </GlassModal>
      </div>
    </div>
  );
}