import { supabase } from './supabase'

export async function createTablesManually() {
  try {
    console.log('Creating tables manually...')

    // 1. Najpierw sprawdź czy tabele już istnieją
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    console.log('Existing tables:', existingTables)

    // 2. Spróbuj stworzyć tabelę testową
    const testQuery = `
      CREATE TABLE IF NOT EXISTS public.test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

    console.log('Trying to create test table...')
    
    // Użyj prostego zapytania SQL
    const { error: testError } = await supabase.rpc('sql', { query: testQuery })
    
    if (testError) {
      console.error('Test table creation failed:', testError)
    } else {
      console.log('Test table created successfully!')
    }

    // 3. Sprawdź tabele ponownie
    const { data: newTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    return { 
      success: true, 
      message: 'Tables operation completed',
      before: existingTables?.length || 0,
      after: newTables?.length || 0,
      tables: newTables
    }

  } catch (err: any) {
    console.error('Error in createTablesManually:', err)
    return { success: false, error: err.message }
  }
}

export async function insertTestProfile() {
  try {
    // Spróbuj wstawić dane do tabeli profiles
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User'
      })
      .select()

    if (error) {
      console.error('Insert test profile failed:', error)
      return { success: false, error: error.message }
    }

    console.log('Test profile inserted:', data)
    return { success: true, data }

  } catch (err: any) {
    console.error('Error inserting test profile:', err)
    return { success: false, error: err.message }
  }
}

export async function checkAuthUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      user,
      isAuthenticated: !!user,
      userId: user?.id
    }

  } catch (err: any) {
    return { success: false, error: err.message }
  }
} 