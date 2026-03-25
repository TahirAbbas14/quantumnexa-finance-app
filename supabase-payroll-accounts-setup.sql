CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'cash', 'credit', 'savings', 'investment')),
  balance numeric(15,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'PKR',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON public.accounts(is_active);

CREATE TABLE IF NOT EXISTS public.account_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric(15,2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  reference text,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_transactions_user_id ON public.account_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_account_id ON public.account_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON public.account_transactions(date);
CREATE INDEX IF NOT EXISTS idx_account_transactions_reference ON public.account_transactions(reference);

ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transactions DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS payment_reference varchar(100);

ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS payment_method varchar(20),
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'PKR',
ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_notes ON public.expenses(notes);
