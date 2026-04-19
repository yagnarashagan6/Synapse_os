const axios = require('axios');
const METRICOOL_API_KEY = "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";

async function testMetricool() {
  try {
    const res = await axios.get("https://app.metricool.com/api/admin/simpleProfiles", {
      headers: { "X-Mc-Auth": METRICOOL_API_KEY }
    });
    console.log("PROFILES:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log("ERROR:", err.response ? err.response.data : err.message);
  }
}
testMetricool();
