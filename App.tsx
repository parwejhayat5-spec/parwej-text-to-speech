
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Sparkles, 
  Mic2, 
  History, 
  Settings2,
  Volume2,
  Waves,
  Upload,
  UserCheck,
  FileAudio,
  Globe,
  FlaskConical,
  Activity,
  X,
  Info,
  CheckCircle2,
  Beaker,
  Zap,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';
import { VOICES, LANGUAGES, SAMPLE_RATE } from './constants';
import { TTSStatus, GeneratedAudio, VoiceOption, VoiceMode, Language } from './types';
import { GeminiTTSService } from './services/geminiService';
import { exportAudioToWav } from './utils/audioUtils';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // App State
  const [text, setText] = useState('मूर्ख! तुमने मेरी लैब को छूने की हिम्मत कैसे की? मेरा प्रयोग सफल होने ही वाला था! अब तुम्हें मेरे गुस्से का सामना करना पड़ेगा!');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICES[0]); // Default to Mad Scientist
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]); // Default to Hindi
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('PRESET');
  const [status, setStatus] = useState<TTSStatus>(TTSStatus.IDLE);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  
  const [refAudio, setRefAudio] = useState<{ data: string; mimeType: string; name: string } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsService = useRef(new GeminiTTSService());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tutorial preference
  useEffect(() => {
    const tutorialDismissed = localStorage.getItem('tts_clone_tutorial_dismissed');
    if (!tutorialDismissed) {
      setShowTutorial(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '913531') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setPasswordInput('');
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tts_clone_tutorial_dismissed', 'true');
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });
    }
  };

  const stopAudio = useCallback(() => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) { }
      activeSourceRef.current = null;
    }
    setIsPlaying(null);
  }, []);

  const playAudio = useCallback(async (audio: GeneratedAudio) => {
    stopAudio();
    initAudioContext();
    
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audio.audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setIsPlaying(null);
    };

    activeSourceRef.current = source;
    source.start(0);
    setIsPlaying(audio.id);
  }, [stopAudio]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setRefAudio({
        data: base64String,
        mimeType: file.type,
        name: file.name
      });
      setVoiceMode('CLONE');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (voiceMode === 'CLONE' && !refAudio) {
      setError('Please upload a reference audio file first.');
      return;
    }
    
    setStatus(TTSStatus.GENERATING);
    setError(null);
    stopAudio();

    try {
      const buffer = await ttsService.current.generateTTS(
        text, 
        selectedVoice.id,
        selectedLang.code,
        voiceMode, 
        selectedVoice.personality,
        refAudio ? { data: refAudio.data, mimeType: refAudio.mimeType } : undefined
      );
      
      const newAudio: GeneratedAudio = {
        id: crypto.randomUUID(),
        text,
        voice: voiceMode === 'CLONE' ? `Clone: ${refAudio?.name}` : selectedVoice.name,
        language: selectedLang.name,
        mode: voiceMode,
        timestamp: Date.now(),
        audioBuffer: buffer
      };

      setHistory(prev => [newAudio, ...prev]);
      setStatus(TTSStatus.IDLE);
      playAudio(newAudio);
    } catch (err: any) {
      setError(err.message || 'Failed to generate audio');
      setStatus(TTSStatus.ERROR);
    }
  };

  const handleDownload = (audio: GeneratedAudio) => {
    const blob = exportAudioToWav(audio.audioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-tts-${audio.id.slice(0, 8)}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteHistoryItem = (id: string) => {
    if (isPlaying === id) stopAudio();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // Password Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        {/* Background Logo Decoration */}
        <div className="fixed inset-0 z-0 opacity-10 pointer-events-none flex items-center justify-center">
          <img 
            src="https://raw.githubusercontent.com/fakhrealam123/gemini-tts-assets/main/logo.png" 
            alt="Decoration" 
            className="w-[80vw] h-[80vh] object-contain blur-xl"
          />
        </div>

        <div className="relative z-10 w-full max-w-md glass-morphism p-8 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-[2px] mb-6 shadow-xl shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0f172a] rounded-2xl flex items-center justify-center">
                <Lock className={`w-10 h-10 ${loginError ? 'text-rose-500 animate-bounce' : 'text-emerald-400'}`} />
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text text-center mb-2">Parwej Text To Speech</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Enter access key to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password..."
                className={`w-full bg-slate-900/50 border ${loginError ? 'border-rose-500/50 ring-rose-500/20' : 'border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'} rounded-2xl p-4 pl-12 text-center text-xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-4 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-600`}
                autoFocus
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>

            {loginError && (
              <p className="text-center text-rose-400 text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                Access Denied • Invalid Code
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Access System <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em]">
            Secured Access • Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="w-full max-w-5xl mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative group">
          {/* Logo Background Layer */}
          <div className="absolute -inset-8 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none">
            <img 
              src="https://raw.githubusercontent.com/fakhrealam123/gemini-tts-assets/main/logo.png" 
              alt="Logo Background" 
              className="w-full h-full object-contain blur-sm scale-150 rotate-3"
              onError={(e) => {
                 // Fallback if the direct link isn't ready - hide the background
                 (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-[2px] shadow-2xl shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0f172a] rounded-2xl flex items-center justify-center">
                <Volume2 className="text-emerald-400 w-8 h-8" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold tracking-tight gradient-text drop-shadow-lg">
                Parwej text to speech
              </h1>
              <p className="text-slate-400 text-sm italic font-medium tracking-wide">
                AI-Powered Voice Synthesis Studio
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-5 py-2.5 glass-morphism rounded-full border border-white/10 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Hindi Engine Active</span>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)} 
            className="p-2.5 glass-morphism rounded-full border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 transition-all shadow-lg"
            title="Lock App"
          >
            <Unlock className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-morphism p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-emerald-400" /> Enter Script
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <select 
                    value={selectedLang.code}
                    onChange={(e) => setSelectedLang(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[0])}
                    className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code} className="bg-[#1e293b]">
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <textarea
              className="w-full h-48 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none placeholder:text-slate-600 leading-relaxed font-medium"
              placeholder="यहाँ अपना संदेश लिखें..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleGenerate}
                disabled={status === TTSStatus.GENERATING || !text.trim()}
                className={`flex items-center gap-2 px-10 py-4 rounded-xl font-bold transition-all shadow-xl
                  ${status === TTSStatus.GENERATING 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:scale-105 active:scale-95 text-white hover:shadow-emerald-500/30'}`}
              >
                {status === TTSStatus.GENERATING ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Experiments Running...</>
                ) : (
                  <><Zap className="w-5 h-5" /> Unleash Voice</>
                )}
              </button>

              {error && (
                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                <History className="w-5 h-5 text-emerald-400" /> Lab Results
              </h2>
            </div>

            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                  <Waves className="w-12 h-12 mb-2 opacity-20" />
                  <p>No audio specimens generated</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id}
                    className="glass-morphism p-4 rounded-xl flex items-center justify-between group hover:bg-white/[0.03] transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => isPlaying === item.id ? stopAudio() : playAudio(item)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0
                          ${isPlaying === item.id 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse' 
                            : 'bg-slate-800 text-slate-300 group-hover:bg-emerald-500 group-hover:text-white'}`}
                      >
                        {isPlaying === item.id ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-0.5" />}
                      </button>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate pr-4">{item.text}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          <span className={item.voice.includes('Scientist') ? 'text-emerald-400' : 'text-sky-400'}>
                            {item.voice} • {item.language}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDownload(item)} className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"><Download className="w-5 h-5" /></button>
                      <button onClick={() => deleteHistoryItem(item.id)} className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
            <button 
              onClick={() => setVoiceMode('PRESET')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${voiceMode === 'PRESET' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Presets
            </button>
            <button 
              onClick={() => setVoiceMode('CLONE')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${voiceMode === 'CLONE' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Clone
            </button>
          </div>

          {voiceMode === 'PRESET' ? (
            <section className="glass-morphism p-6 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Character Select
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden group
                      ${selectedVoice.id === voice.id 
                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50' 
                        : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {voice.name === 'Mad Scientist' ? <Zap className="w-4 h-4 text-emerald-400" /> : <Activity className="w-4 h-4 text-sky-400" />}
                        <span className={`text-sm font-bold ${selectedVoice.id === voice.id ? 'text-emerald-400' : 'text-slate-300'}`}>{voice.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-bold">{voice.gender}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">{voice.description}</p>
                    {voice.name === 'Mad Scientist' && (
                      <div className="mt-2 flex gap-1">
                        <span className="text-[9px] font-bold text-rose-500 uppercase animate-pulse">Very Angry</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase">Deep Voice</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-4 animate-in fade-in slide-in-from-right-4">
              {showTutorial && (
                <div className="glass-morphism p-5 rounded-2xl border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
                  <button 
                    onClick={dismissTutorial}
                    className="absolute top-3 right-3 p-1 rounded-lg text-amber-500/50 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                        <Info className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-400 mb-1">Cloning Manual</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3 pr-6">
                        Upload a sample voice. Gemini will steal its character and apply it to your script.
                      </p>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-2 text-[10px] text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Clear recording (10s+)</span>
                        </li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>WAV or MP3 format</span>
                        </li>
                      </ul>
                      <button 
                        onClick={dismissTutorial}
                        className="mt-4 px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-[10px] font-bold hover:bg-amber-400 transition-colors"
                      >
                        Acknowledged
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-morphism p-6 rounded-2xl border border-white/5">
                <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Voice Sample
                </h2>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all gap-2
                    ${refAudio ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/20'}`}
                >
                  {refAudio ? (
                    <>
                      <FileAudio className="w-8 h-8 text-amber-500" />
                      <span className="text-xs text-amber-200 font-medium px-4 text-center truncate w-full">{refAudio.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-600" />
                      <span className="text-xs text-slate-400 font-medium">Click to Upload</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
              </div>
            </section>
          )}

          <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-indigo-500/5 rounded-2xl border border-emerald-500/10">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> System Info
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Default: <span className="text-emerald-400 font-bold">Hindi</span> + <span className="text-emerald-500 font-bold">Mad Scientist</span>. 
              Character features <span className="text-rose-400 font-bold">Angry Deep Voice</span> capabilities.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-12 pb-6 w-full text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-medium">
        Parwej text to speech • Powered by Gemini 2.5 Multi-Agent Engine
      </footer>
    </div>
  );
};

export default App;
