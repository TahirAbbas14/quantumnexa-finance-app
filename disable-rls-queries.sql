-- =====================================================
-- DISABLE ROW LEVEL SECURITY (RLS) QUERIES
-- Quantumnexa Finance App - Safe Version
-- =====================================================

-- ⚠️  SECURITY WARNING ⚠️
-- These queries will DISABLE Row Level Security on tables.
-- This should ONLY be used in development/testing environments.
-- NEVER run these in production without proper backup and security review.

-- =====================================================
-- STEP 1: CHECK EXISTING TABLES FIRST
-- =====================================================

-- Run this query first to see which tables exist in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- STEP 2: CORE BUSINESS TABLES (GUARANTEED TO EXIST)
-- =====================================================

-- These tables are from the main supabase-schema.sql and should exist
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: CONDITIONAL DISABLE FOR OPTIONAL TABLES
-- =====================================================

-- Use this approach to safely disable RLS only for existing tables
-- This will not throw errors if tables don't exist

DO $$ 
BEGIN
    -- Budgeting Tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_categories') THEN
        ALTER TABLE budget_categories DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for budget_categories';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budgets') THEN
        ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for budgets';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_items') THEN
        ALTER TABLE budget_items DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for budget_items';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'savings_goals') THEN
        ALTER TABLE savings_goals DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for savings_goals';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'savings_transactions') THEN
        ALTER TABLE savings_transactions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for savings_transactions';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_alerts') THEN
        ALTER TABLE budget_alerts DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for budget_alerts';
    END IF;
    
    -- Recurring Features Tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_invoice_templates') THEN
        ALTER TABLE recurring_invoice_templates DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for recurring_invoice_templates';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_invoice_history') THEN
        ALTER TABLE recurring_invoice_history DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for recurring_invoice_history';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for subscriptions';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_payments') THEN
        ALTER TABLE subscription_payments DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for subscription_payments';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_income') THEN
        ALTER TABLE recurring_income DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for recurring_income';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_income_history') THEN
        ALTER TABLE recurring_income_history DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for recurring_income_history';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_reminders') THEN
        ALTER TABLE payment_reminders DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for payment_reminders';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_settings') THEN
        ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for notification_settings';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_categories') THEN
        ALTER TABLE recurring_categories DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for recurring_categories';
    END IF;
    
    -- Enhanced Schema Tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
        ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for accounts';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for transactions';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
        ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for expense_categories';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_financial_summary') THEN
        ALTER TABLE client_financial_summary DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for client_financial_summary';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_financials') THEN
        ALTER TABLE project_financials DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for project_financials';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_entries') THEN
        ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for time_entries';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_invoices') THEN
        ALTER TABLE recurring_invoices DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for recurring_invoices';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_settings') THEN
        ALTER TABLE tax_settings DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for tax_settings';
    END IF;
    
    -- Reporting Tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for reports';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profit_loss_items') THEN
        ALTER TABLE profit_loss_items DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for profit_loss_items';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_flow_statements') THEN
        ALTER TABLE cash_flow_statements DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for cash_flow_statements';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_calculations') THEN
        ALTER TABLE tax_calculations DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for tax_calculations';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_metrics') THEN
        ALTER TABLE business_metrics DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for business_metrics';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_templates') THEN
        ALTER TABLE report_templates DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for report_templates';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_exports') THEN
        ALTER TABLE report_exports DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for report_exports';
    END IF;
    
END $$;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
HOW TO USE THIS FILE:

1. First run STEP 1 to see which tables exist
2. Run STEP 2 to disable RLS on core tables (guaranteed to exist)
3. Run STEP 3 to conditionally disable RLS on optional tables
4. Run STEP 4 to verify the changes

This approach is safe because:
- It won't throw errors for non-existent tables
- It provides feedback on which tables were processed
- It separates core tables from optional ones
*/

-- =====================================================
-- RE-ENABLE RLS (For Future Reference)
-- =====================================================

/*
-- To re-enable RLS on core tables:
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- For optional tables, use the same conditional approach:
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_categories') THEN
        ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
    END IF;
    -- Add more tables as needed...
END $$;
*/