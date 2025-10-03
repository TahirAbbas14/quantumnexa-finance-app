'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  CreditCard, 
  Filter
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'invoice' | 'expense' | 'payment';
  description: string;
  amount: number;
  date: string;
  status?: string;
  client?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 40px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const FilterButton = styled(Button)<{ $active?: boolean }>`
  background: ${props => props.$active ? 'var(--primary-600)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-700)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const CustomDateInputs = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchInput = styled.input`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  min-width: 300px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActivityItemCard = styled(Card)`
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
`;

const ActivityItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ActivityIcon = styled.div<{ $type: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$type) {
      case 'invoice': return 'var(--primary-100)';
      case 'expense': return 'var(--error-100)';
      case 'payment': return 'var(--success-100)';
      default: return 'var(--gray-100)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'invoice': return 'var(--primary-600)';
      case 'expense': return 'var(--error-600)';
      case 'payment': return 'var(--success-600)';
      default: return 'var(--gray-600)';
    }
  }};
`;

const ActivityDetails = styled.div`
  flex: 1;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
    margin-bottom: 2px;
  }
`;

const ActivityAmount = styled.div<{ $type: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => {
    switch (props.$type) {
      case 'invoice': return 'var(--success-400)';
      case 'expense': return 'var(--error-400)';
      case 'payment': return 'var(--success-400)';
      default: return 'white';
    }
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--gray-300);
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: white;
  }
  
  p {
    font-size: 14px;
  }
`;

export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [showCustomDate, setShowCustomDate] = useState(false);

  const filterOptions = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: '3months', label: '3 Months' },
    { key: '6months', label: '6 Months' },
    { key: 'year', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' }
  ];

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const supabase = createSupabaseClient();
      
      const [
        { data: invoices, error: invoicesError },
        { data: expenses, error: expensesError },
        { data: payments, error: paymentsError }
      ] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (invoicesError) console.error('Error fetching invoices:', invoicesError);
      if (expensesError) console.error('Error fetching expenses:', expensesError);
      if (paymentsError) console.error('Error fetching payments:', paymentsError);

      const allActivities: ActivityItem[] = [
        ...(invoices?.map(inv => ({
          id: inv.id,
          type: 'invoice' as const,
          description: `Invoice #${inv.invoice_number} - ${inv.client_name || 'Unknown Client'}`,
          amount: inv.total_amount || 0,
          date: inv.created_at,
          status: inv.status,
          client: inv.client_name
        })) || []),
        ...(expenses?.map(exp => ({
          id: exp.id,
          type: 'expense' as const,
          description: exp.description || 'Expense',
          amount: exp.amount || 0,
          date: exp.created_at,
          status: 'completed'
        })) || []),
        ...(payments?.map(payment => ({
          id: payment.id,
          type: 'payment' as const,
          description: `Payment received - ${payment.description || 'Payment'}`,
          amount: payment.amount || 0,
          date: payment.created_at,
          status: 'completed'
        })) || [])
      ];

      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getDateRange = useCallback((filter: string): DateRange | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        };
      case 'month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
      case '3months':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
      case '6months':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        };
      case 'custom':
        return customDateRange;
      default:
        return null;
    }
  }, [customDateRange]);

  const applyFilters = useCallback(() => {
    let filtered = [...activities];

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.client?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      const dateRange = getDateRange(selectedFilter);
      if (dateRange) {
        filtered = filtered.filter(activity => {
          const activityDate = new Date(activity.date);
          return activityDate >= dateRange.start && activityDate <= dateRange.end;
        });
      }
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, selectedFilter, getDateRange]);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, fetchActivities]);

  useEffect(() => {
    applyFilters();
  }, [activities, searchTerm, selectedFilter, customDateRange, applyFilters]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setShowCustomDate(filter === 'custom');
  };

  const handleCustomDateChange = (start: string, end: string) => {
    if (start && end) {
      setCustomDateRange({
        start: new Date(start),
        end: new Date(end + 'T23:59:59')
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText size={24} />;
      case 'expense':
        return <CreditCard size={24} />;
      case 'payment':
        return <CreditCard size={24} />;
      default:
        return <FileText size={24} />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <h1>Recent Activity</h1>
          <p>View and filter all your transactions and activities</p>
        </Header>

        <FilterSection>
          <FilterGroup>
            <Filter size={20} color="rgba(255, 255, 255, 0.7)" />
            {filterOptions.map(option => (
              <FilterButton
                key={option.key}
                variant="outline"
                size="sm"
                $active={selectedFilter === option.key}
                onClick={() => handleFilterChange(option.key)}
              >
                {option.label}
              </FilterButton>
            ))}
          </FilterGroup>
          
          {showCustomDate && (
            <CustomDateInputs>
              <DateInput
                type="date"
                onChange={(e) => {
                  const endInput = e.target.parentElement?.querySelector('input[type="date"]:last-child') as HTMLInputElement;
                  if (endInput?.value) {
                    handleCustomDateChange(e.target.value, endInput.value);
                  }
                }}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>to</span>
              <DateInput
                type="date"
                onChange={(e) => {
                  const startInput = e.target.parentElement?.querySelector('input[type="date"]:first-child') as HTMLInputElement;
                  if (startInput?.value) {
                    handleCustomDateChange(startInput.value, e.target.value);
                  }
                }}
              />
            </CustomDateInputs>
          )}
          
          <SearchInput
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterSection>

        <ActivityList>
          {filteredActivities.length === 0 ? (
            <EmptyState>
              <h3>No activities found</h3>
              <p>Try adjusting your filters or search terms</p>
            </EmptyState>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityItemCard key={activity.id} variant="glass">
                <ActivityItemContent>
                  <ActivityIcon $type={activity.type}>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityDetails>
                    <h3>{activity.description}</h3>
                    <p>{new Date(activity.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                    {activity.status && (
                      <p>Status: {activity.status}</p>
                    )}
                  </ActivityDetails>
                  <ActivityAmount $type={activity.type}>
                    {activity.type === 'expense' ? '-' : '+'}{formatPKR(activity.amount)}
                  </ActivityAmount>
                </ActivityItemContent>
              </ActivityItemCard>
            ))
          )}
        </ActivityList>
      </Container>
    </DashboardLayout>
  );
}