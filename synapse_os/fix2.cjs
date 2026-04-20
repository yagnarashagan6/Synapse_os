const fs = require('fs');
let c=fs.readFileSync('src/pages/VideoGenerator.jsx', 'utf8');

c = c.replace(
  '{selectedElevenLabsVoice ? selectedElevenLabsVoice.name : (selectedVoice?.name || (\\r?\\n\\\\s*<span className=\"text-gray-500 italic\">Not selected</span>\\r?\\n\\\\s*)\\\\}',
  '{selectedElevenLabsVoice?.name || selectedVoice?.name || (\n                        <span className="text-gray-500 italic">Not selected</span>\n                      )}'
);

// Fallback regex because newlines can mess it up
c = c.replace(
  /\{selectedElevenLabsVoice \? selectedElevenLabsVoice\.name : \(selectedVoice\?\.name \|\|\s*\(\s*<span className="text-gray-500 italic">Not selected<\/span>\s*\)\}/g,
  '{selectedElevenLabsVoice?.name || selectedVoice?.name || (\n                        <span className="text-gray-500 italic">Not selected</span>\n                      )}'
);

fs.writeFileSync('src/pages/VideoGenerator.jsx', c, 'utf8');
