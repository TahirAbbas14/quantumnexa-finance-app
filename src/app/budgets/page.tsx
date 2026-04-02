'use client';

import { useMemo, useState, useEffect, useCallback } from 'react'; // <-- useCallback added
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Filter,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Target,
  PiggyBank,
  Wallet,
  BarChart3,
  Eye,
} from 'lucide-react';
import styled from 'styled-components';

// Styled Components
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

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
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

  @media (max-width: 900px) {
    width: 100%;
  }
`;

interface StatCardProps {
  color?: string;
}

const StatCard = styled(Card)<StatCardProps>`
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || 'var(--primary-500)'};
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;


interface StatIconProps {
  $color?: string;
  $textColor?: string;
}

const StatIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color' && prop !== 'textColor'
})<StatIconProps>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$color || 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$textColor || 'white'};
`;


const TabsContainer = styled.div`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 24px;
  display: flex;
  gap: 6px;
`;

interface TabButtonProps {
  active?: boolean;
}

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})<TabButtonProps>`
  padding: 10px 14px;
  background: ${props => (props.active ? 'rgba(255, 255, 255, 0.12)' : 'transparent')};
  border: none;
  color: ${props => (props.active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)')};
  font-weight: ${props => (props.active ? '700' : '600')};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  flex: 1;
  justify-content: center;
  position: relative;
  
  &:hover {
    background: ${props => (props.active ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.08)')};
    color: rgba(255, 255, 255, 0.95);
  }

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 6px;
    height: 2px;
    border-radius: 999px;
    background: ${props => (props.active ? '#ef4444' : 'transparent')};
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;


const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SidebarCard = styled(Card)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
`;

const SidebarTitle = styled.div`
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ActivityItem = styled.div<{ $tone: 'green' | 'yellow' | 'blue' }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid
    ${props =>
      props.$tone === 'green'
        ? 'rgba(16, 185, 129, 0.22)'
        : props.$tone === 'yellow'
          ? 'rgba(245, 158, 11, 0.22)'
          : 'rgba(59, 130, 246, 0.22)'};
  background: ${props =>
    props.$tone === 'green'
      ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.10), rgba(5, 150, 105, 0.06))'
      : props.$tone === 'yellow'
        ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.10), rgba(217, 119, 6, 0.06))'
        : 'linear-gradient(90deg, rgba(59, 130, 246, 0.10), rgba(79, 70, 229, 0.06))'};
`;

const ActivityIcon = styled.div<{ $tone: 'green' | 'yellow' | 'blue' }>`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  background: ${props =>
    props.$tone === 'green'
      ? 'rgba(16, 185, 129, 0.18)'
      : props.$tone === 'yellow'
        ? 'rgba(245, 158, 11, 0.18)'
        : 'rgba(59, 130, 246, 0.18)'};
  color: ${props =>
    props.$tone === 'green' ? '#34d399' : props.$tone === 'yellow' ? '#fbbf24' : '#60a5fa'};
`;

const ActivityText = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
`;

const ActivityDesc = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.70);
  line-height: 1.35;
`;

const ActivityTime = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.50);
`;

const SidebarFooter = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
`;

const QuickActionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const QuickActionButton = styled.button<{ $tone: 'red' | 'blue' | 'purple' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid
    ${props =>
      props.$tone === 'red'
        ? 'rgba(239, 68, 68, 0.35)'
        : props.$tone === 'blue'
          ? 'rgba(59, 130, 246, 0.35)'
          : 'rgba(168, 85, 247, 0.35)'};
  background: ${props =>
    props.$tone === 'red'
      ? 'rgba(239, 68, 68, 0.10)'
      : props.$tone === 'blue'
        ? 'rgba(59, 130, 246, 0.10)'
        : 'rgba(168, 85, 247, 0.10)'};
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props =>
      props.$tone === 'red'
        ? 'rgba(239, 68, 68, 0.14)'
        : props.$tone === 'blue'
          ? 'rgba(59, 130, 246, 0.14)'
          : 'rgba(168, 85, 247, 0.14)'};
  }
`;

const QuickActionLink = styled(Link)<{ $tone: 'red' | 'blue' | 'purple' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid
    ${props =>
      props.$tone === 'red'
        ? 'rgba(239, 68, 68, 0.35)'
        : props.$tone === 'blue'
          ? 'rgba(59, 130, 246, 0.35)'
          : 'rgba(168, 85, 247, 0.35)'};
  background: ${props =>
    props.$tone === 'red'
      ? 'rgba(239, 68, 68, 0.10)'
      : props.$tone === 'blue'
        ? 'rgba(59, 130, 246, 0.10)'
        : 'rgba(168, 85, 247, 0.10)'};
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    background: ${props =>
      props.$tone === 'red'
        ? 'rgba(239, 68, 68, 0.14)'
        : props.$tone === 'blue'
          ? 'rgba(59, 130, 246, 0.14)'
          : 'rgba(168, 85, 247, 0.14)'};
  }
`;

const BudgetCard = styled(Card)`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const BudgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const BudgetInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
    margin: 0;
    text-transform: capitalize;
  }
`;

const BudgetAmount = styled.div`
  text-align: right;
  
  .amount {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
  }
  
  .period {
    font-size: 12px;
    color: var(--gray-300);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ProgressSection = styled.div`
  margin-top: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
  position: relative;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: ${props => {
    if (props.$percentage > 100) return 'var(--error-500)';
    if (props.$percentage > 80) return 'var(--warning-500)';
    return 'var(--success-500)';
  }};
  width: ${props => Math.min(props.$percentage, 100)}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
  }
`;

const TextInput = styled.input`
  width: 100%;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  outline: none;
  min-height: 90px;
  resize: vertical;

  &:focus {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }
`;

const Select = styled.select`
  width: 100%;
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
    color: #111827;
  }
`;

const Muted = styled.div`
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  line-height: 1.4;
`;

const ErrorText = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.10);
  margin: 16px 0;
`;

const AllocationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AllocationRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 160px;
  gap: 10px;
  align-items: center;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const AllocationChip = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 600;
`;

// Interfaces
interface Budget {
  id: string;
  name: string;
  description?: string;
  budget_type: 'monthly' | 'yearly' | 'quarterly';
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  budget_items?: BudgetItem[];
}

interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  budget_categories?: {
    name: string;
    color: string;
    icon: string;
  };
}

interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
}

interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  color: string;
  icon: string;
}

export default function BudgetsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
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

  // Memoize fetch functions to avoid missing dependencies in useEffect
  const fetchBudgets = useCallback(async () => {
    try {
      if (!supabase) throw new Error('Supabase client is not available');
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_items (
            *,
            budget_categories (
              name,
              color,
              icon
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rawBudgets = (data || []) as Budget[];

      const compareISO = (a: string, b: string) => a.localeCompare(b);
      const maxISO = (a: string, b: string) => (compareISO(a, b) >= 0 ? a : b);
      const minISO = (a: string, b: string) => (compareISO(a, b) <= 0 ? a : b);

      const ranges = rawBudgets
        .map((b) => {
          const baseStart = b.start_date;
          const baseEnd = b.end_date;
          const effectiveStart = b.budget_type === 'monthly' ? period.startISO : baseStart;
          const effectiveEnd = b.budget_type === 'monthly' ? period.endISO : baseEnd;
          const aggStart = maxISO(effectiveStart, period.startISO);
          const aggEnd = minISO(effectiveEnd, period.endISO);
          if (compareISO(aggStart, aggEnd) > 0) return null;
          return { aggStart, aggEnd };
        })
        .filter(Boolean) as Array<{ aggStart: string; aggEnd: string }>;

      const earliestStart = ranges.map((r) => r.aggStart).sort(compareISO)[0];
      const latestEnd = ranges.map((r) => r.aggEnd).sort(compareISO).slice(-1)[0];

      let expenses: Array<{ amount: number; category: string; date: string }> = [];
      if (earliestStart && latestEnd) {
        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .select('amount, category, date')
          .eq('user_id', user?.id)
          .gte('date', earliestStart)
          .lte('date', latestEnd);
        if (expenseError) throw expenseError;
        expenses = (expenseData || []) as Array<{ amount: number; category: string; date: string }>;
      }

      const normalize = (v: string) => v.trim().toLowerCase();

      const updatedBudgets = rawBudgets
        .map((budget) => {
          const baseStartISO = budget.start_date;
          const baseEndISO = budget.end_date;
          const effectiveStartISO = budget.budget_type === 'monthly' ? period.startISO : baseStartISO;
          const effectiveEndISO = budget.budget_type === 'monthly' ? period.endISO : baseEndISO;
          const aggStartISO = maxISO(effectiveStartISO, period.startISO);
          const aggEndISO = minISO(effectiveEndISO, period.endISO);
          if (compareISO(aggStartISO, aggEndISO) > 0) return null;

          const start = new Date(aggStartISO);
          const end = new Date(aggEndISO);

          const items = (budget.budget_items || []).map((item) => {
            const categoryName = item.budget_categories?.name || '';
            const spent = expenses
              .filter((e) => {
                const d = new Date(e.date);
                return d >= start && d <= end && normalize(e.category || '') === normalize(categoryName);
              })
              .reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const allocated = Number(item.allocated_amount || 0);
            const remaining = Math.max(0, allocated - spent);
            const pct = allocated > 0 ? (spent / allocated) * 100 : 0;

            return {
              ...item,
              spent_amount: spent,
              remaining_amount: remaining,
              percentage_used: pct
            };
          });

          const totalAllocated = items.reduce((sum, i) => sum + Number(i.allocated_amount || 0), 0);
          return {
            ...budget,
            start_date: aggStartISO,
            end_date: aggEndISO,
            total_amount: Number(budget.total_amount || totalAllocated),
            budget_items: items
          };
        })
        .filter(Boolean) as Budget[];

      setBudgets(updatedBudgets);

      if (period.preset === 'this_month') {
        const updates = updatedBudgets
          .filter((b) => b.budget_type === 'monthly')
          .flatMap((b) => b.budget_items || [])
          .map((item) => ({
            id: item.id,
            spent_amount: item.spent_amount,
            remaining_amount: item.remaining_amount,
            percentage_used: item.percentage_used,
            updated_at: new Date().toISOString()
          }));

        if (updates.length > 0) {
          await Promise.all(
            updates.map((u) =>
              supabase
                .from('budget_items')
                .update({
                  spent_amount: u.spent_amount,
                  remaining_amount: u.remaining_amount,
                  percentage_used: u.percentage_used,
                  updated_at: u.updated_at
                })
                .eq('id', u.id)
                .eq('user_id', user?.id)
            )
          );
        }
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  }, [period.endISO, period.preset, period.startISO, supabase, user?.id]);

  const fetchSavingsGoals = useCallback(async () => {
    try {
      if (!supabase) throw new Error('Supabase client is not available');
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const goals = (data || []) as SavingsGoal[];
      const goalIds = goals.map((g) => g.id).filter(Boolean);

      if (goalIds.length === 0) {
        setSavingsGoals([]);
        return;
      }

      const { data: txData, error: txError } = await supabase
        .from('savings_transactions')
        .select('savings_goal_id, amount, transaction_type')
        .eq('user_id', user?.id)
        .in('savings_goal_id', goalIds);
      if (txError) throw txError;

      const totals = new Map<string, number>();
      (txData || []).forEach((t: { savings_goal_id: string; amount: number; transaction_type: string }) => {
        const prev = totals.get(t.savings_goal_id) || 0;
        const amt = Number(t.amount || 0);
        const delta = t.transaction_type === 'withdrawal' ? -amt : amt;
        totals.set(t.savings_goal_id, prev + delta);
      });

      setSavingsGoals(
        goals.map((g) => {
          const computed = totals.get(g.id) ?? Number(g.current_amount || 0);
          const computedSafe = Math.max(0, computed);
          const computedStatus: SavingsGoal['status'] =
            g.target_amount > 0 && computedSafe >= g.target_amount ? 'completed' : g.status;
          return { ...g, current_amount: computedSafe, status: computedStatus };
        })
      );
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    }
  }, [supabase, user?.id]);

  const fetchBudgetCategories = useCallback(async () => {
    try {
      if (!supabase) throw new Error('Supabase client is not available');
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBudgetCategories(data || []);
    } catch (error) {
      console.error('Error fetching budget categories:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchSavingsGoals();
      fetchBudgetCategories();
    }
  }, [user, fetchBudgets, fetchSavingsGoals, fetchBudgetCategories]); // <-- add fetch functions to deps

  const calculateBudgetStats = () => {
    const activeBudgets = budgets.filter(b => b.is_active);
    const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + budget.total_amount, 0);
    
    let totalSpent = 0;
    let totalRemaining = 0;
    
    activeBudgets.forEach(budget => {
      if (budget.budget_items) {
        budget.budget_items.forEach(item => {
          totalSpent += item.spent_amount;
          totalRemaining += item.remaining_amount;
        });
      }
    });

    const activeGoals = savingsGoals.filter(g => g.status === 'active');
    const totalSavingsTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalSavingsCurrent = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      activeBudgets: activeBudgets.length,
      totalSavingsTarget,
      totalSavingsCurrent,
      activeGoals: activeGoals.length
    };
  };

  const stats = calculateBudgetStats();

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
            <h1>Budgets</h1>
            <p>Create budgets, allocate categories, and track spending.</p>
          </TitleBlock>
          <HeaderActions>
            <Button
              variant="outline"
              onClick={() => setShowAddGoal(true)}
            >
              <Target size={16} />
              Add Savings Goal
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddCategory(true)}
            >
              <BarChart3 size={16} />
              Add Category
            </Button>
            <Button
              onClick={() => setShowAddBudget(true)}
            >
              <Plus size={16} />
              Create Budget
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatHeader>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Total Budgeted</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
                  {formatPKR(stats.totalBudgeted)}
                </div>
              </div>
              <StatIcon $color="var(--primary-100)" $textColor="var(--primary-600)">
                <Wallet size={24} />
              </StatIcon>
            </StatHeader>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>{stats.activeBudgets} active budgets</div>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Total Spent</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
                  {formatPKR(stats.totalSpent)}
                </div>
              </div>
              <StatIcon $color="var(--error-100)" $textColor="var(--error-600)">
                <TrendingDown size={24} />
              </StatIcon>
            </StatHeader>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>
              {stats.totalBudgeted > 0 ? 
                `${((stats.totalSpent / stats.totalBudgeted) * 100).toFixed(1)}% of budget` : 
                '0% of budget'
              }
            </div>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Remaining Budget</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
                  {formatPKR(stats.totalRemaining)}
                </div>
              </div>
              <StatIcon $color="var(--success-100)" $textColor="var(--success-600)">
                <TrendingUp size={24} />
              </StatIcon>
            </StatHeader>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>Available to spend</div>
          </StatCard>

          <StatCard>
            <StatHeader>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)' }}>Savings Progress</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
                  {formatPKR(stats.totalSavingsCurrent)}
                </div>
              </div>
              <StatIcon $color="var(--accent-100)" $textColor="var(--accent-600)">
                <PiggyBank size={24} />
              </StatIcon>
            </StatHeader>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>
              {stats.totalSavingsTarget > 0 ? 
                `${((stats.totalSavingsCurrent / stats.totalSavingsTarget) * 100).toFixed(1)}% of ${formatPKR(stats.totalSavingsTarget)}` : 
                `${stats.activeGoals} active goals`
              }
            </div>
          </StatCard>
        </StatsGrid>

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
            <Select value={periodPreset} onChange={(e) => setPeriodPreset(e.target.value as typeof periodPreset)} style={{ width: '180px' }}>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom</option>
            </Select>
            {periodPreset === 'custom' && (
              <>
                <TextInput type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ width: '170px' }} />
                <TextInput type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ width: '170px' }} />
              </>
            )}
          </PeriodControls>
        </PeriodBar>

        <TabsContainer>
          <TabButton 
            active={activeTab === 'budgets'} 
            onClick={() => setActiveTab('budgets')}
          >
            <Wallet size={16} />
            Budgets
          </TabButton>
          <TabButton 
            active={activeTab === 'savings'} 
            onClick={() => setActiveTab('savings')}
          >
            <Target size={16} />
            Savings Goals
          </TabButton>
          <TabButton 
            active={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')}
          >
            <BarChart3 size={16} />
            Categories
          </TabButton>
        </TabsContainer>

        <ContentGrid>
          <div>
            {activeTab === 'budgets' && (
              <BudgetsList 
                budgets={budgets} 
                categories={budgetCategories}
                onCreateBudget={() => setShowAddBudget(true)}
              />
            )}
            {activeTab === 'savings' && (
              <SavingsGoalsList 
                goals={savingsGoals} 
                onCreateGoal={() => setShowAddGoal(true)}
              />
            )}
            {activeTab === 'categories' && (
              <CategoriesList 
                categories={budgetCategories} 
                onCreateCategory={() => setShowAddCategory(true)}
              />
            )}
          </div>
          
          <div>
            <RecentActivity
              onUpdateGoal={() => {
                setActiveTab('savings');
                setShowAddGoal(true);
              }}
              onViewAllActivity={() => router.push('/activity')}
            />
          </div>
        </ContentGrid>

        {showAddBudget && (
          <AddBudgetModal
            categories={budgetCategories}
            onClose={() => setShowAddBudget(false)}
            onSuccess={() => {
              setShowAddBudget(false);
              fetchBudgets();
            }}
          />
        )}

        {showAddGoal && (
          <AddSavingsGoalModal
            onClose={() => setShowAddGoal(false)}
            onSuccess={() => {
              setShowAddGoal(false);
              fetchSavingsGoals();
            }}
          />
        )}

        {showAddCategory && (
          <AddBudgetCategoryModal
            onClose={() => setShowAddCategory(false)}
            onSuccess={() => {
              setShowAddCategory(false);
              fetchBudgetCategories();
            }}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

const ListHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ListTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
`;

const ListControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const SmallButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
  }
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    color: #fff;
  }

  &.danger:hover {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.14);
    color: #ef4444;
  }
`;

const ItemsBox = styled.div`
  margin-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
  padding-top: 12px;
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  td {
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const CardsGrid = styled.div`
  display: grid;
  gap: 14px;
`;

const EmptyState = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  padding: 28px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
`;

const EmptyTitle = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 8px;
`;

const EmptyDesc = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
  max-width: 520px;
  margin: 0 auto 18px auto;
`;

const CTAButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.16);
    border-color: rgba(239, 68, 68, 0.45);
  }
`;

const BudgetActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const CategorySwatch = styled.div<{ $color: string }>`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: ${props => props.$color || 'rgba(255, 255, 255, 0.10)'};
  border: 1px solid rgba(255, 255, 255, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
`;

const MetaLabel = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
`;

const MetaValue = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
`;

const ProgressFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

function BudgetsList({
  budgets,
  categories,
  onCreateBudget
}: {
  budgets: Budget[];
  categories: BudgetCategory[];
  onCreateBudget: () => void;
}) {
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      (budget.budget_items &&
        budget.budget_items.some(item => item.category_id === selectedCategory));
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && budget.is_active) ||
      (selectedStatus === 'inactive' && !budget.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (budgets.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>
          <Wallet size={28} color="#ef4444" />
        </EmptyIcon>
        <EmptyTitle>No budgets yet</EmptyTitle>
        <EmptyDesc>Create a budget to track spending against category allocations.</EmptyDesc>
        <CTAButton onClick={onCreateBudget}>
          <Plus size={18} />
          Create Budget
        </CTAButton>
      </EmptyState>
    );
  }

  const deleteBudget = async (budgetId: string) => {
    if (!confirm('Delete this budget?')) return;
    if (!supabase || !user?.id) return;
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId).eq('user_id', user.id);
    if (error) {
      alert('Failed to delete budget');
      return;
    }
    window.location.reload();
  };

  return (
    <div>
      <ListHeaderRow>
        <ListTitle>Budgets</ListTitle>
        <ListControls>
          <TextInput
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px' }}
          />
          <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '200px' }}>
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)} style={{ width: '160px' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <SmallButton onClick={onCreateBudget}>
            <Plus size={16} />
            Create
          </SmallButton>
        </ListControls>
      </ListHeaderRow>

      <CardsGrid>
        {filteredBudgets.map((budget) => {
          // Calculate total spent for this budget
          const totalSpent = budget.budget_items
            ? budget.budget_items.reduce((sum, item) => sum + item.spent_amount, 0)
            : 0;
          const expanded = expandedBudgetId === budget.id;
          return (
            <BudgetCard key={budget.id}>
              <BudgetHeader>
                <BudgetInfo>
                  <h4>{budget.name}</h4>
                  <p>
                    {budget.budget_type} • {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </p>
                </BudgetInfo>
                <BudgetActions>
                  <BudgetAmount>
                    <div className="amount">{formatPKR(budget.total_amount)}</div>
                    <div className="period">{budget.is_active ? 'ACTIVE' : 'INACTIVE'}</div>
                  </BudgetAmount>
                  <IconButton onClick={() => setExpandedBudgetId(expanded ? null : budget.id)} title="View details">
                    <Eye size={16} />
                  </IconButton>
                  <IconButton className="danger" onClick={() => deleteBudget(budget.id)} title="Delete">
                    <X size={16} />
                  </IconButton>
                </BudgetActions>
              </BudgetHeader>
              
              <ProgressSection>
                <ProgressMeta>
                  <MetaLabel>Progress</MetaLabel>
                  <MetaValue>{budget.total_amount > 0 ? Math.round((totalSpent / budget.total_amount) * 100) : 0}%</MetaValue>
                </ProgressMeta>
                <ProgressBar>
                  <ProgressFill $percentage={budget.total_amount > 0 ? (totalSpent / budget.total_amount) * 100 : 0} />
                </ProgressBar>
                <ProgressFoot>
                  <span>Spent: {formatPKR(totalSpent)}</span>
                  <span>Remaining: {formatPKR(budget.total_amount - totalSpent)}</span>
                </ProgressFoot>
              </ProgressSection>

              {expanded && (
                <ItemsBox>
                  <ItemsTable>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Allocated</th>
                        <th>Spent</th>
                        <th>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(budget.budget_items || []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.budget_categories?.name || 'Category'}</td>
                          <td>{formatPKR(Number(item.allocated_amount || 0))}</td>
                          <td>{formatPKR(Number(item.spent_amount || 0))}</td>
                          <td>{formatPKR(Number(item.remaining_amount || 0))}</td>
                        </tr>
                      ))}
                      {(budget.budget_items || []).length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            No category allocations.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </ItemsTable>
                </ItemsBox>
              )}
            </BudgetCard>
          );
        })}
      </CardsGrid>
    </div>
  );
}

function SavingsGoalsList({ goals, onCreateGoal }: { goals: SavingsGoal[]; onCreateGoal: () => void }) {
  if (goals.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>
          <Target size={28} color="#ef4444" />
        </EmptyIcon>
        <EmptyTitle>No goals yet</EmptyTitle>
        <EmptyDesc>Create a savings goal and track progress over time.</EmptyDesc>
        <CTAButton onClick={onCreateGoal}>
          <Plus size={18} />
          Create Goal
        </CTAButton>
      </EmptyState>
    );
  }

  return (
    <div>
      <ListHeaderRow>
        <ListTitle>Savings Goals</ListTitle>
        <ListControls>
          <SmallButton onClick={onCreateGoal}>
            <Plus size={16} />
            Create
          </SmallButton>
        </ListControls>
      </ListHeaderRow>
      <CardsGrid>
        {goals.map((goal) => (
          <BudgetCard key={goal.id}>
            <BudgetHeader>
              <BudgetInfo>
                <h4>{goal.name}</h4>
                <p>{goal.priority} priority</p>
              </BudgetInfo>
              <BudgetAmount>
                <div className="amount">{formatPKR(goal.target_amount)}</div>
                <div className="period">TARGET</div>
              </BudgetAmount>
            </BudgetHeader>
            
            <ProgressSection>
              <ProgressMeta>
                <MetaLabel>Progress</MetaLabel>
                <MetaValue>{Math.round((goal.current_amount / goal.target_amount) * 100)}%</MetaValue>
              </ProgressMeta>
              <ProgressBar>
                <ProgressFill $percentage={(goal.current_amount / goal.target_amount) * 100} />
              </ProgressBar>
              <ProgressFoot>
                <span>Saved: {formatPKR(goal.current_amount)}</span>
                <span>Remaining: {formatPKR(goal.target_amount - goal.current_amount)}</span>
              </ProgressFoot>
            </ProgressSection>
          </BudgetCard>
        ))}
      </CardsGrid>
    </div>
  );
}

function CategoriesList({ categories, onCreateCategory }: { categories: BudgetCategory[]; onCreateCategory: () => void }) {
  if (categories.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>
          <BarChart3 size={28} color="#ef4444" />
        </EmptyIcon>
        <EmptyTitle>No categories yet</EmptyTitle>
        <EmptyDesc>Create categories to allocate budgets and match expenses by category.</EmptyDesc>
        <CTAButton onClick={onCreateCategory}>
          <Plus size={18} />
          Create Category
        </CTAButton>
      </EmptyState>
    );
  }

  return (
    <div>
      <ListHeaderRow>
        <ListTitle>Categories</ListTitle>
        <ListControls>
          <SmallButton onClick={onCreateCategory}>
            <Plus size={16} />
            Create
          </SmallButton>
        </ListControls>
      </ListHeaderRow>
      <CardsGrid>
        {categories.map((category) => (
          <BudgetCard key={category.id}>
            <BudgetHeader>
              <BudgetInfo>
                <h4>{category.name}</h4>
                <p>{category.description || 'No description'}</p>
              </BudgetInfo>
              <CategorySwatch $color={category.color || 'rgba(255, 255, 255, 0.10)'}>
                <BarChart3 size={24} color="white" />
              </CategorySwatch>
            </BudgetHeader>
          </BudgetCard>
        ))}
      </CardsGrid>
    </div>
  );
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  color: 'green' | 'yellow' | 'blue';
}

function RecentActivity({
  onUpdateGoal,
  onViewAllActivity
}: {
  onUpdateGoal: () => void;
  onViewAllActivity: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    }
  }, [user]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Fetch recent budget activities (created, updated budgets)
      if (!supabase) return;
      const { data: budgetActivities } = await supabase
        .from('budgets')
        .select('id, name, budget_type, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Fetch recent savings goals activities
      if (!supabase) return;
      const { data: goalsActivities } = await supabase
        .from('savings_goals')
        .select('id, name, target_amount, current_amount, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(2);

      // Combine and format activities
      const formattedActivities: Activity[] = [];

      // Add budget activities
      if (budgetActivities) {
        budgetActivities.forEach(budget => {
          const isNew = new Date(budget.created_at).getTime() === new Date(budget.updated_at).getTime();
          formattedActivities.push({
            id: `budget-${budget.id}`,
            type: isNew ? 'budget_created' : 'budget_updated',
            title: isNew ? 'Budget created' : 'Budget updated',
            description: `${budget.budget_type} budget: ${budget.name}`,
            timestamp: budget.updated_at,
            icon: CheckCircle,
            color: 'green'
          });
        });
      }

      // Add savings goal activities
      if (goalsActivities) {
        goalsActivities.forEach(goal => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          
          if (progress >= 25 && progress < 100) {
            formattedActivities.push({
              id: `goal-${goal.id}`,
              type: 'goal_milestone',
              title: 'Goal milestone',
              description: `${goal.name} ${Math.round(progress)}% complete`,
              timestamp: goal.updated_at,
              icon: Target,
              color: 'blue'
            });
          }
        });
      }

      // Sort by timestamp and take the most recent 5
      const sortedActivities = formattedActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getTimeAgo = (timestamp: string | number | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Sidebar>
      <SidebarCard>
        <SidebarHeader>
          <SidebarTitle>Recent Activity</SidebarTitle>
          <IconButton onClick={fetchRecentActivities} title="Refresh">
            <Eye size={16} />
          </IconButton>
        </SidebarHeader>

        <ActivityList>
          {loading ? (
            <EmptyState style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={22} className="animate-spin" />
              </div>
            </EmptyState>
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <ActivityItem key={activity.id} $tone={activity.color}>
                  <ActivityIcon $tone={activity.color}>
                    <IconComponent size={16} />
                  </ActivityIcon>
                  <ActivityText>
                    <ActivityTitle>{activity.title}</ActivityTitle>
                    <ActivityDesc>{activity.description}</ActivityDesc>
                    <ActivityTime>{getTimeAgo(activity.timestamp)}</ActivityTime>
                  </ActivityText>
                </ActivityItem>
              );
            })
          ) : (
            <EmptyState style={{ padding: '18px' }}>
              <EmptyTitle>No recent activity</EmptyTitle>
              <EmptyDesc>Create budgets and goals to see updates here.</EmptyDesc>
            </EmptyState>
          )}
        </ActivityList>

        <SidebarFooter>
          <Button variant="outline" size="sm" style={{ width: '100%' }} onClick={onViewAllActivity}>
            View All Activity
          </Button>
        </SidebarFooter>
      </SidebarCard>
      
      <SidebarCard>
        <SidebarHeader>
          <SidebarTitle>Quick Actions</SidebarTitle>
        </SidebarHeader>
        <QuickActionsList>
          <QuickActionLink $tone="red" href="/expenses">
            <Plus size={16} />
            Add Expense
          </QuickActionLink>
          <QuickActionButton $tone="blue" type="button" onClick={onUpdateGoal}>
            <Target size={16} />
            Update Goal
          </QuickActionButton>
          <QuickActionLink $tone="purple" href="/budget-comparison">
            <BarChart3 size={16} />
            View Reports
          </QuickActionLink>
        </QuickActionsList>
      </SidebarCard>
    </Sidebar>
  );
}

function AddBudgetModal({
  categories,
  onClose,
  onSuccess
}: {
  categories: BudgetCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budgetType, setBudgetType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (startDate && endDate) return;

    if (budgetType === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toDate(start));
      setEndDate(toDate(end));
      return;
    }

    if (budgetType === 'quarterly') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterStartMonth, 1);
      const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      setStartDate(toDate(start));
      setEndDate(toDate(end));
      return;
    }

    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    setStartDate(toDate(start));
    setEndDate(toDate(end));
  }, [budgetType, endDate, startDate]);

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [allocations]);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError('You must be logged in.');
        return;
      }

      if (!name.trim()) {
        setError('Budget name is required.');
        return;
      }

      if (!startDate || !endDate) {
        setError('Start and end dates are required.');
        return;
      }

      const selectedAllocations = categories
        .map((c) => ({
          category_id: c.id,
          allocated_amount: Number(allocations[c.id] || 0)
        }))
        .filter((a) => a.allocated_amount > 0);

      if (selectedAllocations.length === 0) {
        setError('Allocate at least one category amount.');
        return;
      }

      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Database connection unavailable.');
        return;
      }

      const { data: budgetRow, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          budget_type: budgetType,
          start_date: startDate,
          end_date: endDate,
          total_amount: selectedAllocations.reduce((sum, a) => sum + a.allocated_amount, 0),
          currency,
          is_active: true,
          user_id: user.id
        })
        .select('*')
        .single();

      if (budgetError) throw budgetError;

      const budgetId = (budgetRow as { id: string }).id;

      const { error: itemsError } = await supabase.from('budget_items').insert(
        selectedAllocations.map((a) => ({
          budget_id: budgetId,
          category_id: a.category_id,
          allocated_amount: a.allocated_amount,
          spent_amount: 0,
          remaining_amount: a.allocated_amount,
          percentage_used: 0,
          user_id: user.id
        }))
      );

      if (itemsError) throw itemsError;

      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create budget';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Create budget</div>
            <Muted>Allocate amounts per category. Spent updates from expenses automatically.</Muted>
          </div>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </div>

        <Divider />

        <FieldGrid>
          <Field>
            <label>Budget name</label>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Budget" />
          </Field>
          <Field>
            <label>Type</label>
            <Select value={budgetType} onChange={(e) => setBudgetType(e.target.value as typeof budgetType)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Field>
          <Field>
            <label>Start date</label>
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field>
            <label>End date</label>
            <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </FieldGrid>

        <Field style={{ marginTop: '12px' }}>
          <label>Description (optional)</label>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note about this budget" />
        </Field>

        <Field style={{ marginTop: '12px' }}>
          <label>Currency</label>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="PKR">PKR</option>
          </Select>
        </Field>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)' }}>Category allocations</div>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>Total: {formatPKR(totalAllocated)}</div>
        </div>

        <div style={{ marginTop: '10px' }}>
          {categories.length === 0 ? (
            <ErrorText>Create at least one category first.</ErrorText>
          ) : (
            <AllocationList>
              {categories.map((c) => (
                <AllocationRow key={c.id}>
                  <AllocationChip>
                    <span>{c.name}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>{c.color}</span>
                  </AllocationChip>
                  <TextInput
                    inputMode="decimal"
                    placeholder="0"
                    value={allocations[c.id] ?? ''}
                    onChange={(e) => setAllocations((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                </AllocationRow>
              ))}
            </AllocationList>
          )}
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Budget'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function AddSavingsGoalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError('You must be logged in.');
        return;
      }

      if (!name.trim()) {
        setError('Goal name is required.');
        return;
      }

      const target = Number(targetAmount);
      if (!Number.isFinite(target) || target <= 0) {
        setError('Target amount must be greater than 0.');
        return;
      }

      const current = Number(currentAmount || 0);
      if (!Number.isFinite(current) || current < 0) {
        setError('Current amount must be 0 or more.');
        return;
      }

      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Database connection unavailable.');
        return;
      }

      const { error: insertError } = await supabase.from('savings_goals').insert({
        name: name.trim(),
        description: description.trim() || null,
        target_amount: target,
        current_amount: current,
        target_date: targetDate || null,
        priority,
        status: 'active',
        currency: 'PKR',
        color: '#10b981',
        icon: 'Target',
        user_id: user.id
      });

      if (insertError) throw insertError;

      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create goal';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Create savings goal</div>
            <Muted>Track a target amount and measure progress over time.</Muted>
          </div>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </div>

        <Divider />

        <Field>
          <label>Goal name</label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" />
        </Field>

        <Field style={{ marginTop: '12px' }}>
          <label>Description (optional)</label>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note about this goal" />
        </Field>

        <FieldGrid style={{ marginTop: '12px' }}>
          <Field>
            <label>Target amount</label>
            <TextInput inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field>
            <label>Current amount</label>
            <TextInput inputMode="decimal" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field>
            <label>Target date (optional)</label>
            <TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <Field>
            <label>Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
        </FieldGrid>

        {error && <ErrorText>{error}</ErrorText>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function AddBudgetCategoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [icon, setIcon] = useState('DollarSign');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError('You must be logged in.');
        return;
      }

      if (!name.trim()) {
        setError('Category name is required.');
        return;
      }

      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Database connection unavailable.');
        return;
      }

      const { error: insertError } = await supabase.from('budget_categories').insert({
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon,
        is_active: true,
        user_id: user.id
      });

      if (insertError) throw insertError;

      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create category';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Create category</div>
            <Muted>Use categories to organize budget allocations and comparisons.</Muted>
          </div>
          <IconButton onClick={onClose} title="Close">
            <X size={16} />
          </IconButton>
        </div>

        <Divider />

        <Field>
          <label>Category name</label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Utilities" />
        </Field>

        <Field style={{ marginTop: '12px' }}>
          <label>Description (optional)</label>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note about this category" />
        </Field>

        <FieldGrid style={{ marginTop: '12px' }}>
          <Field>
            <label>Color</label>
            <TextInput value={color} onChange={(e) => setColor(e.target.value)} placeholder="#ef4444" />
          </Field>
          <Field>
            <label>Icon</label>
            <Select value={icon} onChange={(e) => setIcon(e.target.value)}>
              <option value="DollarSign">DollarSign</option>
              <option value="Wallet">Wallet</option>
              <option value="Target">Target</option>
              <option value="BarChart3">BarChart3</option>
              <option value="PiggyBank">PiggyBank</option>
            </Select>
          </Field>
        </FieldGrid>

        {error && <ErrorText>{error}</ErrorText>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
