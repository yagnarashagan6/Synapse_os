require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanup() {
  console.log("Cleaning up corrupted documents from Supabase...");
  
  // Delete all documents (they all have garbled text from the broken extractor)
  const { error: docErr, count } = await supabase.from("documents").delete().neq("id", 0);
  if (docErr) {
    console.error("Error deleting documents:", docErr);
  } else {
    console.log("✅ All documents cleared from vector store");
  }

  // Also reset any 'failed' or 'active' knowledge_base_files back to allow re-upload
  const { data: files } = await supabase.from("knowledge_base_files").select("id, file_name, status");
  console.log("\nExisting knowledge_base_files:");
  for (const f of (files || [])) {
    console.log(` - ${f.file_name}: ${f.status}`);
  }
}

cleanup().catch(console.error);
