-- Enhanced Supabase Schema for Comprehensive Financial Management
-- Run this script in Supabase SQL Editor

-- First, fix the existing projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT CHECK (project_type IN ('marketing_retainer', 'one_time', 'maintenance_contract'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pricing_type TEXT CHECK (pricing_type IN ('fixed', 'hourly'));

-- Update existing projects with default values
UPDATE projects SET project_type = 'one_time' WHERE project_type IS NULL;
UPDATE projects SET pricing_type = 'fixed' WHERE pricing_type IS NULL;

-- Accounts table for multiple bank/cash accounts
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('bank', 'cash', 'credit_card', 'digital_wallet')),
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    branch VARCHAR(255),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Transactions table for comprehensive transaction tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    reference_type VARCHAR(50) CHECK (reference_type IN ('invoice', 'expense', 'payment', 'manual', 'transfer')),
    reference_id UUID, -- Can reference invoices, expenses, payments, etc.
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enhanced expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Client financial summary view (materialized for performance)
CREATE TABLE IF NOT EXISTS client_financial_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    total_invoiced DECIMAL(15,2) DEFAULT 0,
    total_paid DECIMAL(15,2) DEFAULT 0,
    outstanding_balance DECIMAL(15,2) DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    last_invoice_date DATE,
    last_payment_date DATE,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(client_id, user_id)
);

-- Project financial tracking
CREATE TABLE IF NOT EXISTS project_financials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    total_invoiced DECIMAL(15,2) DEFAULT 0,
    total_paid DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    profit_loss DECIMAL(15,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    hours_logged DECIMAL(8,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Time tracking for hourly projects
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    hours DECIMAL(8,2) NOT NULL,
    hourly_rate DECIMAL(10,2),
    total_amount DECIMAL(15,2),
    date DATE NOT NULL,
    is_billable BOOLEAN DEFAULT true,
    is_invoiced BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Recurring invoices for retainers
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    template_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR' NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_invoice_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    terms_conditions TEXT,
    auto_send BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Tax settings
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_client_financial_summary_user_id ON client_financial_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_project_financials_user_id ON project_financials(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_settings_user_id ON tax_settings(user_id);

-- Enable Row Level Security for new tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_financial_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
-- Accounts policies
CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Expense categories policies
CREATE POLICY "Users can manage their own expense categories" ON expense_categories FOR ALL USING (auth.uid() = user_id);

-- Client financial summary policies
CREATE POLICY "Users can view their own client financial summaries" ON client_financial_summary FOR ALL USING (auth.uid() = user_id);

-- Project financials policies
CREATE POLICY "Users can manage their own project financials" ON project_financials FOR ALL USING (auth.uid() = user_id);

-- Time entries policies
CREATE POLICY "Users can manage their own time entries" ON time_entries FOR ALL USING (auth.uid() = user_id);

-- Recurring invoices policies
CREATE POLICY "Users can manage their own recurring invoices" ON recurring_invoices FOR ALL USING (auth.uid() = user_id);

-- Tax settings policies
CREATE POLICY "Users can manage their own tax settings" ON tax_settings FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_financial_summary_updated_at BEFORE UPDATE ON client_financial_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_financials_updated_at BEFORE UPDATE ON project_financials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_invoices_updated_at BEFORE UPDATE ON recurring_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for automatic calculations
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update account balance when transaction is inserted/updated/deleted
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE accounts 
        SET current_balance = opening_balance + (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'income' THEN amount
                    WHEN transaction_type = 'expense' THEN -amount
                    ELSE 0
                END
            ), 0)
            FROM transactions 
            WHERE account_id = NEW.account_id
        )
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET current_balance = opening_balance + (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'income' THEN amount
                    WHEN transaction_type = 'expense' THEN -amount
                    ELSE 0
                END
            ), 0)
            FROM transactions 
            WHERE account_id = OLD.account_id
        )
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for account balance updates
CREATE TRIGGER update_account_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();