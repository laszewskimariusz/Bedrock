import { supabase } from './supabase'

export async function testDatabaseConnection() {
  try {
    // Test basic connection by trying to access auth user (always works if connected)
    const { data: session, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('Database auth connection test failed:', authError.message)
      return { success: false, error: authError.message }
    }

    // Try to access some basic tables to see what exists
    const tableTests = ['profiles', 'workspaces', 'pages']
    const existingTables = []
    
    for (const tableName of tableTests) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          existingTables.push({ table_name: tableName })
        }
      } catch (err) {
        // Table doesn't exist or access denied - expected
      }
    }

    console.log('Database connection successful!')
    console.log('Available application tables:', existingTables)
    return { 
      success: true, 
      data: existingTables, 
      tables: existingTables,
      message: `Connection successful. Found ${existingTables.length} application tables.`
    }
  } catch (err: any) {
    console.log('Database connection test error:', err.message)
    return { success: false, error: err.message }
  }
}

export async function createAppTables() {
  try {
    console.log('Checking for app tables...')
    
    // Test czy tabele już istnieją poprzez próbę dostępu
    const tableTests = ['profiles', 'workspaces', 'pages']
    const existingTables: string[] = []
    
    for (const tableName of tableTests) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          existingTables.push(tableName)
        }
      } catch (err) {
        // Table doesn't exist - expected
      }
    }
    
    console.log('Existing application tables:', existingTables)
    
    if (existingTables.length === 3) {
      console.log('All tables already exist!')
      return { 
        success: true, 
        message: `All application tables exist: ${existingTables.join(', ')}` 
      }
    }
    
    console.log('Some tables are missing. Please create them manually in Supabase dashboard.')
    return { 
      success: false, 
      error: `Missing tables: ${tableTests.filter(t => !existingTables.includes(t)).join(', ')}. Please run the SQL scripts in Supabase dashboard.`,
      sql: getSQLScript(),
      existingTables,
      missingTables: tableTests.filter(t => !existingTables.includes(t))
    }
  } catch (err: any) {
    console.error('Error checking tables:', err.message)
    return { success: false, error: err.message }
  }
}

function getSQLScript(): string {
  return `
-- Stwórz tabelę profili użytkowników
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Włącz RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Polityki bezpieczeństwa dla profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Stwórz tabelę workspace'ów
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Włącz RLS dla workspace'ów
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Polityki dla workspace'ów
CREATE POLICY "Users can view own workspaces" ON public.workspaces 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create workspaces" ON public.workspaces 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Stwórz tabelę stron (jak w Notion)
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '{}',
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Włącz RLS dla stron
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Polityki dla stron
CREATE POLICY "Users can view pages in their workspaces" ON public.pages 
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create pages in their workspaces" ON public.pages 
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );
`
}

export async function testSupabaseAuth() {
  try {
    // Test auth service
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log('Supabase auth test failed:', error.message)
      return { success: false, error: error.message }
    }

    console.log('Supabase auth service working!')
    return { success: true, session: data.session }
  } catch (err: any) {
    console.log('Supabase auth test error:', err.message)
    return { success: false, error: err.message }
  }
} 