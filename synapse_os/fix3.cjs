const fs = require('fs'); let c=fs.readFileSync('src/pages/VideoGenerator.jsx', 'utf8');

c = c.replace(
  /const url = voice\.preview_audio;/g,
  \const url = voice.preview_audio?.startsWith('http') ? voice.preview_audio : "\\\$\{API_BASE_URL\}\\\$\{voice.preview_audio\}";\
);

fs.writeFileSync('src/pages/VideoGenerator.jsx', c, 'utf8');
