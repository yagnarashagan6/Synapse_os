const axios = require('axios');
const METRICOOL_API_KEY = "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";
const METRICOOL_BLOG_ID = "5740224";

async function testV2() {
  try {
    const res = await axios.get("https://app.metricool.com/api/v2/accounts", {
      headers: { "X-Mc-Auth": METRICOOL_API_KEY }
    });
    console.log("ACCOUNTS:", JSON.stringify(res.data, null, 2));

    // Try fetching analytics for Instagram for the last 30 days
    const endDate = new Date().toISOString().split('T')[0] + 'T23:59:59';
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00';

    try {
      const analyticsRes = await axios.get(`https://app.metricool.com/api/v2/analytics/instagram?blogId=${METRICOOL_BLOG_ID}&from=${startDate}&to=${endDate}`, {
        headers: { "X-Mc-Auth": METRICOOL_API_KEY }
      });
      console.log("ANALYTICS IG:", JSON.stringify(analyticsRes.data, null, 2));
    } catch(e) {
      console.log("ANALYTICS IG ERROR:", e.response ? e.response.data : e.message);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
testV2();
