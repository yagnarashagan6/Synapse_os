const fs = require('fs');
let content = fs.readFileSync('src/pages/VideoGenerator.jsx', 'utf8');

// The replacement code block containing the delete button
const deleteBlock = 
                              {voice.category === "cloned" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteElevenLabsVoice(e, voice);
                                  }}
                                  className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))
                      )}
;

content = content.replace(
  /                                <\/div>\r?\n                              <\/div>\r?\n                            <\/div>\r?\n                          \)\)\r?\n                      \)\}/,
  \                                </div>\n                              </div>\ + deleteBlock
);

// Second fix: prepend API_BASE_URL to voice previews
content = content.replace(
  /const url = voice\.preview_audio;/,
  \const url = voice.preview_audio.startsWith('http') ? voice.preview_audio : \\\\\$\{API_BASE_URL\}\\\$\{voice.preview_audio\}\\\;\
);

// Third fix: "Your selection" section to show selectedElevenLabsVoice correctly
content = content.replace(
  /{selectedVoice\.name}/,
  \{selectedElevenLabsVoice ? selectedElevenLabsVoice.name : selectedVoice?.name}\
);

content = content.replace(
  /<img\s+src=\{selectedVoice\.preview_image\}\s+alt=\{selectedVoice\.name\}/,
  \{selectedElevenLabsVoice ? (
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                              <Volume2 className="w-6 h-6 text-emerald-400" />
                            </div>
                          ) : (
                            <img
                              src={selectedVoice?.preview_image}
                              alt={selectedVoice?.name}
                              className="w-12 h-12 rounded-lg object-cover border border-purple-500/30"
                            />
                          )}\
);


fs.writeFileSync('src/pages/VideoGenerator.jsx', content, 'utf8');
console.log("Successfully replaced block.");
