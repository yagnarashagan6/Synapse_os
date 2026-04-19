// Quick test: insert a dummy embedding as plain array and then delete it
require("dotenv").config();
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function testEmbedInsert() {
  console.log("=== Testing Embedding Insert ===\n");

  // 1. Generate a real embedding
  console.log("1. Generating embedding via OpenAI...");
  const embedRes = await axios.post(
    "https://api.openai.com/v1/embeddings",
    { input: "Hello world, this is a test chunk.", model: "text-embedding-ada-002" },
    { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
  );
  const embedding = embedRes.data.data[0].embedding;
  console.log(`   Embedding length: ${embedding.length}, type: ${typeof embedding}, isArray: ${Array.isArray(embedding)}`);

  // 2. Insert as plain array (the fix)
  console.log("\n2. Inserting into documents table (plain array)...");
  const { data, error } = await supabase.from("documents").insert([{
    content: "TEST CHUNK - Hello world, this is a test chunk.",
    metadata: { file_id: "test_embed_fix", file_name: "test.pdf" },
    embedding: embedding, // ← plain array, not JSON.stringify
  }]).select("id, content");

  if (error) {
    console.error("❌ Insert FAILED:", error);
    return;
  }
  console.log("✅ Insert SUCCESS! Row id:", data[0].id);

  // 3. Test vector search
  console.log("\n3. Testing match_documents RPC...");
  const { data: matches, error: matchErr } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 3,
  });
  if (matchErr) {
    console.error("❌ match_documents failed:", matchErr);
  } else {
    console.log(`✅ match_documents returned ${matches.length} results`);
    if (matches[0]) console.log("   Best match similarity:", matches[0].similarity);
  }

  // 4. Clean up test row
  const { error: delErr } = await supabase.from("documents").delete().eq("id", data[0].id);
  if (delErr) {
    console.warn("⚠️  Cleanup failed (you may need to manually delete row id:", data[0].id, ")");
  } else {
    console.log("\n4. Cleaned up test row ✓");
  }

  console.log("\n=== Test COMPLETE ===");
}

testEmbedInsert().catch(console.error);
