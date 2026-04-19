require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  console.log("1. Testing documents table...");
  const { data, error } = await supabase.from("documents").select("id, metadata").limit(5);
  if (error) {
    console.error("❌ documents table error:", error.message, "(code:", error.code + ")");
    if (error.code === "42P01") {
      console.log("\n⚠️  TABLE MISSING! Please run rag_setup.sql in Supabase SQL Editor:");
      console.log("   https://supabase.com/dashboard/project/jnkaaxcldsffpojyhufq/sql/new\n");
    }
  } else {
    console.log(`✅ documents table exists — ${data.length} row(s) found`);
    if (data.length > 0) {
      console.log("   Sample metadata:", JSON.stringify(data[0].metadata));
    }
  }

  console.log("\n2. Testing match_documents function...");
  const { data: fnData, error: fnError } = await supabase.rpc("match_documents", {
    query_embedding: Array(1536).fill(0.01),
    match_count: 1
  });
  if (fnError) {
    console.error("❌ match_documents function error:", fnError.message, "(code:", fnError.code + ")");
    if (fnError.code === "42883") {
      console.log("\n⚠️  FUNCTION MISSING! Please run rag_setup.sql in Supabase SQL Editor");
    }
  } else {
    console.log(`✅ match_documents function works — ${fnData.length} result(s)`);
  }
}

test().catch(console.error);
