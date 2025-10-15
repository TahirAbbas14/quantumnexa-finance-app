-- =====================================================
-- DISABLE ROW LEVEL SECURITY (RLS) - EMPLOYEE PAYROLL TABLES ONLY
-- Quantumnexa Finance App - Employee Payroll Module
-- =====================================================

-- ⚠️  SECURITY WARNING ⚠️
-- These queries will DISABLE Row Level Security on employee payroll tables only.
-- This should ONLY be used in development/testing environments.
-- NEVER run these in production without proper backup and security review.

-- =====================================================
-- DISABLE RLS FOR EMPLOYEE PAYROLL TABLES
-- =====================================================

DO $$ 
BEGIN
    -- Employee Payroll Tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for employees';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_benefits') THEN
        ALTER TABLE employee_benefits DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for employee_benefits';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_deductions') THEN
        ALTER TABLE employee_deductions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for employee_deductions';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_tracking') THEN
        ALTER TABLE time_tracking DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for time_tracking';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_leaves') THEN
        ALTER TABLE employee_leaves DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for employee_leaves';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll') THEN
        ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for payroll';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_items') THEN
        ALTER TABLE payroll_items DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for payroll_items';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance_summary') THEN
        ALTER TABLE attendance_summary DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for attendance_summary';
    END IF;
    
END $$;

-- =====================================================
-- VERIFICATION - CHECK RLS STATUS FOR PAYROLL TABLES
-- =====================================================

-- Check RLS status for employee payroll tables only
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'employees',
    'employee_benefits', 
    'employee_deductions',
    'time_tracking',
    'employee_leaves',
    'payroll',
    'payroll_items',
    'attendance_summary'
  )
ORDER BY tablename;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
HOW TO USE THIS FILE:

1. Run the DO $$ block to disable RLS on all employee payroll tables
2. Run the verification query to confirm RLS has been disabled
3. The script will only affect employee payroll related tables

This approach is safe because:
- It won't throw errors for non-existent tables
- It provides feedback on which tables were processed
- It only affects employee payroll tables, not other system tables
*/

-- =====================================================
-- RE-ENABLE RLS (For Future Reference)
-- =====================================================

/*
-- To re-enable RLS on employee payroll tables:
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_benefits') THEN
        ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_deductions') THEN
        ALTER TABLE employee_deductions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_tracking') THEN
        ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_leaves') THEN
        ALTER TABLE employee_leaves ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll') THEN
        ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_items') THEN
        ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance_summary') THEN
        ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
*/