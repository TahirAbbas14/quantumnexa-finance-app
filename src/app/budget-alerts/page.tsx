'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  AlertTriangle,
  Bell,
  Settings,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Zap,
  Mail,
  Smartphone,
  Loader2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import styled from 'styled-components';

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

const AlertsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

interface AlertCardProps {
  severity: 'info' | 'warning' | 'critical';
}

const AlertCard = styled(Card)<AlertCardProps>`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.severity) {
        case 'critical': return 'var(--error-500)';
        case 'warning': return 'var(--warning-500)';
        case 'info': return 'var(--primary-500)';
        default: return 'var(--gray-300)';
      }
    }};
  }
`;

interface SeverityBadgeProps {
  severity: 'info' | 'warning' | 'critical';
}

const SeverityBadge = styled.span<SeverityBadgeProps>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${props => {
    switch (props.severity) {
      case 'critical': return 'var(--error-100)';
      case 'warning': return 'var(--warning-100)';
      case 'info': return 'var(--primary-100)';
      default: return 'var(--gray-100)';
    }
  }};
  color: ${props => {
    switch (props.severity) {
      case 'critical': return 'var(--error-700)';
      case 'warning': return 'var(--warning-700)';
      case 'info': return 'var(--primary-700)';
      default: return 'var(--gray-700)';
    }
  }};
`;

interface StatusBadgeProps {
  status: 'active' | 'acknowledged' | 'resolved';
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
      case 'active': return 'var(--success-100)';
      case 'acknowledged': return 'var(--warning-100)';
      case 'resolved': return 'var(--gray-100)';
      default: return 'var(--gray-100)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return 'var(--success-700)';
      case 'acknowledged': return 'var(--warning-700)';
      case 'resolved': return 'var(--gray-700)';
      default: return 'var(--gray-700)';
    }
  }};
`;

const SettingsCard = styled(Card)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--gray-300);
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider {
    background-color: var(--primary-500);
  }
  
  input:checked + .slider:before {
    transform: translateX(24px);
  }
`;

// Interfaces
interface BudgetAlert {
  id: string;
  budget_id: string;
  budget_name: string;
  category_name: string;
  alert_type: 'threshold' | 'overspend' | 'approaching_limit';
  threshold_percentage: number;
  current_amount: number;
  budget_amount: number;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  message: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

interface AlertSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  threshold_50: boolean;
  threshold_75: boolean;
  threshold_90: boolean;
  threshold_100: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;
  created_at: string;
  updated_at: string;
}

export default function BudgetAlertsPage() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  // Memoize fetchData to satisfy exhaustive-deps
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAlerts(),
        fetchSettings()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depends on user

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('budget_alerts')
      .select(`
        *,
        budgets(name),
        budget_categories(name)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const alertsWithNames = data?.map(alert => ({
      ...alert,
      budget_name: alert.budgets?.name || 'Unknown Budget',
      category_name: alert.budget_categories?.name || 'Unknown Category'
    })) || [];
    
    setAlerts(alertsWithNames);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return;
    }
    
    if (data) {
      setSettings(data);
    } else {
      // Create default settings
      await createDefaultSettings();
    }
  };

  const createDefaultSettings = async () => {
    const defaultSettings = {
      user_id: user?.id,
      email_notifications: true,
      push_notifications: true,
      threshold_50: false,
      threshold_75: true,
      threshold_90: true,
      threshold_100: true,
      daily_summary: false,
      weekly_summary: true
    };

    const { data, error } = await supabase
      .from('alert_settings')
      .insert([defaultSettings])
      .select()
      .single();

    if (error) {
      console.error('Error creating default settings:', error);
      return;
    }

    setSettings(data);
  };

  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    if (!settings) return;

    const { data, error } = await supabase
      .from('alert_settings')
      .update(newSettings)
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return;
    }

    setSettings(data);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('budget_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
      return;
    }

    await fetchAlerts();
  };

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('budget_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
      return;
    }

    await fetchAlerts();
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('budget_alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      console.error('Error deleting alert:', error);
      return;
    }

    await fetchAlerts();
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filter === 'all' || alert.status === filter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const getAlertStats = () => {
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning' && a.status === 'active').length;
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged').length;

    return {
      activeAlerts,
      criticalAlerts,
      warningAlerts,
      acknowledgedAlerts
    };
  };

  const stats = getAlertStats();

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
          <h1>Budget Alerts</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={16} />
              Settings
            </Button>
            <Button onClick={fetchData}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </Header>

        <StatsGrid>
          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon color="var(--primary-100)" textColor="var(--primary-600)">
                  <Bell size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon color="var(--error-100)" textColor="var(--error-600)">
                  <AlertTriangle size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Critical Alerts</h3>
                <p className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</p>
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon color="var(--warning-100)" textColor="var(--warning-600)">
                  <TrendingUp size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Warning Alerts</h3>
                <p className="text-2xl font-bold text-yellow-600">{stats.warningAlerts}</p>
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div className="flex justify-between items-start">
              <div>
                <StatIcon color="var(--success-100)" textColor="var(--success-600)">
                  <CheckCircle size={24} />
                </StatIcon>
                <h3 className="text-sm font-medium text-gray-600">Acknowledged</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.acknowledgedAlerts}</p>
              </div>
            </div>
          </StatCard>
        </StatsGrid>

        {showSettings && settings && (
          <SettingsCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alert Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <XCircle size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Notification Methods</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">Email Notifications</span>
                    </div>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => updateSettings({ email_notifications: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">Push Notifications</span>
                    </div>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.push_notifications}
                        onChange={(e) => updateSettings({ push_notifications: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">50% of budget used</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.threshold_50}
                        onChange={(e) => updateSettings({ threshold_50: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">75% of budget used</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.threshold_75}
                        onChange={(e) => updateSettings({ threshold_75: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">90% of budget used</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.threshold_90}
                        onChange={(e) => updateSettings({ threshold_90: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Budget exceeded</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.threshold_100}
                        onChange={(e) => updateSettings({ threshold_100: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Summary Reports</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Daily Summary</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.daily_summary}
                        onChange={(e) => updateSettings({ daily_summary: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Weekly Summary</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={settings.weekly_summary}
                        onChange={(e) => updateSettings({ weekly_summary: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        {filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600 mb-6">
              {alerts.length === 0 
                ? "You don't have any budget alerts yet. Create some budgets to start monitoring your spending."
                : "Try adjusting your filters to see more alerts."
              }
            </p>
            <Button onClick={() => window.location.href = '/budgets'}>
              <Plus size={16} />
              Create Budget
            </Button>
          </Card>
        ) : (
          <AlertsGrid>
            {filteredAlerts.map(alert => (
              <AlertCard key={alert.id} severity={alert.severity}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityBadge severity={alert.severity}>
                        {alert.severity === 'critical' && <AlertTriangle size={12} />}
                        {alert.severity === 'warning' && <TrendingUp size={12} />}
                        {alert.severity === 'info' && <Bell size={12} />}
                        {alert.severity.toUpperCase()}
                      </SeverityBadge>
                      <StatusBadge status={alert.status}>
                        {alert.status === 'active' && <Zap size={12} />}
                        {alert.status === 'acknowledged' && <Eye size={12} />}
                        {alert.status === 'resolved' && <CheckCircle size={12} />}
                        {alert.status.toUpperCase()}
                      </StatusBadge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {alert.budget_name} - {alert.category_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Spending:</span>
                    <span className="font-medium">{formatPKR(alert.current_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget Amount:</span>
                    <span className="font-medium">{formatPKR(alert.budget_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage:</span>
                    <span className={`font-medium ${
                      alert.threshold_percentage > 100 ? 'text-red-600' : 
                      alert.threshold_percentage > 90 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {alert.threshold_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                  <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                  <span>{format(new Date(alert.created_at), 'MMM dd, HH:mm')}</span>
                </div>

                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="flex-1"
                      >
                        <Eye size={14} />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="flex-1"
                      >
                        <CheckCircle size={14} />
                        Resolve
                      </Button>
                    </>
                  )}
                  
                  {alert.status === 'acknowledged' && (
                    <Button
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="flex-1"
                    >
                      <CheckCircle size={14} />
                      Resolve
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAlert(alert.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </AlertCard>
            ))}
          </AlertsGrid>
        )}
      </Container>
    </DashboardLayout>
  );
}