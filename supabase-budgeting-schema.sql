-- Budgeting & Financial Planning Schema
-- Run this script in Supabase SQL Editor after the main schema

-- Budget Categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#ef4444', -- Default red color
    icon VARCHAR(50) DEFAULT 'DollarSign',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Budgets table for monthly/yearly budgets
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

-- Budget Items - individual category allocations within a budget
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
    color VARCHAR(7) DEFAULT '#10b981', -- Default green color
    icon VARCHAR(50) DEFAULT 'Target',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Savings Transactions - track contributions to savings goals
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal_id ON savings_transactions(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);

-- Enable Row Level Security
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Budget Categories policies
CREATE POLICY "Users can manage their own budget categories" ON budget_categories FOR ALL USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

-- Budget Items policies
CREATE POLICY "Users can manage their own budget items" ON budget_items FOR ALL USING (auth.uid() = user_id);

-- Savings Goals policies
CREATE POLICY "Users can manage their own savings goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);

-- Savings Transactions policies
CREATE POLICY "Users can manage their own savings transactions" ON savings_transactions FOR ALL USING (auth.uid() = user_id);

-- Budget Alerts policies
CREATE POLICY "Users can manage their own budget alerts" ON budget_alerts FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for automatic calculations

-- Function to update budget item calculations
CREATE OR REPLACE FUNCTION update_budget_item_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate remaining amount and percentage used
    NEW.remaining_amount = NEW.allocated_amount - NEW.spent_amount;
    NEW.percentage_used = CASE 
        WHEN NEW.allocated_amount > 0 THEN (NEW.spent_amount / NEW.allocated_amount) * 100
        ELSE 0
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for budget item calculations
CREATE TRIGGER update_budget_item_calculations_trigger
    BEFORE INSERT OR UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_budget_item_calculations();

-- Function to update savings goal current amount
CREATE OR REPLACE FUNCTION update_savings_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE savings_goals 
        SET current_amount = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'contribution' THEN amount
                    WHEN transaction_type = 'withdrawal' THEN -amount
                    ELSE 0
                END
            ), 0)
            FROM savings_transactions 
            WHERE savings_goal_id = NEW.savings_goal_id
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN transaction_type = 'contribution' THEN amount
                        WHEN transaction_type = 'withdrawal' THEN -amount
                        ELSE 0
                    END
                ), 0)
                FROM savings_transactions 
                WHERE savings_goal_id = NEW.savings_goal_id
            ) >= target_amount THEN 'completed'
            ELSE status
        END
        WHERE id = NEW.savings_goal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE savings_goals 
        SET current_amount = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'contribution' THEN amount
                    WHEN transaction_type = 'withdrawal' THEN -amount
                    ELSE 0
                END
            ), 0)
            FROM savings_transactions 
            WHERE savings_goal_id = OLD.savings_goal_id
        )
        WHERE id = OLD.savings_goal_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for savings goal amount updates
CREATE TRIGGER update_savings_goal_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON savings_transactions
    FOR EACH ROW EXECUTE FUNCTION update_savings_goal_amount();

-- Alert settings table
CREATE TABLE alert_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    threshold_50 BOOLEAN DEFAULT false,
    threshold_75 BOOLEAN DEFAULT true,
    threshold_90 BOOLEAN DEFAULT true,
    threshold_100 BOOLEAN DEFAULT true,
    daily_summary BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS for alert_settings
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert settings" ON alert_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert settings" ON alert_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert settings" ON alert_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert settings" ON alert_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for alert_settings updated_at
CREATE TRIGGER update_alert_settings_updated_at
    BEFORE UPDATE ON alert_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check and create budget alerts
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
    budget_record RECORD;
    settings_record RECORD;
    total_spent DECIMAL(12,2);
    percentage_used DECIMAL(5,2);
    alert_message TEXT;
    alert_severity TEXT;
    alert_type_val TEXT;
    should_alert BOOLEAN := false;
BEGIN
    -- Get budget information
    SELECT b.*, bc.name as category_name 
    INTO budget_record
    FROM budgets b
    JOIN budget_categories bc ON b.category_id = bc.id
    WHERE b.id = NEW.budget_id;
    
    -- Get user alert settings
    SELECT * INTO settings_record
    FROM alert_settings
    WHERE user_id = budget_record.user_id;
    
    -- If no settings found, use defaults
    IF settings_record IS NULL THEN
        settings_record := ROW(
            gen_random_uuid(), budget_record.user_id, true, true, 
            false, true, true, true, false, true, NOW(), NOW()
        )::alert_settings;
    END IF;
    
    -- Calculate total spent for this budget
    SELECT COALESCE(SUM(amount), 0) INTO total_spent
    FROM budget_items
    WHERE budget_id = NEW.budget_id;
    
    -- Calculate percentage used
    percentage_used := (total_spent / budget_record.amount) * 100;
    
    -- Determine alert conditions based on user settings
    IF percentage_used >= 100 AND settings_record.threshold_100 THEN
        alert_message := 'Budget exceeded! You have spent ' || ROUND(percentage_used, 1)::TEXT || '% of your ' || budget_record.category_name || ' budget.';
        alert_severity := 'critical';
        alert_type_val := 'overspend';
        should_alert := true;
    ELSIF percentage_used >= 90 AND settings_record.threshold_90 THEN
        alert_message := 'Budget warning! You have used ' || ROUND(percentage_used, 1)::TEXT || '% of your ' || budget_record.category_name || ' budget.';
        alert_severity := 'warning';
        alert_type_val := 'approaching_limit';
        should_alert := true;
    ELSIF percentage_used >= 75 AND settings_record.threshold_75 THEN
        alert_message := 'Budget notice: You have used ' || ROUND(percentage_used, 1)::TEXT || '% of your ' || budget_record.category_name || ' budget.';
        alert_severity := 'info';
        alert_type_val := 'threshold';
        should_alert := true;
    ELSIF percentage_used >= 50 AND settings_record.threshold_50 THEN
        alert_message := 'Budget update: You have used ' || ROUND(percentage_used, 1)::TEXT || '% of your ' || budget_record.category_name || ' budget.';
        alert_severity := 'info';
        alert_type_val := 'threshold';
        should_alert := true;
    END IF;
    
    -- Insert alert if conditions are met
    IF should_alert THEN
        -- Avoid duplicates by checking if similar alert exists in last 24 hours
        INSERT INTO budget_alerts (
            user_id,
            budget_id,
            alert_type,
            threshold_percentage,
            current_amount,
            budget_amount,
            severity,
            message
        )
        SELECT 
            budget_record.user_id,
            NEW.budget_id,
            alert_type_val,
            percentage_used,
            total_spent,
            budget_record.amount,
            alert_severity,
            alert_message
        WHERE NOT EXISTS (
            SELECT 1 FROM budget_alerts 
            WHERE budget_id = NEW.budget_id 
            AND alert_type = alert_type_val
            AND status = 'active'
            AND created_at > NOW() - INTERVAL '24 hours'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for budget alerts on budget_items
CREATE TRIGGER budget_alert_trigger
    AFTER INSERT OR UPDATE ON budget_items
    FOR EACH ROW
    EXECUTE FUNCTION check_budget_alerts();

-- Insert default budget categories
INSERT INTO budget_categories (name, description, color, icon, user_id) 
SELECT 
    'Food & Dining',
    'Restaurant meals, groceries, and food expenses',
    '#ef4444',
    'UtensilsCrossed',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, description, color, icon, user_id) 
SELECT 
    'Transportation',
    'Fuel, public transport, and vehicle expenses',
    '#3b82f6',
    'Car',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, description, color, icon, user_id) 
SELECT 
    'Entertainment',
    'Movies, games, and recreational activities',
    '#8b5cf6',
    'Gamepad2',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, description, color, icon, user_id) 
SELECT 
    'Utilities',
    'Electricity, water, internet, and phone bills',
    '#f59e0b',
    'Zap',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, description, color, icon, user_id) 
SELECT 
    'Healthcare',
    'Medical expenses, insurance, and health-related costs',
    '#10b981',
    'Heart',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;