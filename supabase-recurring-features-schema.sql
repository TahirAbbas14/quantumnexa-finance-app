-- Recurring Features Schema for Quantumnexa Finance App
-- This schema supports automatic recurring invoices, subscription tracking, 
-- recurring income, and payment reminders/notifications

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recurring Invoice Templates
CREATE TABLE recurring_invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    frequency_interval INTEGER DEFAULT 1, -- e.g., every 2 weeks, every 3 months
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for indefinite
    next_invoice_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_send BOOLEAN DEFAULT false,
    payment_terms INTEGER DEFAULT 30, -- days
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Invoice History
CREATE TABLE recurring_invoice_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES recurring_invoice_templates(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'failed', 'cancelled')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Expenses
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_frequency VARCHAR(20) NOT NULL CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    billing_interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for ongoing subscriptions
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
CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Income Sources
CREATE TABLE recurring_income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    frequency_interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for ongoing income
    next_income_date DATE NOT NULL,
    last_received_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_record BOOLEAN DEFAULT false,
    payment_method VARCHAR(100),
    source_contact VARCHAR(255),
    contract_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Income History
CREATE TABLE recurring_income_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recurring_income_id UUID NOT NULL REFERENCES recurring_income(id) ON DELETE CASCADE,
    income_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'expected' CHECK (status IN ('expected', 'received', 'missed', 'cancelled')),
    actual_amount DECIMAL(12,2),
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Reminders and Notifications
CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('invoice_due', 'subscription_due', 'income_expected', 'payment_overdue', 'subscription_renewal')),
    reference_id UUID NOT NULL, -- ID of the related record (invoice, subscription, etc.)
    reference_table VARCHAR(50) NOT NULL, -- Table name of the related record
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    due_date DATE NOT NULL,
    reminder_date DATE NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    notification_method VARCHAR(20) DEFAULT 'email' CHECK (notification_method IN ('email', 'sms', 'push', 'in_app')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- For recurring reminders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Settings
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    advance_days INTEGER DEFAULT 3, -- Days before due date to send reminder
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Recurring Transaction Categories
CREATE TABLE recurring_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'subscription')),
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color code
    icon VARCHAR(50) DEFAULT 'folder',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name, type)
);

-- Create indexes for better performance
CREATE INDEX idx_recurring_invoice_templates_user_id ON recurring_invoice_templates(user_id);
CREATE INDEX idx_recurring_invoice_templates_next_date ON recurring_invoice_templates(next_invoice_date) WHERE is_active = true;
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE is_active = true;
CREATE INDEX idx_recurring_income_user_id ON recurring_income(user_id);
CREATE INDEX idx_recurring_income_next_date ON recurring_income(next_income_date) WHERE is_active = true;
CREATE INDEX idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX idx_payment_reminders_due_date ON payment_reminders(reminder_date) WHERE is_sent = false;

-- Create functions for automatic date calculations
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
            RETURN current_date + INTERVAL '1 month';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_invoice_date after creating invoice
CREATE OR REPLACE FUNCTION update_recurring_invoice_next_date()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recurring_invoice_templates 
    SET next_invoice_date = calculate_next_date(next_invoice_date, frequency, frequency_interval),
        updated_at = NOW()
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_invoice_next_date
    AFTER INSERT ON recurring_invoice_history
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_invoice_next_date();

-- Trigger to update next_billing_date after subscription payment
CREATE OR REPLACE FUNCTION update_subscription_next_date()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE subscriptions 
    SET next_billing_date = calculate_next_date(next_billing_date, billing_frequency, billing_interval),
        last_billed_date = NEW.payment_date,
        updated_at = NOW()
    WHERE id = NEW.subscription_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_next_date
    AFTER INSERT ON subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_next_date();

-- Trigger to update next_income_date after income received
CREATE OR REPLACE FUNCTION update_recurring_income_next_date()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recurring_income 
    SET next_income_date = calculate_next_date(next_income_date, frequency, frequency_interval),
        last_received_date = NEW.income_date,
        updated_at = NOW()
    WHERE id = NEW.recurring_income_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_income_next_date
    AFTER UPDATE ON recurring_income_history
    FOR EACH ROW
    WHEN (NEW.status = 'received' AND OLD.status != 'received')
    EXECUTE FUNCTION update_recurring_income_next_date();

-- Insert default notification settings
INSERT INTO notification_settings (user_id, notification_type, advance_days) 
SELECT 
    id as user_id,
    unnest(ARRAY['invoice_due', 'subscription_due', 'income_expected', 'payment_overdue', 'subscription_renewal']) as notification_type,
    CASE 
        WHEN unnest(ARRAY['invoice_due', 'subscription_due', 'income_expected', 'payment_overdue', 'subscription_renewal']) = 'payment_overdue' THEN 0
        ELSE 3
    END as advance_days
FROM auth.users
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- Insert default recurring categories
INSERT INTO recurring_categories (user_id, name, type, color, icon, is_default)
SELECT 
    u.id as user_id,
    category_data.name,
    category_data.type,
    category_data.color,
    category_data.icon,
    true as is_default
FROM auth.users u
CROSS JOIN (
    VALUES 
    ('Software & Tools', 'subscription', '#3b82f6', 'laptop'),
    ('Entertainment', 'subscription', '#8b5cf6', 'play'),
    ('Utilities', 'subscription', '#10b981', 'zap'),
    ('Insurance', 'subscription', '#f59e0b', 'shield'),
    ('Salary', 'income', '#22c55e', 'dollar-sign'),
    ('Freelance', 'income', '#06b6d4', 'briefcase'),
    ('Investments', 'income', '#84cc16', 'trending-up'),
    ('Rental', 'income', '#f97316', 'home')
) AS category_data(name, type, color, icon)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE recurring_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_income_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_invoice_templates
CREATE POLICY "Users can view their own recurring invoice templates" ON recurring_invoice_templates
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring invoice templates" ON recurring_invoice_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring invoice templates" ON recurring_invoice_templates
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring invoice templates" ON recurring_invoice_templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recurring_income
CREATE POLICY "Users can view their own recurring income" ON recurring_income
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring income" ON recurring_income
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring income" ON recurring_income
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring income" ON recurring_income
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for payment_reminders
CREATE POLICY "Users can view their own payment reminders" ON payment_reminders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payment reminders" ON payment_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment reminders" ON payment_reminders
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment reminders" ON payment_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_settings
CREATE POLICY "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recurring_categories
CREATE POLICY "Users can view their own recurring categories" ON recurring_categories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring categories" ON recurring_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring categories" ON recurring_categories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring categories" ON recurring_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Add similar policies for history tables (they inherit user_id through joins)
CREATE POLICY "Users can view recurring invoice history" ON recurring_invoice_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recurring_invoice_templates 
            WHERE id = template_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view subscription payments" ON subscription_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE id = subscription_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view recurring income history" ON recurring_income_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recurring_income 
            WHERE id = recurring_income_id AND user_id = auth.uid()
        )
    );