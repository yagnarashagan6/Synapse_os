require("dotenv").config();
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function debugChat() {
  console.log("=== Debugging RAG Chat ===\n");

  // 1. Check documents in DB
  const { data: docs } = await supabase.from("documents").select("id, content, metadata").limit(3);
  console.log("Documents in DB:", docs?.length);
  if (docs?.[0]) {
    console.log("Sample content (first 200 chars):", docs[0].content?.slice(0, 200));
    console.log("Sample metadata:", docs[0].metadata);
    console.log("Has embedding column:", "embedding" in docs[0] ? "yes" : "NOT in select");
  }

  // 2. Check if embedding is actually stored
  const { data: docsWithEmbed } = await supabase.from("documents").select("id, embedding").limit(1);
  if (docsWithEmbed?.[0]) {
    const emb = docsWithEmbed[0].embedding;
    console.log("\nEmbedding type:", typeof emb);
    if (typeof emb === "string") {
      try {
        const parsed = JSON.parse(emb);
        console.log("Embedding is JSON string, length:", parsed.length);
      } catch {
        console.log("Embedding raw (first 100 chars):", emb?.slice(0, 100));
      }
    } else if (Array.isArray(emb)) {
      console.log("Embedding is array, length:", emb.length);
    } else {
      console.log("Embedding value:", emb);
    }
  }

  // 3. Generate query embedding
  console.log("\nGenerating query embedding for 'What is OOP?'...");
  const embedRes = await axios.post(
    "https://api.openai.com/v1/embeddings",
    { input: "What is OOP?", model: "text-embedding-ada-002" },
    { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
  );
  const queryEmbedding = embedRes.data.data[0].embedding;
  console.log("Query embedding length:", queryEmbedding.length);

  // 4. Try match_documents directly
  console.log("\nCalling match_documents...");
  const { data: matches, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 5
  });
  
  if (error) {
    console.error("❌ match_documents error:", error);
  } else {
    console.log("Matches returned:", matches?.length);
    if (matches?.[0]) {
      console.log("Best match similarity:", matches[0].similarity);
      console.log("Best match content (first 300 chars):", matches[0].content?.slice(0, 300));
    }
  }
}

debugChat().catch(console.error);
