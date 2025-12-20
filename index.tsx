import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- ICONS ---
// Inline SVGs to remove 'lucide-react' dependency
const MicIcon = ({ className = "", size = 24, color = "currentColor" }: { className?: string, size?: number, color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const PlayIcon = ({ className = "", size = 24, fill = "none" }: { className?: string, size?: number, fill?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

// --- HOOK: useBlowDetection ---
// Consolidating hook logic here
const playPuffSound = (ctx: AudioContext) => {
  try {
    const osc = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    osc.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
  } catch(e) { console.error("Audio error", e); }
};

const useBlowDetection = (isActive: boolean, onBlow: () => void) => {
  const [isListening, setIsListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const blowTriggeredRef = useRef(false);

  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const array = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(array);
    
    let sum = 0;
    const binCount = Math.floor(array.length / 4); 
    for (let i = 0; i < binCount; i++) sum += array[i];
    const average = sum / binCount;
    setMicLevel(average); 

    if (average > 30 && !blowTriggeredRef.current) { 
      blowTriggeredRef.current = true;
      if (audioContextRef.current) playPuffSound(audioContextRef.current);
      onBlow();
      setTimeout(() => { blowTriggeredRef.current = false; }, 150); 
    }
    requestRef.current = requestAnimationFrame(checkAudioLevel);
  }, [onBlow]);

  const startListening = async () => {
    if (isListening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      microphone.connect(filter);
      filter.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      setIsListening(true);
      requestRef.current = requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Please allow microphone access to blow out the candles! 🎂");
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return { startListening, isListening, micLevel };
};

// --- COMPONENT: BirthdayCake ---
const BirthdayCake = ({ candlesExtinguished }: { candlesExtinguished: number }) => {
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => ({
    id: i,
    color: ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'][i % 4], 
    height: 40 + Math.random() * 10,
    x: Math.cos((i / 17) * Math.PI * 2) * 42,
    y: Math.sin((i / 17) * Math.PI * 2) * 18
  })), []);

  return (
    <div className="relative mt-24 w-[350px] h-[300px] md:w-[450px] md:h-[350px] mx-auto select-none perspective-[1000px]">
      {/* Plate */}
      <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[130%] h-[35%] z-0">
         <div className="w-full h-full bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-[50%] shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center">
            <div className="w-[90%] h-[90%] rounded-[50%] border border-gray-200 bg-gradient-to-tr from-gray-50 to-white shadow-inner"></div>
         </div>
      </div>

      {/* Knife */}
      <div className="absolute bottom-4 -right-16 w-40 z-10 opacity-90 drop-shadow-xl transition-transform hover:rotate-3 duration-300">
        <svg viewBox="0 0 100 20" className="transform rotate-[15deg] origin-left">
          <defs>
            <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#bdbdbd" />
            </linearGradient>
          </defs>
          <path d="M0,8 Q50,2 90,8 L100,10 L90,12 Q50,18 0,12 Z" fill="url(#bladeGrad)" stroke="#9e9e9e" strokeWidth="0.5" />
          <rect x="-15" y="6" width="35" height="8" rx="2" fill="#5D4037" />
          <circle cx="-10" cy="10" r="1" fill="#8D6E63"/>
          <circle cx="0" cy="10" r="1" fill="#8D6E63"/>
        </svg>
      </div>

      {/* Bottom Layer */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-full h-[100px] z-10">
        <div className="absolute bottom-0 w-full h-full bg-[#4E342E] rounded-b-[50%] shadow-xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[#3E2723] via-[#5D4037] to-[#3E2723]"></div>
             <div className="absolute inset-0 sponge-texture opacity-30 mix-blend-overlay"></div>
        </div>
        <div className="absolute top-0 w-full h-[60px] bg-[#3E2723] rounded-[50%] -translate-y-1/2 shadow-inner border-b border-[#5D4037]"></div>
      </div>

      {/* Top Layer */}
      <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-[85%] h-[110px] z-20">
        <div className="absolute bottom-0 w-full h-full bg-[#FFF9C4] rounded-b-[50%] shadow-lg flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9C4] via-[#FFF59D] to-[#FFF9C4]"></div>
            <div className="absolute inset-0 sponge-texture opacity-20 mix-blend-multiply"></div>
            
            <div className="absolute bottom-[-10px] w-full h-[20px] flex justify-center space-x-2 opacity-50">
                {Array.from({length: 12}).map((_,i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-4 border-[#FDD835] bg-transparent transform -translate-y-1/2"></div>
                ))}
            </div>

            <div className="font-['Great_Vibes'] text-4xl md:text-5xl text-[#D81B60] mt-6 transform rotate-x-12 z-20 drop-shadow-sm tracking-wide">
                My Babyyy
            </div>
        </div>
        
        <div className="absolute top-0 w-full h-[60px] bg-[#FFFDE7] rounded-[50%] -translate-y-1/2 shadow-inner border-[1px] border-[#FFF59D] flex items-center justify-center">
            <div className="absolute inset-[-4px] rounded-[50%] border-[6px] border-dotted border-[#FFF59D] opacity-80"></div>

            {/* Panda */}
            <div className="absolute z-10 w-16 h-12 bg-white rounded-full shadow-md flex items-center justify-center transform -translate-y-2">
                 <div className="absolute -top-1 -left-1 w-5 h-5 bg-black rounded-full"></div>
                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full"></div>
                 <div className="relative w-full h-full bg-white rounded-full border border-gray-100 z-10 flex flex-col items-center justify-center">
                     <div className="flex gap-2 mt-1">
                         <div className="w-3 h-3 bg-black rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                         <div className="w-3 h-3 bg-black rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                     </div>
                     <div className="w-2 h-1 bg-black rounded-full mt-1"></div>
                     <div className="w-2 h-2 border-b-2 border-black rounded-full"></div>
                 </div>
            </div>

            {/* Candles */}
            <div className="absolute w-full h-full">
              {candles.map((c, i) => {
                 const zIndex = Math.floor(c.y + 50);
                 const isExtinguished = i < candlesExtinguished;

                 return (
                  <div key={i} className="absolute" style={{
                        left: `calc(50% + ${c.x}%)`,
                        top: `calc(50% + ${c.y}%)`,
                        zIndex: zIndex,
                        transform: 'translate(-50%, -100%)'
                    }}>
                     <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-3 h-7 rounded-[50%_50%_20%_20%] 
                                   bg-gradient-to-t from-orange-600 via-yellow-400 to-white 
                                   animate-flicker-real shadow-[0_0_20px_rgba(255,200,0,0.6)] mix-blend-screen
                                   transition-all duration-300 ${isExtinguished ? 'opacity-0 scale-0' : 'opacity-100'}`}></div>
                     {isExtinguished && (
                         <div className="absolute bottom-full left-1/2 w-4 h-4 bg-gray-400 rounded-full blur-sm animate-smoke pointer-events-none"></div>
                     )}
                     <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-gray-800"></div>
                     <div className="w-2.5 shadow-md rounded-[2px]" style={{
                            height: `${c.height}px`,
                            background: `linear-gradient(90deg, rgba(255,255,255,0.6), ${c.color}, rgba(0,0,0,0.1))`
                        }}></div>
                  </div>
                 );
              })}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [candlesExtinguished, setCandlesExtinguished] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const TOTAL_CANDLES = 17;

  const playWinMusic = () => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;
        const notes = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63]; 
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, t + i * 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.4 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + i * 0.4);
            osc.stop(t + i * 0.4 + 0.4);
        });
    } catch (e) { console.error(e); }
  };

  const handleBlow = () => {
    if (candlesExtinguished < TOTAL_CANDLES) {
      const amount = Math.floor(Math.random() * 2) + 1;
      setCandlesExtinguished(prev => Math.min(prev + amount, TOTAL_CANDLES));
    }
  };

  const { startListening, isListening, micLevel } = useBlowDetection(curtainsOpen, handleBlow);

  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
      playWinMusic();
      
      // FIRE CONFETTI
      if ((window as any).confetti) {
          const duration = 5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            (window as any).confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            (window as any).confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
          }, 250);
      }
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    setTimeout(() => {
        setCurtainsOpen(true);
        startListening();
    }, 100);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a0b1c] flex flex-col font-['Montserrat']">
      <div className="spotlight"></div>
      
      {/* Streamers */}
      <div className="absolute top-0 w-full h-24 flex justify-between px-2 z-0 opacity-90 pointer-events-none">
         {Array.from({ length: 15 }).map((_, i) => (
             <div key={i} className="w-8 h-10 origin-top animate-pulse"
               style={{ 
                  backgroundColor: ['#ef5350', '#42a5f5', '#ffca28', '#66bb6a'][i%4],
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  animationDelay: `${i*0.2}s`,
                  transform: `scale(${0.8 + Math.random()*0.4})`
               }}></div>
         ))}
      </div>

      {/* Balloons */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {[{c:'bg-red-500',l:'10%'},{c:'bg-blue-400',l:'85%'},{c:'bg-yellow-400',l:'25%'},{c:'bg-green-400',l:'70%'},{c:'bg-purple-400',l:'50%'}].map((b, i) => (
              <div key={i} className={`absolute -bottom-20 w-20 h-24 ${b.c} rounded-[50%] opacity-70 animate-float-balloon shadow-lg`}
                style={{ left: b.l, animationDelay: `${i}s` }}>
                  <div className="absolute bottom-[-10px] left-1/2 w-0.5 h-10 bg-gray-400 opacity-50"></div>
              </div>
          ))}
      </div>

      {/* Curtains */}
      {hasStarted && (
        <>
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#5a0000] to-[#800000] z-50 shadow-2xl ${curtainsOpen ? 'animate-curtain-left' : ''}`}></div>
            <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#5a0000] to-[#800000] z-50 shadow-2xl ${curtainsOpen ? 'animate-curtain-right' : ''}`}></div>
        </>
      )}

      {/* Main UI */}
      <div className="flex-grow relative z-40 flex flex-col items-center justify-center">
        {!hasStarted && (
          <div className="z-50 text-center animate-bounce">
             <button onClick={handleStart} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-[0_0_40px_rgba(236,72,153,0.8)] border-2 border-pink-300 hover:scale-110 transition-transform flex items-center gap-3">
                <PlayIcon fill="white" size={32} /> Open Surprise
             </button>
             <p className="text-pink-200 mt-4 font-medium tracking-wide">Enable Microphone & Sound 🔊</p>
          </div>
        )}

        {hasStarted && (
            <div className={`transition-opacity duration-1000 w-full h-full flex flex-col items-center ${curtainsOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-16 z-30 text-center w-full">
                    <h1 className="font-['Great_Vibes'] text-6xl md:text-8xl text-[#FFD700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse">
                        {showCelebration ? "Happy Birthday!" : "Make a Wish!"}
                    </h1>
                </div>

                <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/60 px-5 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                    <MicIcon size={24} className={isListening ? "text-green-400" : "text-gray-400"} />
                    <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75" style={{ width: `${Math.min(micLevel * 3, 100)}%` }}></div>
                    </div>
                </div>

                <div className="relative z-20">
                     <BirthdayCake candlesExtinguished={candlesExtinguished} />
                </div>

                <div className="absolute bottom-[-20vh] w-[140vw] h-[60vh] wood-texture rounded-[50%] z-10 transform rotate-x-12 shadow-[inset_0_20px_50px_rgba(0,0,0,0.8)] border-t-4 border-[#5d4037]"></div>

                {showCelebration && (
                    <div className="absolute bottom-20 z-50">
                        <button onClick={() => window.location.reload()} className="bg-white text-pink-600 px-8 py-3 rounded-full font-bold shadow-2xl hover:bg-gray-100 transform hover:-translate-y-1 transition-all">
                            Blow Again
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// Mount
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);