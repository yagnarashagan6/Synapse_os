const axios = require('axios');
const METRICOOL_API_KEY = "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";
const BLOG_ID = 5740224;

async function testMetricool() {
  try {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Test 1: Instagram totals/summary?
    try {
      const res1 = await axios.get(`https://app.metricool.com/api/v2/analytics/social-networks/instagram?blogId=${BLOG_ID}&from=${start}&to=${end}`, {
        headers: { "X-Mc-Auth": METRICOOL_API_KEY }
      });
      console.log("ANALYTICS IG:", JSON.stringify(res1.data).slice(0, 500));
    } catch(e) {}

    // Test 2: User summary info?
    try {
      const res2 = await axios.get(`https://app.metricool.com/api/admin/user?userId=4447358`, {
        headers: { "X-Mc-Auth": METRICOOL_API_KEY }
      });
      console.log("USER ADMIN:", JSON.stringify(res2.data).slice(0, 500));
    } catch(e) {}

  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
testMetricool();
