require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE config");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIcons() {
  console.log("Fetching videos to fix...");
  const { data, error } = await supabase
    .from('generated_videos')
    .select('*')
    .eq('platform', 'Unknown');

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Found ${data.length} videos with Unknown platform.`);

  for (const video of data) {
    const { error: updateError } = await supabase
      .from('generated_videos')
      .update({ platform: 'instagram' }) // Default to instagram so it shows an icon
      .eq('id', video.id);

    if (updateError) {
      console.error(`Failed to update video ${video.id}:`, updateError);
    } else {
      console.log(`Updated video ${video.id} to instagram`);
    }
  }
  
  console.log("Done fixing icons.");
}

fixIcons();
