const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');
const searchString = \    try {
      const avatarsRes = await axios.get("https://api.heygen.com/v2/avatars", {
        headers: { "x-api-key": videoGeneratorApiKey },
        timeout: 15000,
      });
  
      const avatars = avatarsRes.data?.data?.avatars || [];
      const avatar = avatars.length > 0 ? avatars[0] : null;
      let avatarId =
        req.body.avatar_id ||
        (avatar ? avatar.avatar_id : "Angela-inTshirt-20220820");\;

const replaceString = \    try {
      let avatarId = req.body.avatar_id || "Abigail_expressive_2024112501";\;

code = code.replace(searchString, replaceString);
fs.writeFileSync('index.js', code);
console.log("Removed fetching avatars inside generate!");
