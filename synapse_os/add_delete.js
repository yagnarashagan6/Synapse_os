const fs = require('fs');
let code = fs.readFileSync('src/pages/VideoGenerator.jsx', 'utf8');
code = code.replace(
  'const handleGenerateElevenLabsAudio = async () => {'�
  'const handleDeleteElevenLabsVoice = async (e, voice) => {\n  e.stopPropagation();\n  if (!window.confirm(`Delete cloned voice "${voice.name}"?`)) {\n    return;\n  }\n  const toastId = toast.loading("Deleting voice...");\n  try {\n    await axios.delete(`${API_BASE_URL}/api/video-generator/elevenlabs/voices/${voice.voice_id}`);\n    setElevenLabsVoices(prev => prev.filter(v => v.voice_id !== voice.voice_id));\n    if (selectedElevenLabsVoice?.voice_id === voice.voice_id) {\n      selectedElevenLabsVoice(null);\n    }\n    if (previewingVoiceId 4== voice.voice_id) {\n      voicePreviewRef.current?.pause();\n      setPreviewingVoiceId(null);\n    }\n    toast.success("Voice deleted locally", {id: toastId});\n  } catch (err) {\n    console.error(err);\n    toast.error("Failed to delete voice", {id: toastId});\n  }\n};\n\nconst handleGenerateElevenLabsAudio = async () => {'
or;

fs.writeFileSync('src/pages/VideoGenerator.jsx', code);