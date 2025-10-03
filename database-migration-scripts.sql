-- =====================================================
-- QUANTUMNEXA FINANCE APP - MIGRATION SCRIPTS
-- =====================================================
-- Use these scripts if you already have some tables and want to add new features
-- Run only the sections you need based on what's missing in your database

-- =====================================================
-- MIGRATION 1: ADD RECURRING INVOICE FEATURES
-- =====================================================

-- Add recurring invoice templates table
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

-- Add recurring invoice history table
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

-- Enable RLS and add policies for recurring invoices
ALTER TABLE recurring_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring invoice templates" ON recurring_invoice_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own recurring invoice history" ON recurring_invoice_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM recurring_invoice_templates WHERE id = template_id AND user_id = auth.uid())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_user_id ON recurring_invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_next_date ON recurring_invoice_templates(next_invoice_date);

-- =====================================================
-- MIGRATION 2: ADD SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Add subscriptions table
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

-- Add subscription payments table
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

-- Enable RLS and add policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own subscription payments" ON subscription_payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE id = subscription_id AND user_id = auth.uid())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- =====================================================
-- MIGRATION 3: ADD RECURRING INCOME TRACKING
-- =====================================================

-- Add recurring income table
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

-- Add recurring income history table
CREATE TABLE IF NOT EXISTS recurring_income_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_income_id UUID NOT NULL REFERENCES recurring_income(id) ON DELETE CASCADE,
    received_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'pending', 'missed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add policies for recurring income
ALTER TABLE recurring_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_income_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring income" ON recurring_income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own recurring income history" ON recurring_income_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM recurring_income WHERE id = recurring_income_id AND user_id = auth.uid())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recurring_income_user_id ON recurring_income(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_income_next_date ON recurring_income(next_income_date);

-- =====================================================
-- MIGRATION 4: ADD PAYMENT REMINDERS & NOTIFICATIONS
-- =====================================================

-- Add payment reminders table
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

-- Add notification settings table
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

-- Enable RLS and add policies
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment reminders" ON payment_reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notification settings" ON notification_settings FOR ALL USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_due_date ON payment_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- =====================================================
-- MIGRATION 5: ADD BUDGETING FEATURES
-- =====================================================

-- Add budget categories table
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

-- Add budgets table
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

-- Add budget items table
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

-- Add savings goals table
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

-- Add savings transactions table
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

-- Add budget alerts table
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

-- Enable RLS for budgeting tables
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- Add policies for budgeting tables
CREATE POLICY "Users can manage their own budget categories" ON budget_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budget items" ON budget_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own savings goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own savings transactions" ON savings_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budget alerts" ON budget_alerts FOR ALL USING (auth.uid() = user_id);

-- Add indexes for budgeting tables
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);

-- =====================================================
-- MIGRATION 6: ADD RECURRING CATEGORIES
-- =====================================================

-- Add recurring categories table
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

-- Enable RLS and add policy
ALTER TABLE recurring_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recurring categories" ON recurring_categories FOR ALL USING (auth.uid() = user_id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_recurring_categories_user_id ON recurring_categories(user_id);

-- =====================================================
-- MIGRATION 7: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add columns to projects table if they don't exist
DO $$ 
BEGIN
    -- Add project_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type VARCHAR(20) DEFAULT 'one_time' CHECK (project_type IN ('retainer', 'one_time', 'maintenance'));
    END IF;
    
    -- Add pricing_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'pricing_type') THEN
        ALTER TABLE projects ADD COLUMN pricing_type VARCHAR(10) CHECK (pricing_type IN ('fixed', 'hourly'));
    END IF;
    
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
        ALTER TABLE projects ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
    
    -- Add estimated_hours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'estimated_hours') THEN
        ALTER TABLE projects ADD COLUMN estimated_hours DECIMAL(8,2);
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'notes') THEN
        ALTER TABLE projects ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add columns to expenses table if they don't exist
DO $$ 
BEGIN
    -- Add subcategory column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'subcategory') THEN
        ALTER TABLE expenses ADD COLUMN subcategory VARCHAR(100);
    END IF;
    
    -- Add vendor column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'vendor') THEN
        ALTER TABLE expenses ADD COLUMN vendor VARCHAR(255);
    END IF;
    
    -- Add is_billable column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'is_billable') THEN
        ALTER TABLE expenses ADD COLUMN is_billable BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add columns to invoices table if they don't exist
DO $$ 
BEGIN
    -- Add terms_conditions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms_conditions') THEN
        ALTER TABLE invoices ADD COLUMN terms_conditions TEXT;
    END IF;
END $$;

-- =====================================================
-- MIGRATION 8: ADD UTILITY FUNCTIONS
-- =====================================================

-- Function to calculate next recurring date (if not exists)
CREATE OR REPLACE FUNCTION calculate_next_date(
    current_date DATE,
    frequency VARCHAR(20),
    interval_count INTEGER DEFAULT 1
) RETURNS DATE AS $$
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            RETURN current_date + (interval_count || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            RETURN current_date + (interval_count || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
            RETURN current_date + (interval_count || ' months')::INTERVAL;
        WHEN 'quarterly' THEN
            RETURN current_date + (interval_count * 3 || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            RETURN current_date + (interval_count || ' years')::INTERVAL;
        ELSE
            RETURN current_date;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns on new tables
DO $$
BEGIN
    -- Check if trigger exists before creating
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recurring_invoice_templates_updated_at') THEN
        CREATE TRIGGER update_recurring_invoice_templates_updated_at 
        BEFORE UPDATE ON recurring_invoice_templates 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        CREATE TRIGGER update_subscriptions_updated_at 
        BEFORE UPDATE ON subscriptions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recurring_income_updated_at') THEN
        CREATE TRIGGER update_recurring_income_updated_at 
        BEFORE UPDATE ON recurring_income 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_reminders_updated_at') THEN
        CREATE TRIGGER update_payment_reminders_updated_at 
        BEFORE UPDATE ON payment_reminders 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_settings_updated_at') THEN
        CREATE TRIGGER update_notification_settings_updated_at 
        BEFORE UPDATE ON notification_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recurring_categories_updated_at') THEN
        CREATE TRIGGER update_recurring_categories_updated_at 
        BEFORE UPDATE ON recurring_categories 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Your database has been updated with all the latest features!
-- 
-- What was added:
-- ✅ Recurring Invoice Templates & History
-- ✅ Subscription Management & Payment Tracking
-- ✅ Recurring Income Sources & History
-- ✅ Payment Reminders & Notifications
-- ✅ Budgeting & Financial Planning
-- ✅ Recurring Categories for Organization
-- ✅ Enhanced columns for existing tables
-- ✅ Utility functions and triggers
-- ✅ Row Level Security policies
-- ✅ Performance indexes
-- 
-- Total New Tables: 14
-- Enhanced Existing Tables: 3 (projects, expenses, invoices)