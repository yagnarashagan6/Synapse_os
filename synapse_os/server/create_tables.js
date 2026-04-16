// Script to create all Supabase tables for Synapse OS
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createTables() {
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  console.log('Testing connection...');

  // Test connection first
  const { data: testData, error: testError } = await supabase.from('user_profiles').select('count').limit(1);
  if (testError && testError.code !== '42P01') {
    console.log('Connection test result:', testError.message);
  } else {
    console.log('Connection OK');
  }

  // Test if tables exist by trying to query each one
  const tables = ['user_profiles', 'competitors', 'linkedin_competitors', 'generated_videos', 'knowledge_base_files'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table "${table}" does NOT exist - needs to be created`);
      } else {
        console.log(`⚠️  Table "${table}" error: ${error.message} (code: ${error.code})`);
      }
    } else {
      console.log(`✅ Table "${table}" exists (${data.length} rows returned)`);
    }
  }

  console.log('\n--- If any tables are missing, please run the SQL from the schema guide in the Supabase SQL Editor ---');
  console.log('Dashboard: https://supabase.com/dashboard/project/jnkaaxcldsffpojyhufq/sql/new');
}

createTables().catch(console.error);
