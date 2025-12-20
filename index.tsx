import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- ICONS (Inline SVGs to avoid import errors) ---
const MicIcon = ({ className = "", size = 24, color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const PlayIcon = ({ className = "", size = 24, fill = "none" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

// --- HOOK: useBlowDetection ---
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
  } catch(e) { console.error("Audio glitch", e); }
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
    // Focus on lower frequencies for "blowing" sound
    const binCount = Math.floor(array.length / 4); 
    for (let i = 0; i < binCount; i++) sum += array[i];
    const average = sum / binCount;
    setMicLevel(average); 

    // Threshold for blowing
    if (average > 35 && !blowTriggeredRef.current) { 
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
      // Low pass to reduce feedback/high pitch noise
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
  // Generate Candles Once
  const candles = useMemo(() => Array.from({ length: 17 }).map((_, i) => ({
    id: i,
    color: ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'][i % 4], 
    height: 35 + Math.random() * 15,
    x: Math.cos((i / 17) * Math.PI * 2) * 42,
    y: Math.sin((i / 17) * Math.PI * 2) * 18
  })), []);

  return (
    <div className="relative mt-20 w-[350px] h-[300px] md:w-[450px] md:h-[350px] mx-auto select-none perspective-[1000px] z-20">
      
      {/* --- PLATE --- */}
      <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[130%] h-[40%] z-0">
         <div className="w-full h-full bg-gradient-to-br from-white via-gray-200 to-gray-400 rounded-[50%] shadow-[0_25px_50px_rgba(0,0,0,0.6)] border-[6px] border-white flex items-center justify-center">
            <div className="w-[92%] h-[92%] rounded-[50%] border border-gray-300 bg-gradient-to-tr from-gray-100 to-white shadow-inner"></div>
         </div>
      </div>

      {/* --- KNIFE --- */}
      <div className="absolute bottom-0 -right-20 w-48 z-10 opacity-90 drop-shadow-2xl transition-transform hover:rotate-6 duration-300 cursor-pointer">
        <svg viewBox="0 0 100 20" className="transform rotate-[10deg] origin-left filter drop-shadow-lg">
          <defs>
            <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#9e9e9e" />
            </linearGradient>
          </defs>
          <path d="M0,8 Q50,0 90,8 L100,10 L90,12 Q50,20 0,12 Z" fill="url(#bladeGrad)" stroke="#757575" strokeWidth="0.5" />
          <rect x="-20" y="5" width="40" height="10" rx="3" fill="#3E2723" />
          <circle cx="-12" cy="10" r="1.5" fill="#8D6E63"/>
          <circle cx="-2" cy="10" r="1.5" fill="#8D6E63"/>
        </svg>
      </div>

      {/* --- BOTTOM CAKE LAYER (Chocolate) --- */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-full h-[110px] z-10">
        <div className="absolute bottom-0 w-full h-full bg-[#3E2723] rounded-b-[50%] shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[#281815] via-[#4E342E] to-[#281815]"></div>
             <div className="absolute inset-0 sponge-texture opacity-40"></div>
        </div>
        <div className="absolute top-0 w-full h-[60px] bg-[#3E2723] rounded-[50%] -translate-y-1/2 shadow-inner border-b border-[#5D4037]"></div>
      </div>

      {/* --- TOP CAKE LAYER (Cream/Yellow) --- */}
      <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-[85%] h-[120px] z-20">
        <div className="absolute bottom-0 w-full h-full bg-[#FFF9C4] rounded-b-[50%] shadow-lg flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9C4] via-[#FFF176] to-[#FFF9C4]"></div>
            <div className="absolute inset-0 sponge-texture opacity-30 mix-blend-multiply"></div>
            
            {/* Frosting Decor Bottom */}
            <div className="absolute bottom-[-15px] w-full h-[30px] flex justify-center space-x-3 opacity-60">
                {Array.from({length: 10}).map((_,i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-[6px] border-[#FFEE58] bg-transparent transform -translate-y-1/2"></div>
                ))}
            </div>

            {/* Text */}
            <div className="font-['Great_Vibes'] text-5xl md:text-6xl text-[#D81B60] mt-4 transform rotate-x-12 z-20 drop-shadow-md tracking-wide">
                My Babyyy
            </div>
        </div>
        
        {/* Top Surface */}
        <div className="absolute top-0 w-full h-[65px] bg-[#FFFDE7] rounded-[50%] -translate-y-1/2 shadow-inner border-[1px] border-[#FFF59D] flex items-center justify-center">
            
            {/* Frosting Rim */}
            <div className="absolute inset-[-5px] rounded-[50%] border-[8px] border-dotted border-[#FFF59D] opacity-90 box-border"></div>

            {/* --- PANDA DECORATION (Center) --- */}
            <div className="absolute z-20 w-20 h-16 bg-white rounded-full shadow-lg flex items-center justify-center transform -translate-y-4">
                 {/* Ears */}
                 <div className="absolute -top-3 -left-2 w-7 h-7 bg-black rounded-full border-2 border-gray-800"></div>
                 <div className="absolute -top-3 -right-2 w-7 h-7 bg-black rounded-full border-2 border-gray-800"></div>
                 {/* Face Base */}
                 <div className="relative w-full h-full bg-white rounded-full border border-gray-200 z-10 flex flex-col items-center justify-center overflow-hidden">
                     {/* Eyes */}
                     <div className="flex gap-2 mt-2">
                         <div className="w-5 h-4 bg-black rounded-full transform rotate-[-15deg] flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                         </div>
                         <div className="w-5 h-4 bg-black rounded-full transform rotate-[15deg] flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                         </div>
                     </div>
                     {/* Nose/Mouth */}
                     <div className="w-3 h-2 bg-black rounded-full mt-1"></div>
                     <div className="w-3 h-2 border-b-2 border-black rounded-full"></div>
                     {/* Blush */}
                     <div className="absolute top-8 left-1 w-3 h-2 bg-pink-200 rounded-full blur-[2px]"></div>
                     <div className="absolute top-8 right-1 w-3 h-2 bg-pink-200 rounded-full blur-[2px]"></div>
                 </div>
            </div>

            {/* --- CANDLES --- */}
            <div className="absolute w-full h-full pointer-events-none">
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
                     {/* Flame */}
                     <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-4 h-8 rounded-[50%_50%_20%_20%] 
                                   bg-gradient-to-t from-orange-600 via-yellow-400 to-white 
                                   animate-flicker-real shadow-[0_0_25px_rgba(255,200,0,0.8)] mix-blend-screen
                                   transition-all duration-300 ${isExtinguished ? 'opacity-0 scale-0' : 'opacity-100'}`}></div>

                     {/* Smoke */}
                     {isExtinguished && (
                         <div className="absolute bottom-full left-1/2 w-6 h-6 bg-gray-400 rounded-full blur-md animate-smoke pointer-events-none"></div>
                     )}

                     {/* Wick */}
                     <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 w-[2px] h-3 bg-black"></div>

                     {/* Body */}
                     <div className="w-3 shadow-md rounded-[2px]" style={{
                            height: `${c.height}px`,
                            background: `linear-gradient(90deg, rgba(255,255,255,0.7), ${c.color}, rgba(0,0,0,0.1))`
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

  // Win Music
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

  // Check Win State
  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
      playWinMusic();
      
      // Fire Global Confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        if((window as any).confetti) {
            (window as any).confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            (window as any).confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }
      }, 250);
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
      
      {/* --- DECORATIONS --- */}
      <div className="spotlight"></div>
      
      {/* Streamers */}
      <div className="absolute top-0 w-full h-32 flex justify-between px-2 z-0 opacity-90 pointer-events-none">
         {Array.from({ length: 15 }).map((_, i) => (
             <div key={i} className="w-10 h-14 origin-top animate-swing"
               style={{ 
                  backgroundColor: ['#FFCDD2', '#BBDEFB', '#FFF9C4', '#C8E6C9'][i%4],
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  animationDelay: `${i*0.2}s`,
                  animationDuration: '3s',
                  transformOrigin: 'top center'
               }}></div>
         ))}
      </div>

      {/* Balloons */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {[{c:'bg-pink-500',l:'10%'}, {c:'bg-blue-400',l:'85%'}, {c:'bg-yellow-400',l:'25%'}, {c:'bg-green-400',l:'70%'}, {c:'bg-purple-400',l:'50%'}].map((b, i) => (
              <div key={i} className={`absolute -bottom-24 w-24 h-32 ${b.c} rounded-[50%] opacity-80 animate-float-balloon shadow-xl border-r-4 border-white/20`}
                style={{ left: b.l, animationDelay: `${i*1.5}s` }}>
                  <div className="absolute bottom-[-20px] left-1/2 w-0.5 h-20 bg-white/40"></div>
              </div>
          ))}
      </div>

      {/* --- CURTAINS --- */}
      {hasStarted && (
        <>
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#7f1d1d] to-[#b91c1c] z-50 shadow-2xl ${curtainsOpen ? 'animate-curtain-left' : ''}`}>
               <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,black_50px)]"></div>
            </div>
            <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#7f1d1d] to-[#b91c1c] z-50 shadow-2xl ${curtainsOpen ? 'animate-curtain-right' : ''}`}>
               <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,black_50px)]"></div>
            </div>
        </>
      )}

      {/* --- UI --- */}
      <div className="flex-grow relative z-40 flex flex-col items-center justify-center">
        
        {!hasStarted && (
          <div className="z-50 text-center animate-bounce">
             <button onClick={handleStart} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-12 py-6 rounded-full text-3xl font-bold shadow-[0_0_50px_rgba(236,72,153,0.8)] border-4 border-pink-300 hover:scale-110 transition-transform flex items-center gap-3">
                <PlayIcon fill="white" size={36} /> Open Surprise
             </button>
             <p className="text-pink-200 mt-6 text-xl font-medium tracking-wide">Please Enable Microphone & Sound 🔊</p>
          </div>
        )}

        {hasStarted && (
            <div className={`transition-opacity duration-1000 w-full h-full flex flex-col items-center ${curtainsOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-12 z-30 text-center w-full">
                    <h1 className="font-['Great_Vibes'] text-7xl md:text-9xl text-[#FFD700] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-pulse">
                        {showCelebration ? "Happy Birthday!" : "Make a Wish!"}
                    </h1>
                </div>

                <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/60 px-5 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                    <MicIcon size={24} className={isListening ? "text-green-400" : "text-gray-400"} />
                    <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75" style={{ width: `${Math.min(micLevel * 3, 100)}%` }}></div>
                    </div>
                </div>

                <BirthdayCake candlesExtinguished={candlesExtinguished} />

                {/* REALISTIC TABLE */}
                <div className="absolute bottom-[-25vh] w-[150vw] h-[70vh] wood-texture rounded-[50%] z-10 transform rotate-x-12 shadow-[inset_0_20px_50px_rgba(0,0,0,0.9)] border-t-[8px] border-[#3E2723]"></div>

                {showCelebration && (
                    <div className="absolute bottom-20 z-50">
                        <button onClick={() => window.location.reload()} className="bg-white text-pink-600 px-10 py-4 text-xl rounded-full font-bold shadow-2xl hover:bg-gray-100 transform hover:-translate-y-1 transition-all">
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
const root = createRoot(document.getElementById('root')!);
root.render(<App />);