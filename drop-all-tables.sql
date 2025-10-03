-- =====================================================
-- QUANTUMNEXA FINANCE APP - DROP ALL TABLES SCRIPT
-- =====================================================
-- ⚠️  WARNING: This will delete ALL data in your database!
-- Only run this if you want to start completely fresh
-- Make sure to backup your data first if needed

-- =====================================================
-- DISABLE ROW LEVEL SECURITY FIRST
-- =====================================================
-- This prevents issues when dropping tables with RLS enabled

ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS savings_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurring_invoice_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurring_invoice_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurring_income DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurring_income_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurring_categories DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP ALL TABLES IN CORRECT ORDER
-- =====================================================
-- Tables are dropped in reverse dependency order to avoid foreign key conflicts

-- Drop recurring features tables first (no dependencies)
DROP TABLE IF EXISTS recurring_invoice_history CASCADE;
DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS recurring_income_history CASCADE;
DROP TABLE IF EXISTS budget_alerts CASCADE;
DROP TABLE IF EXISTS savings_transactions CASCADE;
DROP TABLE IF EXISTS budget_items CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS recurring_categories CASCADE;

-- Drop main recurring tables
DROP TABLE IF EXISTS recurring_invoice_templates CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS recurring_income CASCADE;
DROP TABLE IF EXISTS payment_reminders CASCADE;

-- Drop budgeting tables
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS budget_categories CASCADE;
DROP TABLE IF EXISTS savings_goals CASCADE;

-- Drop core business tables (in dependency order)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- =====================================================
-- DROP CUSTOM FUNCTIONS
-- =====================================================
-- Remove any custom functions we created

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_next_date(DATE, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_next_recurring_date() CASCADE;

-- =====================================================
-- CLEAN UP COMPLETE
-- =====================================================
-- All tables, functions, and triggers have been removed
-- Your database is now clean and ready for fresh setup

-- Next steps:
-- 1. Run complete-database-setup.sql to recreate everything
-- 2. Or run specific migration scripts as needed

SELECT 'Database cleanup completed successfully! All tables dropped.' as status;