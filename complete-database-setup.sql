-- =====================================================
-- QUANTUMNEXA FINANCE APP - COMPLETE DATABASE SETUP
-- =====================================================
-- This script creates all necessary tables for the Quantumnexa Finance App
-- Run this script in your Supabase SQL Editor or PostgreSQL database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES (Main Business Logic)
-- =====================================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    project_type VARCHAR(20) DEFAULT 'one_time' CHECK (project_type IN ('retainer', 'one_time', 'maintenance')),
    pricing_type VARCHAR(10) CHECK (pricing_type IN ('fixed', 'hourly')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    budget DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    start_date DATE,
    end_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_hours DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    notes TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    date DATE NOT NULL,
    receipt_url TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    vendor VARCHAR(255),
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque')),
    is_billable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    bank_details TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- =====================================================
-- BUDGETING & FINANCIAL PLANNING TABLES
-- =====================================================

-- Budget Categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#ef4444',
    icon VARCHAR(50) DEFAULT 'DollarSign',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('monthly', 'yearly', 'quarterly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Budget Items table
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) DEFAULT 0,
    percentage_used DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(budget_id, category_id)
);

-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    color VARCHAR(7) DEFAULT '#10b981',
    icon VARCHAR(50) DEFAULT 'Target',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Savings Transactions table
CREATE TABLE IF NOT EXISTS savings_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    savings_goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('contribution', 'withdrawal')),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Budget Alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('threshold_warning', 'threshold_exceeded', 'budget_completed')),
    threshold_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- =====================================================
-- RECURRING FEATURES TABLES
-- =====================================================

-- Recurring Invoice Templates
CREATE TABLE IF NOT EXISTS recurring_invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    frequency_interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_invoice_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_send BOOLEAN DEFAULT false,
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Invoice History
CREATE TABLE IF NOT EXISTS recurring_invoice_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES recurring_invoice_templates(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'failed', 'cancelled')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    billing_frequency VARCHAR(20) NOT NULL CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    billing_interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE NOT NULL,
    last_billed_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_pay BOOLEAN DEFAULT false,
    payment_method VARCHAR(100),
    vendor VARCHAR(255),
    website_url VARCHAR(500),
    cancellation_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Payment History
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Income Sources
CREATE TABLE IF NOT EXISTS recurring_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    frequency_interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_income_date DATE NOT NULL,
    last_received_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_record BOOLEAN DEFAULT false,
    payment_method VARCHAR(100),
    source_contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Income History
CREATE TABLE IF NOT EXISTS recurring_income_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_income_id UUID NOT NULL REFERENCES recurring_income(id) ON DELETE CASCADE,
    received_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'pending', 'missed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'PKR',
    due_date DATE NOT NULL,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('invoice_payment', 'subscription_renewal', 'bill_payment', 'tax_payment', 'loan_payment', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    next_reminder_date DATE,
    related_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    related_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    advance_days INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Recurring Categories (for better organization)
CREATE TABLE IF NOT EXISTS recurring_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'subscription')),
    color VARCHAR(7) DEFAULT '#ef4444',
    icon VARCHAR(50) DEFAULT 'DollarSign',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core tables indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- Budgeting indexes
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);

-- Recurring features indexes
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_user_id ON recurring_invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_next_date ON recurring_invoice_templates(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_recurring_income_user_id ON recurring_income(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_income_next_date ON recurring_income(next_income_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_due_date ON payment_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_categories_user_id ON recurring_categories(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_income_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Users can only access their own data)
-- =====================================================

-- Core tables policies
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payments" ON payments FOR ALL USING (auth.uid() = user_id);

-- Budgeting policies
CREATE POLICY "Users can manage their own budget categories" ON budget_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budget items" ON budget_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own savings goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own savings transactions" ON savings_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budget alerts" ON budget_alerts FOR ALL USING (auth.uid() = user_id);

-- Recurring features policies
CREATE POLICY "Users can manage their own recurring invoice templates" ON recurring_invoice_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own recurring invoice history" ON recurring_invoice_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM recurring_invoice_templates WHERE id = template_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own subscription payments" ON subscription_payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE id = subscription_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own recurring income" ON recurring_income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own recurring income history" ON recurring_income_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM recurring_income WHERE id = recurring_income_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own payment reminders" ON payment_reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notification settings" ON notification_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own recurring categories" ON recurring_categories FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate next recurring date
CREATE OR REPLACE FUNCTION calculate_next_date(
    start_date DATE,
    frequency VARCHAR(20),
    interval_count INTEGER DEFAULT 1
) RETURNS DATE AS $$
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            RETURN start_date + (interval_count || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            RETURN start_date + (interval_count || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
            RETURN start_date + (interval_count || ' months')::INTERVAL;
        WHEN 'quarterly' THEN
            RETURN start_date + (interval_count * 3 || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            RETURN start_date + (interval_count || ' years')::INTERVAL;
        ELSE
            RETURN start_date;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_invoice_templates_updated_at BEFORE UPDATE ON recurring_invoice_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_income_updated_at BEFORE UPDATE ON recurring_income FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_reminders_updated_at BEFORE UPDATE ON payment_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_categories_updated_at BEFORE UPDATE ON recurring_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update next recurring dates
CREATE OR REPLACE FUNCTION update_next_recurring_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Update next_invoice_date for recurring invoice templates
    IF TG_TABLE_NAME = 'recurring_invoice_templates' THEN
        NEW.next_invoice_date = calculate_next_date(OLD.next_invoice_date, NEW.frequency, NEW.frequency_interval);
    END IF;
    
    -- Update next_billing_date for subscriptions
    IF TG_TABLE_NAME = 'subscriptions' THEN
        NEW.next_billing_date = calculate_next_date(OLD.next_billing_date, NEW.billing_frequency, NEW.billing_interval);
    END IF;
    
    -- Update next_income_date for recurring income
    IF TG_TABLE_NAME = 'recurring_income' THEN
        NEW.next_income_date = calculate_next_date(OLD.next_income_date, NEW.frequency, NEW.frequency_interval);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEFAULT DATA INSERTS
-- =====================================================

-- Default notification settings and recurring categories will be inserted 
-- via application logic when users first sign up

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your Quantumnexa Finance App database is now ready!
-- 
-- Next Steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Verify all tables are created successfully
-- 3. Test the application features
-- 4. Set up any additional custom functions as needed
-- 
-- Total Tables Created: 19
-- - Core Business: 5 tables (clients, projects, invoices, expenses, payments)
-- - Budgeting: 6 tables (budget_categories, budgets, budget_items, savings_goals, savings_transactions, budget_alerts)
-- - Recurring Features: 8 tables (recurring_invoice_templates, recurring_invoice_history, subscriptions, subscription_payments, recurring_income, recurring_income_history, payment_reminders, notification_settings, recurring_categories)