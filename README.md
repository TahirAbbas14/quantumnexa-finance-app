# Quantumnexa Finance App

A comprehensive financial management application built with Next.js, TypeScript, and Supabase.

## Features

- 🔐 **Authentication System** - User registration and login with Supabase Auth
- 📊 **Dashboard & Analytics** - Financial overview with key metrics and charts
- 👥 **Client Management** - Add, edit, and manage clients
- 📋 **Project Management** - Create and track projects linked to clients
- 🧾 **Invoice System** - Generate and manage professional invoices
- 💰 **Expense Tracking** - Categorized expense management with analytics
- 📈 **Financial Reports** - Comprehensive analytics and reporting
- ⚙️ **Settings & Profile** - User profile and application preferences

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **UI Components**: Lucide React icons, Recharts for analytics
- **Styling**: Tailwind CSS with custom components

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd quantumnexa-finance-app
npm install
```

### 2. Set up Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

Update the `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set up Database Schema

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of supabase-schema.sql and run it in Supabase SQL Editor
```

The schema includes tables for:
- Users (handled by Supabase Auth)
- Clients
- Projects
- Invoices
- Expenses
- Payments

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── clients/           # Client management
│   ├── dashboard/         # Main dashboard
│   ├── expenses/          # Expense tracking
│   ├── invoices/          # Invoice management
│   ├── projects/          # Project management
│   ├── reports/           # Financial reports
│   └── settings/          # User settings
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── layout/           # Layout components
├── contexts/             # React contexts
└── lib/                  # Utilities and configurations
```

## Key Features Explained

### Authentication
- Secure user registration and login
- Protected routes with middleware
- Session management with Supabase Auth

### Dashboard
- Financial overview with key metrics
- Interactive charts showing revenue vs expenses
- Recent invoices and quick actions

### Client Management
- Add and manage client information
- Search and filter clients
- Link clients to projects and invoices

### Invoice System
- Generate professional invoices
- Track invoice status (Draft, Sent, Paid, Overdue)
- Payment tracking and history

### Expense Tracking
- Categorized expense management
- Monthly and yearly analytics
- Receipt upload and management

### Reports & Analytics
- Comprehensive financial reports
- Profit/loss analysis
- Client revenue breakdown
- Customizable date ranges

## Troubleshooting

### Common Issues

1. **Supabase URL Error**: Make sure your `.env.local` file has valid Supabase credentials
2. **Database Connection**: Ensure your Supabase project is active and the schema is properly set up
3. **Authentication Issues**: Check that Supabase Auth is enabled in your project settings

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure all environment variables are properly set
4. Check that the database schema has been applied

## License

This project is licensed under the MIT License.
