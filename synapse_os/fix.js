const fs = require('fs');
let c=fs.readFileSync('src/pages/VideoGenerator.jsx', 'utf8');

c = c.replace(
  '{selectedVoice && (\n                      <p className="text-xs text-gray-400">\n                        {selectedVoice.language} · {selectedVoice.gender}\n                      </p>\n                    )}',
  '{(selectedElevenLabsVoice || selectedVoice) && (\n                      <p className="text-xs text-gray-400">\n                        {selectedElevenLabsVoice ? (selectedElevenLabsVoice.description || selectedElevenLabsVoice.category || "ElevenLabs Voice") : (selectedVoice.language + " · " + selectedVoice.gender)}\n                      </p>\n                    )}'
);

c = c.replace(
  '{selectedVoice && (\r\n                      <p className="text-xs text-gray-400">\r\n                        {selectedVoice.language} · {selectedVoice.gender}\r\n                      </p>\r\n                    )}',
  '{(selectedElevenLabsVoice || selectedVoice) && (\r\n                      <p className="text-xs text-gray-400">\r\n                        {selectedElevenLabsVoice ? (selectedElevenLabsVoice.description || selectedElevenLabsVoice.category || "ElevenLabs Voice") : (selectedVoice.language + " · " + selectedVoice.gender)}\r\n                      </p>\r\n                    )}'
);

// Update avatar and voice display image wrapper correctly

fs.writeFileSync('src/pages/VideoGenerator.jsx', c, 'utf8');
