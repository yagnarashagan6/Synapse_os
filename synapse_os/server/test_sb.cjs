require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function t() {
  const { data } = supabase.storage.from("synapse_assets").getPublicUrl("elevenlabs/1739063884841.mp3");
  console.log(data);
}
t();
