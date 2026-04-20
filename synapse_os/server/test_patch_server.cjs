const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// The avatars fetching is completely unnecessary if we pass avatarId.
code = code.replace(
  /const avatarsRes = await axios\.get\("https:\/\/api\.heygen\.com\/v2\/avatars", \{[^}]*\}\);\s*const avatars = avatarsRes\.data\?.data\?.avatars \|\| \[\];\s*const avatar = avatars\.length > 0 \? avatars\[0\] : null;\s*let avatarId =\s*req\.body\.avatar_id \|\|\s*\(avatar \? avatar\.avatar_id : "Angela-inTshirt-20220820"\);/,
  "let avatarId = req.body.avatar_id || \"Abigail_expressive_2024112501\";"
);

fs.writeFileSync('index.js', code);
console.log("Patched avatar fetch out");
