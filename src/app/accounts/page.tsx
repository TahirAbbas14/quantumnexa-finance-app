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
  Trash2, 
  CreditCard, 
  Building2, 
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  Eye,
  EyeOff,
  ArrowRightLeft,
  PiggyBank,
  Landmark
} from 'lucide-react';
import { format } from 'date-fns';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

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

const AccountCard = styled(GlassCard)<{ accountType?: string }>`
  padding: 1.5rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.accountType === 'bank' ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)' :
                       props.accountType === 'cash' ? 'linear-gradient(90deg, #10b981, #059669)' :
                       props.accountType === 'credit' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                       'linear-gradient(90deg, #8b5cf6, #7c3aed)'};
  }
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
`;

const GlassModal = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
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
  }
`;

const AccountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const AccountInfo = styled.div`
  flex: 1;
`;

const AccountName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 4px;
`;

const AccountType = styled.div`
  font-size: 14px;
  color: var(--gray-600);
  margin-bottom: 8px;
  text-transform: capitalize;
`;

const AccountBalance = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: var(--gray-900);
  margin-bottom: 8px;
`;

const AccountActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: var(--gray-700);
  }
`;

const AccountDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const AccountDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--gray-600);
`;

const StatusBadge = styled.div<{ status?: 'active' | 'inactive' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => props.status === 'active' ? 'var(--success-100)' : 'var(--gray-100)'};
  color: ${props => props.status === 'active' ? 'var(--success-700)' : 'var(--gray-700)'};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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
  accounts?: {
    name: string;
    type: string;
  };
}

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', icon: Landmark },
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'credit', label: 'Credit Card', icon: CreditCard },
  { value: 'savings', label: 'Savings Account', icon: PiggyBank },
  { value: 'investment', label: 'Investment Account', icon: TrendingUp }
];

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showBalances, setShowBalances] = useState(true);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchRecentTransactions();
    }
  }, [user]);

  const fetchAccounts = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchRecentTransactions = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const { data, error } = await supabase
        .from('account_transactions')
        .select(`
          *,
          accounts (
            name,
            type
          )
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user?.id, supabase]);

  const deleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const toggleAccountStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTotalStats = () => {
    const activeAccounts = accounts.filter(account => account.is_active);
    const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
    const bankAccounts = activeAccounts.filter(account => account.type === 'bank');
    const cashAccounts = activeAccounts.filter(account => account.type === 'cash');
    const creditAccounts = activeAccounts.filter(account => account.type === 'credit');
    
    const bankBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    const cashBalance = cashAccounts.reduce((sum, account) => sum + account.balance, 0);
    const creditBalance = creditAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    return { 
      totalBalance, 
      bankBalance, 
      cashBalance, 
      creditBalance,
      totalAccounts: activeAccounts.length 
    };
  };

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType ? accountType.icon : Wallet;
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Accounts
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your bank accounts, cash, and payment methods in one place.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowBalances(!showBalances)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBalances ? 'Hide' : 'Show'} Balances
            </Button>
            <Button
              onClick={() => setShowTransferForm(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </Button>
            <GradientButton
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </GradientButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {showBalances ? formatPKR(stats.totalBalance) : '••••••'}
            </p>
          </StatsCard>
          
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full">
                <Landmark className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Bank Accounts</p>
            <p className="text-2xl font-bold text-gray-900">
              {showBalances ? formatPKR(stats.bankBalance) : '••••••'}
            </p>
          </StatsCard>
          
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Cash</p>
            <p className="text-2xl font-bold text-gray-900">
              {showBalances ? formatPKR(stats.cashBalance) : '••••••'}
            </p>
          </StatsCard>
          
          <StatsCard>
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Credit Cards</p>
            <p className="text-2xl font-bold text-gray-900">
              {showBalances ? formatPKR(Math.abs(stats.creditBalance)) : '••••••'}
            </p>
          </StatsCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* Accounts Grid */}
        {filteredAccounts.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter !== 'all' 
                ? 'No accounts match your current filters.' 
                : 'Get started by adding your first account.'}
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <GradientButton
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Your First Account
              </GradientButton>
            )}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => {
              const IconComponent = getAccountIcon(account.type);
              return (
                <AccountCard 
                  key={account.id} 
                  accountType={account.type}
                  onClick={() => router.push(`/accounts/${account.id}`)}
                >
                  <AccountHeader>
                    <AccountInfo>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <AccountName>{account.name}</AccountName>
                          <AccountType>{account.type}</AccountType>
                        </div>
                      </div>
                      <AccountBalance>
                        {showBalances ? formatPKR(account.balance) : '••••••'}
                      </AccountBalance>
                    </AccountInfo>
                    <AccountActions>
                      <ActionButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit functionality
                        }}
                      >
                        <Edit size={16} />
                      </ActionButton>
                      <ActionButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAccountStatus(account.id, account.is_active);
                        }}
                      >
                        {account.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </ActionButton>
                      <ActionButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAccount(account.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </ActionButton>
                    </AccountActions>
                  </AccountHeader>
                  
                  <AccountDetails>
                    {account.bank_name && (
                      <AccountDetail>
                        <Building2 size={16} />
                        <span>{account.bank_name}</span>
                      </AccountDetail>
                    )}
                    
                    {account.account_number && (
                      <AccountDetail>
                        <CreditCard size={16} />
                        <span>••••{account.account_number.slice(-4)}</span>
                      </AccountDetail>
                    )}
                    
                    <StatusBadge status={account.is_active ? 'active' : 'inactive'}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </AccountDetails>
                </AccountCard>
              );
            })}
          </div>
        )}

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
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
                          {transaction.accounts?.name} • {format(new Date(transaction.date), 'MMM d, yyyy')}
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
            </div>
          </GlassCard>
        )}

        {/* Add Account Modal */}
        {showAddForm && (
          <AddAccountModal
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchAccounts();
            }}
          />
        )}

        {/* Transfer Modal */}
        {showTransferForm && (
          <TransferModal
            accounts={accounts.filter(acc => acc.is_active)}
            onClose={() => setShowTransferForm(false)}
            onSuccess={() => {
              setShowTransferForm(false);
              fetchAccounts();
              fetchRecentTransactions();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function AddAccountModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '',
    bank_name: '',
    account_number: '',
    description: '',
    currency: 'PKR'
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
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const accountData = {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        description: formData.description || null,
        currency: formData.currency,
        is_active: true,
        user_id: user?.id
      };

      const { error } = await supabase
        .from('accounts')
        .insert([accountData]);

      if (error) throw error;
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
        <GlassModal className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Add New Account
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Checking Account"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Balance (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                {(formData.type === 'bank' || formData.type === 'savings') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., HBL, UBL, MCB"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Account number (last 4 digits will be shown)"
                      />
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description or notes about this account..."
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
                {loading ? 'Adding...' : 'Add Account'}
              </GradientButton>
            </div>
          </form>
        </GlassModal>
      </div>
    </div>
  );
}

function TransferModal({ 
  accounts,
  onClose, 
  onSuccess 
}: { 
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    from_account: '',
    to_account: '',
    amount: '',
    description: '',
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

    if (formData.from_account === formData.to_account) {
      setError('Source and destination accounts must be different');
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const amount = parseFloat(formData.amount);
      
      // Create transfer transactions
      const transactions = [
        {
          account_id: formData.from_account,
          type: 'debit',
          amount: amount,
          description: `Transfer to ${accounts.find(a => a.id === formData.to_account)?.name}`,
          reference: `TRANSFER-${Date.now()}`,
          date: formData.date,
          user_id: user?.id
        },
        {
          account_id: formData.to_account,
          type: 'credit',
          amount: amount,
          description: `Transfer from ${accounts.find(a => a.id === formData.from_account)?.name}`,
          reference: `TRANSFER-${Date.now()}`,
          date: formData.date,
          user_id: user?.id
        }
      ];

      // Update account balances
      const fromAccount = accounts.find(a => a.id === formData.from_account);
      const toAccount = accounts.find(a => a.id === formData.to_account);

      if (!fromAccount || !toAccount) {
        throw new Error('Invalid account selection');
      }

      // Start transaction
      const { error: transactionError } = await supabase
        .from('account_transactions')
        .insert(transactions);

      if (transactionError) throw transactionError;

      // Update balances
      const { error: fromError } = await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', formData.from_account);

      if (fromError) throw fromError;

      const { error: toError } = await supabase
        .from('accounts')
        .update({ balance: toAccount.balance + amount })
        .eq('id', formData.to_account);

      if (toError) throw toError;

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
                  Transfer Money
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
                    From Account *
                  </label>
                  <select
                    required
                    value={formData.from_account}
                    onChange={(e) => setFormData({ ...formData, from_account: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select source account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatPKR(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Account *
                  </label>
                  <select
                    required
                    value={formData.to_account}
                    onChange={(e) => setFormData({ ...formData, to_account: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select destination account</option>
                    {accounts.filter(acc => acc.id !== formData.from_account).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatPKR(account.balance)})
                      </option>
                    ))}
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional transfer description"
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
                {loading ? 'Transferring...' : 'Transfer Money'}
              </GradientButton>
            </div>
          </form>
        </GlassModal>
      </div>
    </div>
  );
}