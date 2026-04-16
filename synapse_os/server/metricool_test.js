#!/usr/bin/env node

// Metricool Test Script - Quick debugging tool
// Usage: node metricool_test.js

const axios = require("axios");

const METRICOOL_API_KEY =
  "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";
const API_BASE = "http://localhost:5000";
const METRICOOL_API = "https://app.metricool.com/api/v2";

// Test data
const testData = {
  handleName: "digimabbleproduct", // Your Instagram handle
  accountIdToFind: null, // You'll fill this in or find it from Metricool
  videoUrl: "https://example.com/test-video.mp4", // Replace with real URL
  caption: "🚀 Test post from Synapse OS - #metricool #api",
};

console.log("\\n========================================");
console.log("  Metricool Integration Tester");
console.log("========================================\\n");

// Test 1: Check if backend is running
async function testBackendHealth() {
  console.log("\\n1️⃣  Testing Backend Health...");
  try {
    const res = await axios.get(`${API_BASE}/api/health`, {
      timeout: 5000,
    });
    console.log("   ✅ Backend is running!");
    return true;
  } catch (err) {
    console.error(
      "   ❌ Backend is NOT running. Start it with: npm start (in server/)",
    );
    return false;
  }
}

// Test 2: Fetch connected accounts from Metricool
async function testFetchAccounts() {
  console.log("\\n2️⃣  Fetching Connected Accounts from Metricool...");
  try {
    const res = await axios.get(`${API_BASE}/api/sharing/metricool/accounts`, {
      timeout: 10000,
    });

    if (res.data.accounts && res.data.accounts.length > 0) {
      console.log(`   ✅ Found ${res.data.accounts.length} account(s):`);
      res.data.accounts.forEach((acc, i) => {
        console.log(`      ${i + 1}. ID: ${acc.id} | Name: ${acc.name}`);
        console.log(
          `         Platform: ${acc.platform} | Handle: ${acc.handle}`,
        );
      });
      return res.data.accounts;
    } else {
      console.warn("   ⚠️  No connected accounts found in Metricool.");
      console.warn("      → Go to https://app.metricool.com/settings");
      console.warn("      → Connect your Instagram account");
      return [];
    }
  } catch (err) {
    console.error("   ❌ Error fetching accounts:");
    console.error(
      "     ",
      err.response?.data?.message || err.response?.data || err.message,
    );
    return [];
  }
}

// Test 3: Attempt to post (requires Account ID)
async function testPostMetricool(accountId) {
  if (!accountId) {
    console.log("\\n3️⃣  Skipping Post Test (No Account ID provided)");
    return;
  }

  console.log("\\n3️⃣  Testing Post to Metricool...");
  console.log(`   Using Account ID: ${accountId}`);

  try {
    const payload = {
      video_url: testData.videoUrl,
      text: testData.caption,
      platform: "instagram",
      handle: testData.handleName,
      accountId: accountId,
    };

    console.log("   Payload:", JSON.stringify(payload, null, 2));

    const res = await axios.post(`${API_BASE}/api/sharing/metricool`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    console.log("   ✅ Post successful!");
    console.log("   Response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("   ❌ Post failed:");
    const errorData = err.response?.data || {};
    console.error("     Error:", errorData.error);
    console.error("     Message:", errorData.message);
    console.error("     Details:", errorData.details);
    console.error("     Recommendation:", errorData.recommendation);
  }
}

// Test 4: Direct Metricool API health check
async function testMetricoolAPI() {
  console.log("\\n4️⃣  Testing Metricool API Connection...");
  try {
    const res = await axios.get(`${METRICOOL_API}/accounts`, {
      headers: {
        "X-Mc-Auth": METRICOOL_API_KEY,
      },
      timeout: 10000,
    });

    console.log("   ✅ Metricool API is accessible!");
    console.log(`   Your API Key is valid ✓`);
    return true;
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.error("   ❌ API Key is INVALID or EXPIRED");
    } else {
      console.error("   ❌ Cannot reach Metricool API");
      console.error("     ", err.message);
    }
    return false;
  }
}

// Main runner
async function runTests() {
  console.log("Running Metricool integration tests...");
  console.log(`API Base: ${API_BASE}`);
  console.log(`Metricool API: ${METRICOOL_API}`);

  const backendRunning = await testBackendHealth();
  if (!backendRunning) return;

  await testMetricoolAPI();

  const accounts = await testFetchAccounts();

  if (accounts && accounts.length > 0) {
    const instagramAccount = accounts.find((a) => a.platform === "instagram");
    if (instagramAccount) {
      console.log(
        `\\n\\n🎯 Using Instagram Account: ${instagramAccount.name} (ID: ${instagramAccount.id})`,
      );
      await testPostMetricool(instagramAccount.id);
    }
  }

  console.log("\\n========================================");
  console.log("  Test Summary");
  console.log("========================================");
  console.log(
    "\\n📝 Next Steps:",
    "\\n  1. If tests pass, go back to Approvals page",
    "\\n  2. Select content, generate description",
    "\\n  3. Check Instagram platform",
    "\\n  4. Click 'Share via Metricool'",
    "\\n  5. Check console for success/error messages",
  );
  console.log(
    "\\n🔗 References:",
    "\\n  - Metricool: https://app.metricool.com/",
    "\\n  - Account ID Lookup: See METRICOOL_ACCOUNT_ID_LOOKUP.md",
  );
  console.log("\\n========================================\\n");
}

runTests().catch(console.error);
