# Supabase Database Setup

To make the **Civic Voice Platform** work, you need to create a table in your Supabase project.

## 1. Create the `posts` table
Run the following SQL in the Supabase **SQL Editor**:

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null, -- 'Complaint', 'Suggestion', 'Appreciation'
  name text,
  constituency text not null,
  subject text not null,
  body text not null,
  upvotes integer default 0
);

-- Enable Row Level Security (optional but recommended)
alter table posts enable row level security;

-- Create a policy that allows anyone to read posts
create policy "Allow public read access"
  on posts for select
  using (true);

-- Create a policy that allows anyone to insert posts
create policy "Allow public insert access"
  on posts for insert
  with check (true);
```

## 2. Environment Variables
1. Copy the **Project URL** and **Anon Key** from your Supabase Project Settings (**Settings > API**).
2. Create a `.env` file in the root of your project:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## 3. Run the App
Run the development server:
```bash
npm run dev
```
