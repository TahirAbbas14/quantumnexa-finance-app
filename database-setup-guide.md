# Quantumnexa Finance App - Database Setup Guide

## 📋 Overview

This guide will help you set up the complete database schema for your Quantumnexa Finance App. We provide two approaches depending on your current situation:

1. **Fresh Installation** - Complete database setup from scratch
2. **Migration** - Add new features to existing database

## 🗂️ Database Files Provided

| File | Purpose | When to Use |
|------|---------|-------------|
| `complete-database-setup.sql` | Complete schema with all tables | Fresh installation or complete rebuild |
| `database-migration-scripts.sql` | Incremental updates | Adding features to existing database |
| `supabase-schema.sql` | Core business tables | Legacy reference |
| `supabase-budgeting-schema.sql` | Budgeting features | Legacy reference |
| `supabase-recurring-features-schema.sql` | Recurring features | Legacy reference |

## 🚀 Quick Start

### Option 1: Fresh Installation (Recommended)

If you're setting up the database for the first time or want to start fresh:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run Complete Setup**
   ```sql
   -- Copy and paste the entire content of complete-database-setup.sql
   -- Then click "Run"
   ```

3. **Verify Installation**
   - Check that all 19 tables are created
   - Verify RLS policies are enabled
   - Test with sample data

### Option 2: Migration (Existing Database)

If you already have some tables and want to add new features:

1. **Identify What You Need**
   - Check which tables you already have
   - Determine which features you want to add

2. **Run Specific Migrations**
   ```sql
   -- Run only the sections you need from database-migration-scripts.sql
   -- For example, if you want to add recurring invoices:
   -- Copy and run "MIGRATION 1: ADD RECURRING INVOICE FEATURES"
   ```

3. **Test Each Migration**
   - Verify each feature works after adding
   - Check for any conflicts with existing data

## 📊 Database Schema Overview

### Core Business Tables (5 tables)
- `clients` - Customer information
- `projects` - Project management
- `invoices` - Invoice generation and tracking
- `expenses` - Expense management
- `payments` - Payment tracking

### Budgeting & Planning (6 tables)
- `budget_categories` - Budget category definitions
- `budgets` - Budget periods and limits
- `budget_items` - Individual budget allocations
- `savings_goals` - Financial goals tracking
- `savings_transactions` - Goal contribution history
- `budget_alerts` - Budget threshold notifications

### Recurring Features (8 tables)
- `recurring_invoice_templates` - Automated invoice templates
- `recurring_invoice_history` - Generated invoice tracking
- `subscriptions` - Subscription expense management
- `subscription_payments` - Subscription payment history
- `recurring_income` - Regular income sources
- `recurring_income_history` - Income receipt tracking
- `payment_reminders` - Due date notifications
- `notification_settings` - User notification preferences
- `recurring_categories` - Organization categories

## 🔧 Step-by-Step Setup Instructions

### Step 1: Prepare Your Environment

1. **Supabase Project Ready**
   - Ensure you have a Supabase project created
   - Have admin access to the SQL Editor

2. **Backup Existing Data** (if applicable)
   ```sql
   -- If you have existing data, create backups first
   -- Example for clients table:
   CREATE TABLE clients_backup AS SELECT * FROM clients;
   ```

### Step 2: Choose Your Installation Method

#### For Fresh Installation:

```sql
-- 1. Open complete-database-setup.sql
-- 2. Copy the entire content
-- 3. Paste in Supabase SQL Editor
-- 4. Click "Run"
-- 5. Wait for completion (may take 30-60 seconds)
```

#### For Migration:

```sql
-- 1. Open database-migration-scripts.sql
-- 2. Find the migration section you need
-- 3. Copy only that section
-- 4. Paste in Supabase SQL Editor
-- 5. Run and verify
-- 6. Repeat for other needed features
```

### Step 3: Verify Installation

1. **Check Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Verify RLS Policies**
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Test Basic Functionality**
   ```sql
   -- Test inserting a sample client (replace with your user ID)
   INSERT INTO clients (name, email, user_id) 
   VALUES ('Test Client', 'test@example.com', auth.uid());
   ```

### Step 4: Configure Application

1. **Update Environment Variables**
   - Ensure your app has correct Supabase credentials
   - Test database connection

2. **Run Application**
   - Start your Next.js application
   - Test each feature to ensure database connectivity

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Automatic user isolation

### Data Protection
- Foreign key constraints maintain data integrity
- Check constraints prevent invalid data
- Automatic timestamp tracking

## 📈 Performance Optimizations

### Indexes Created
- User ID indexes on all tables
- Date range indexes for time-based queries
- Foreign key indexes for joins
- Composite indexes for complex queries

### Triggers
- Automatic `updated_at` timestamp updates
- Next recurring date calculations
- Data validation triggers

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   Error: permission denied for table clients
   ```
   **Solution:** Ensure RLS policies are created and user is authenticated

2. **Table Already Exists**
   ```
   Error: relation "clients" already exists
   ```
   **Solution:** Use migration scripts instead of complete setup

3. **Foreign Key Constraint**
   ```
   Error: insert or update on table violates foreign key constraint
   ```
   **Solution:** Ensure referenced records exist first

### Verification Queries

```sql
-- Check all tables exist
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 19 for complete installation

-- Check RLS is enabled
SELECT COUNT(*) as rls_enabled_tables
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
AND c.relrowsecurity = true;
-- Should return 19 for complete installation

-- Check indexes exist
SELECT COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public';
-- Should be > 25 for complete installation
```

## 🔄 Migration Path Examples

### Adding Recurring Invoices to Existing Setup
```sql
-- Run this if you only want recurring invoice features
-- From database-migration-scripts.sql:

-- MIGRATION 1: ADD RECURRING INVOICE FEATURES
CREATE TABLE IF NOT EXISTS recurring_invoice_templates (...);
CREATE TABLE IF NOT EXISTS recurring_invoice_history (...);
-- ... rest of migration 1
```

### Adding All Recurring Features
```sql
-- Run migrations 1-4 from database-migration-scripts.sql:
-- MIGRATION 1: ADD RECURRING INVOICE FEATURES
-- MIGRATION 2: ADD SUBSCRIPTION MANAGEMENT  
-- MIGRATION 3: ADD RECURRING INCOME TRACKING
-- MIGRATION 4: ADD PAYMENT REMINDERS & NOTIFICATIONS
```

### Adding Budgeting Features
```sql
-- Run migration 5 from database-migration-scripts.sql:
-- MIGRATION 5: ADD BUDGETING FEATURES
```

## 📞 Support

If you encounter issues:

1. **Check the error message** - Most errors are self-explanatory
2. **Verify prerequisites** - Ensure Supabase project is set up correctly
3. **Test incrementally** - Add one feature at a time
4. **Check existing data** - Ensure no conflicts with current schema

## 🎯 Next Steps

After successful database setup:

1. **Test Application Features**
   - Create sample clients, projects, invoices
   - Test recurring features
   - Verify budgeting functionality

2. **Configure Notifications**
   - Set up email/SMS providers
   - Test reminder systems

3. **Import Existing Data** (if applicable)
   - Use CSV import or custom scripts
   - Verify data integrity after import

4. **Set Up Backups**
   - Configure automatic backups
   - Test restore procedures

---

**🎉 Congratulations!** Your Quantumnexa Finance App database is now ready for production use!