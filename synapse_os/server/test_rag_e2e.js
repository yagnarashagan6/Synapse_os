require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const API_URL = "http://localhost:5000";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testUploadAndChat() {
  const pdfPath = "C:\\Users\\HP\\Downloads\\Python-OOP.pdf";
  
  if (!fs.existsSync(pdfPath)) {
    console.error("PDF not found at:", pdfPath);
    return;
  }

  console.log("=== RAG Full E2E Test with Real PDF ===\n");
  console.log("PDF:", pdfPath, `(${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB)\n`);

  // Step 1: Upload real PDF
  console.log("Step 1: Uploading Python-OOP.pdf...");
  const form = new FormData();
  form.append("file", fs.createReadStream(pdfPath), {
    filename: "Python-OOP.pdf",
    contentType: "application/pdf"
  });
  form.append("file_type", "document");

  let recordId;
  try {
    const uploadRes = await axios.post(`${API_URL}/api/knowledge-base/upload`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log("✅ Upload accepted:", uploadRes.data.message);
    recordId = uploadRes.data.item?.id;
    console.log("   Record ID:", recordId);
    console.log("   Status: processing\n");
  } catch (err) {
    console.error("❌ Upload failed:", err.response?.data || err.message);
    return;
  }

  // Step 2: Wait for background processing
  console.log("Waiting 30s for PDF parsing + embedding...");
  let status = "processing";
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const { data: files } = await supabase.from("knowledge_base_files").select("status").eq("id", recordId).single();
    status = files?.status || "unknown";
    process.stdout.write(`\r  Status: ${status} (${(i+1)*5}s elapsed)`);
    if (status !== "processing") break;
  }
  console.log(`\n\nFinal status: ${status}`);

  // Step 3: Count vectors in documents table
  const { data: docs, count } = await supabase.from("documents").select("id", { count: "exact" });
  console.log("Vectors stored in documents table:", docs?.length || 0);

  if (status !== "active") {
    console.log("\n⚠️  Ingestion failed or timed out. Checking server logs for errors...");
    return;
  }

  // Step 4: Test RAG chat
  console.log("\nStep 3: Testing chat query — 'What is OOP?'");
  try {
    const chatRes = await axios.post(`${API_URL}/api/knowledge-base/chat`, {
      message: "What is object-oriented programming and what are its 4 pillars?"
    });
    console.log(`✅ Context chunks fetched: ${chatRes.data.contextFetched}`);
    console.log("\n📝 AI Reply:\n");
    console.log(chatRes.data.reply);
  } catch (err) {
    console.error("❌ Chat error:", err.response?.data || err.message);
  }
}

testUploadAndChat().catch(console.error);
