# Quantumnexa Finance App — User Manual

This manual explains the complete feature set, day‑to‑day workflows, exports, and the database/setup requirements of the Quantumnexa Finance App.

## Contents
- Getting Started
- Navigation Overview
- Core Modules
- Employee & Payroll Modules
- Financial Planning Modules
- Recurring Modules
- Reports Modules
- Exports (PDF / Excel)
- Database & Setup Reference
- Troubleshooting

---

## Getting Started

### What this product is
Quantumnexa Finance App is a multi‑module finance dashboard for managing:
- Clients, projects, invoices and payments
- Expenses and budgets
- Accounts and account transactions
- Employees and payroll (calculation, history, reports)
- Recurring income, subscriptions, recurring invoices, reminders
- Analytics: reports, profit & loss, cash flow, tax reporting, business metrics

### Login / Accounts
- Authentication uses Supabase Auth (email/password).
- Most pages require login; if not logged in you are redirected to `/login`.

### First-time setup checklist
1. Configure environment variables for Supabase.
2. Install dependencies.
3. Apply database schema SQL in Supabase.
4. Start the development server.

See:
- [README.md](file:///d:/quantumnexa-finance-app/README.md)
- [database-setup-guide.md](file:///d:/quantumnexa-finance-app/database-setup-guide.md)
- [complete-database-setup.sql](file:///d:/quantumnexa-finance-app/complete-database-setup.sql)

---

## Navigation Overview

The left sidebar groups features into categories:

### Core Features
- Dashboard
- Clients
- Projects
- Invoices
- Expenses

### Employee Payroll
- Employees
- Payroll
- Payroll Reports
- Payroll History

### Financial Management
- Accounts
- Budgets
- Savings
- Budget Comparison
- Budget Alerts

### Recurring Features
- Subscriptions
- Recurring Income
- Payment Reminders
- Recurring Invoices

### Advanced Reports
- Reports
- Profit & Loss
- Cash Flow
- Tax Reports
- Business Metrics

### Settings
- Settings

---

## Core Modules

## Dashboard
Location: `/dashboard`

Purpose:
- Quick overview of revenue, expenses, balances, clients/projects, and recent activity.

Typical actions:
- Review key stats cards and charts.
- Use quick navigation links to modules (invoices/expenses/projects, etc.).

Data sources:
- invoices, payments, expenses, projects, clients
- budgets, budget_items, savings_goals, savings_transactions, budget_alerts

## Clients
Location: `/clients`

What you can do:
- Add a client (name, email, phone, company, address, status)
- Search and filter clients
- Edit and delete clients

Client Detail
Location: `/clients/[id]`
- View client information
- View related projects
- View related invoices
- View payment history
- Download a PDF summary (client report)

Important relationships:
- `projects.client_id` links projects to a client
- `invoices.client_id` links invoices to a client
- `payments.invoice_id` links payments to invoices

## Projects
Location: `/projects`

What you can do:
- Create projects linked to clients
- Track status (active/completed/on_hold/cancelled)
- Store budget, start/end dates, and notes
- Filter/search by name/status

## Invoices
Location: `/invoices`

What you can do:
- Create and manage invoices with status lifecycle:
  - draft → sent → paid / overdue / cancelled
- Link invoice to a client and (optionally) a project
- Track total amount and due dates

Invoice Detail
Location: `/invoices/[id]`
- View invoice details
- Record payments
- Download invoice PDF

Invoice Edit
Location: `/invoices/[id]/edit`
- Edit invoice details, amounts, and references

## Expenses
Location: `/expenses`

What you can do:
- Add and categorize expenses
- Filter/search expenses and view analytics

Expense Detail
Location: `/expenses/[id]`
- View expense details
- Receipt actions (if configured)

Notes:
- Payroll payments can generate an expense entry (category “Payroll”) when marking payroll as Paid.

---

## Employee & Payroll Modules

## Employees
Location: `/employees`

What you can do:
- Add employees (employee code, personal/contact, job details, salary, status)
- Edit and delete employees
- Filter by department and status
- Search by name/email/employee code
- Use the View (eye) icon to open employee detail

Employee Detail
Location: `/employees/[id]`

Shows:
- Employee profile (department, position, hire date, salary, etc.)
- Payroll summary:
  - Paid this month
  - Total paid
  - Pending processed payroll count/amount
  - Last paid date
- Monthly paid (last 6 months)
- Recent payrolls list with link to payroll detail page

## Payroll
Location: `/payroll`

What you can do:
- See payroll records across employees
- Filter by status and department
- Open a payroll record to view details and actions

Payroll Calculate
Location: `/payroll/calculate`
- Select employees to calculate payroll for a pay period
- Save generated payroll + payroll items

Payroll Detail
Location: `/payroll/[id]`

Key statuses used by the app:
- draft: created but not processed
- processed: calculated/confirmed (ready to pay)
- paid: marked paid (creates expense and optionally account transaction)

Common actions:
- Process payroll (draft → processed)
- Mark Paid (processed → paid)
  - Select “pay from” account
  - Creates/ensures a Payroll expense entry
  - Debits account balance and logs account transaction (if `account_transactions` exists)
- Reverse (paid → processed)
  - Restores the account balance and removes payroll expense
- Delete payroll
  - Optionally restores balance (when paid) then deletes payroll row

## Payroll History
Location: `/payroll/history`
- Table shows: employee name + employee id, department, pay period, gross pay, net pay, status, actions
- “View details” modal shows full breakdown and can download pay stub PDF

Pay Stub PDF
- Generated from the history modal and downloaded as PDF.

## Payroll Reports
Location: `/payroll/reports`
- Report types: summary, department, trends, taxes, deductions
- Exports:
  - PDF export (clean white PDF layout)
  - Excel export (CSV download)

---

## Financial Planning Modules

## Accounts
Location: `/accounts`

What you can do:
- Create accounts (bank/cash/credit/savings/investment)
- Track balances and account status (active/inactive)
- Add account transactions (credit/debit) with dates and references

Account Detail
Location: `/accounts/[id]`
- View account balance and transaction history
- Add transactions and toggle active status

Payroll integration:
- When payroll is marked Paid, the app can debit the selected account and create an `account_transactions` record.

## Budgets
Location: `/budgets`
- Create budgets for time periods
- Allocate budget items by category
- Track utilization
- Add savings goals from the same area

## Savings
Location: `/savings`
- Create savings goals
- Record savings transactions against goals

## Budget Comparison
Location: `/budget-comparison`
- Compare budget vs actual expenses for a selected period

## Budget Alerts
Location: `/budget-alerts`
- Configure alert settings
- View budget alerts and status

---

## Recurring Modules

## Subscriptions
Location: `/subscriptions`
- Track recurring subscription expenses
- Manage subscription status and renewals

## Recurring Income
Location: `/recurring-income`
- Track repeating income sources
- Manage schedules and receipts history

## Payment Reminders
Location: `/payment-reminders`
- Track and manage reminders for due invoices/payments
- Manage reminder settings and templates (where configured)

## Recurring Invoices
Location: `/recurring-invoices`
- Create recurring invoice templates
- Track generated invoices history

---

## Reports Modules

## Reports
Location: `/reports`
- General reporting module built from payments + expenses
- Supports time‑range filters and breakdown views

## Profit & Loss
Location: `/profit-loss`
- Builds P&L from payments (income) and expenses
- Supports date ranges and summaries

## Cash Flow
Location: `/cash-flow`
- Inflows from payments, outflows from expenses
- Supports last 3/6/12 months, YTD, custom ranges

## Tax Reports
Location: `/tax-reports`
- Tax‑oriented summaries based on invoices and expenses

## Business Metrics
Location: `/business-metrics`
- KPI panels and operational metrics (revenue, expenses, ratios)
- Supports quick date presets and custom range

## Activity
Location: `/activity`
- Aggregates recent invoices, expenses, payments into a unified activity stream

---

## Exports (PDF / Excel)

### PDF Export
Used by:
- Invoices (download invoice PDF)
- Payroll history (download pay stub PDF)
- Payroll reports (export report PDF)
- Some client reporting (client detail page)

How PDF works
- For many exports, the app uses a DOM “print layout” and captures it via `html2canvas`, then writes to PDF via `jspdf`.
- In reports, the PDF uses a clean white layout so it prints well.

### Excel Export
Used by:
- Payroll reports export “Excel”

Important:
- “Excel export” downloads a CSV file. Excel can open it directly.

---

## Database & Setup Reference

### Required environment variables
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Recommended schema setup
For a new database, use:
- [complete-database-setup.sql](file:///d:/quantumnexa-finance-app/complete-database-setup.sql)

If adding features on an existing database:
- [database-migration-scripts.sql](file:///d:/quantumnexa-finance-app/database-migration-scripts.sql)

### Key tables used by the app
Core:
- clients, projects, invoices, payments, expenses

Payroll/HR:
- employees, payroll, payroll_items

Accounts:
- accounts, account_transactions

Budgets/Savings:
- budget_categories, budgets, budget_items, savings_goals, savings_transactions, budget_alerts

Recurring:
- subscriptions, subscription_payments
- recurring_income, recurring_income_history
- recurring_invoice_templates, recurring_invoice_history
- payment_reminders, notification_settings, recurring_categories

Settings:
- profiles (for user settings)

### Row Level Security (RLS)
The app expects user data isolation by `user_id` in most tables.
- Recommended: enable RLS and allow users to access only their rows.
- If you disable RLS, ensure your UI and queries still filter correctly by `user_id`.

---

## Troubleshooting

### “Supabase client is not initialized”
Cause:
- Missing or invalid environment variables.
Fix:
- Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, restart dev server.

### “relation does not exist” / “could not find table”
Cause:
- Missing table in Supabase schema.
Fix:
- Apply the SQL schema files and confirm the table exists.

### “new row violates row-level security policy”
Cause:
- RLS enabled but policies missing/incorrect.
Fix:
- Apply RLS policies in the provided SQL setup scripts or temporarily disable RLS for that table.

### Payroll reverse/delete issues
Common causes:
- Missing `account_transactions` table
- Missing/old payroll `payment_reference`
- RLS blocking `accounts` or `expenses`

Fix:
- Apply the payroll/accounts SQL setup or use the complete schema.

