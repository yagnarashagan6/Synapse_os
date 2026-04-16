const axios = require('axios');
const METRICOOL_API_KEY = "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";
const blogId = "5740224";
const userId = "4447358";
const postId = "311514203";

async function checkStatus() {
  try {
    const res = await axios.get(`https://app.metricool.com/api/v2/scheduler/posts/${postId}?blogId=${blogId}&userId=${userId}`, {
      headers: { "X-Mc-Auth": METRICOOL_API_KEY }
    });
    console.log("POST_STATUS_START");
    console.log(JSON.stringify(res.data, null, 2));
    console.log("POST_STATUS_END");
  } catch (err) {
    console.error("Error fetching status:", err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

checkStatus();
