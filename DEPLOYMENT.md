# Deployment Guide for Recruit360

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and give it a name (e.g., "recruit360")
3. Choose a strong database password and save it somewhere safe
4. Select a region close to your users
5. Wait for the project to be created

## Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql` and paste it into the editor
3. Click **Run** to create the tables

## Step 3: Import College Data

1. In the SQL Editor, create a new query
2. Copy the contents of `supabase/seed.sql` and paste it
3. Click **Run** to import all colleges and coaches
   - This may take a moment as it inserts 451 colleges and ~1000+ coaches

## Step 4: Get Your API Keys

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 5: Local Testing

1. Create a `.env.local` file in your project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 to verify it works

## Step 6: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up/log in
3. Click "Add New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Option B: Deploy via CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard or via CLI:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### "Failed to fetch colleges" error
- Check that your Supabase URL and anon key are correct
- Verify the RLS policies are set up (run schema.sql again if needed)
- Check Supabase dashboard > Logs for errors

### No data showing
- Make sure you ran the seed.sql file
- Check Supabase Table Editor to verify data exists

### Map not loading
- This is usually a client-side hydration issue
- Try a hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## Updating Data

To update college data in the future:

1. Go to Supabase > Table Editor
2. Edit colleges or coaches directly
3. Or use the SQL Editor for bulk updates

## Security Notes

- The `anon` key is safe to expose in client-side code
- Row Level Security (RLS) is enabled with read-only public access
- To add write capabilities, you'll need to set up authentication
