const axios = require('axios');
const METRICOOL_API_KEY = "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";
const METRICOOL_BLOG_ID = "5740224";

async function testV2() {
  try {
    const res = await axios.get("https://app.metricool.com/api/v2/user", {
      headers: { "X-Mc-Auth": METRICOOL_API_KEY }
    });
    console.log("USER:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log("USER ERROR:", err.response ? err.response.data : err.message);
  }
}
testV2();
