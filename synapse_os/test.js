const fs = require('fs');
const txt = fs.readFileSync('server/index.js', 'utf8');
const idx = txt.indexOf('app.post("/api/video-generator/generate", async');
console.log(txt.substring(idx - 100, idx + 1000));
