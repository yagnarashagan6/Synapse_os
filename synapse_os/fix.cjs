const fs = require('fs');

let c = fs.readFileSync('src/pages/VideoGenerator.jsx', 'utf8');

c = c.replace(
  '                                    )}\r\n                                </div>\r\n                              </div>\r\n                            </div>\r\n                          ))',
  '                                    )}\r\n                                </div>\r\n                              </div>\r\n                              {voice.category === "cloned" && (\r\n                                <button onClick={(e) => { e.stopPropagation(); handleDeleteElevenLabsVoice(e, voice); }} className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">\r\n                                  <Trash2 size={16} />\r\n                                </button>\r\n                              )}\r\n                            </div>\r\n                          ))'
);

c = c.replace(
  '                                    )}\n                                </div>\n                              </div>\n                            </div>\n                          ))',
  '                                    )}\n                                </div>\n                              </div>\n                              {voice.category === "cloned" && (\n                                <button onClick={(e) => { e.stopPropagation(); handleDeleteElevenLabsVoice(e, voice); }} className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">\n                                  <Trash2 size={16} />\n                                </button>\n                              )}\n                            </div>\n                          ))'
);

c = c.replace(
  /const url = voice.preview_audio;/g,
  "const url = voice.preview_audio?.startsWith('http') ? voice.preview_audio : `${API_BASE_URL}${voice.preview_audio}`;"
);

c = c.replace(
  '{selectedVoice?.name || (',
  '{selectedElevenLabsVoice ? selectedElevenLabsVoice.name : (selectedVoice?.name || ('
);

fs.writeFileSync('src/pages/VideoGenerator.jsx', c, 'utf8');
console.log("Done updates")
