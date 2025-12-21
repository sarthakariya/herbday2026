import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { BirthdayCake } from './components/BirthdayCake';
import { useBlowDetection } from './hooks/useBlowDetection';
import { Play, Mic, Heart, Gift } from 'lucide-react';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [candlesExtinguished, setCandlesExtinguished] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [showCardButton, setShowCardButton] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const TOTAL_CANDLES = 17;
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- AUDIO SYNTHESIS ---
  const initAudio = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  const playPartyHorn = () => {
      try {
          const ctx = audioContextRef.current;
          if (!ctx) return;
          const t = ctx.currentTime;
          
          const osc1 = ctx.createOscillator();
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(300, t);
          osc1.frequency.linearRampToValueAtTime(500, t + 0.1); 
          
          const osc2 = ctx.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(305, t);
          osc2.frequency.linearRampToValueAtTime(510, t + 0.1);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.8);
          osc2.stop(t + 0.8);
      } catch(e) {}
  };

  const playWinMusic = () => {
    try {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        const t = ctx.currentTime + 0.5;
        
        const melody = [
            { f: 392.00, d: 0.25 }, { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.5 }, { f: 392.00, d: 0.5 }, { f: 523.25, d: 0.5 }, { f: 493.88, d: 1.0 },
            { f: 392.00, d: 0.25 }, { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.5 }, { f: 392.00, d: 0.5 }, { f: 587.33, d: 0.5 }, { f: 523.25, d: 1.0 },
            { f: 392.00, d: 0.25 }, { f: 392.00, d: 0.25 }, { f: 783.99, d: 0.5 }, { f: 659.25, d: 0.5 }, { f: 523.25, d: 0.5 }, { f: 493.88, d: 0.5 }, { f: 440.00, d: 0.5 }
        ];

        let cursor = t;
        melody.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = note.f;
            osc.type = 'sawtooth';
            
            gain.gain.setValueAtTime(0, cursor);
            gain.gain.linearRampToValueAtTime(0.1, cursor + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, cursor + note.d * 0.9);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(cursor);
            osc.stop(cursor + note.d);
            
            cursor += note.d;
        });
    } catch (e) { console.error(e); }
  };

  const handleBlow = () => {
    if (candlesExtinguished < TOTAL_CANDLES) {
      const amount = Math.floor(Math.random() * 3) + 1;
      setCandlesExtinguished(prev => Math.min(prev + amount, TOTAL_CANDLES));
    }
  };

  const { startListening, isListening, micLevel } = useBlowDetection(curtainsOpen, handleBlow);

  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
      playPartyHorn();
      playWinMusic();
      setTimeout(() => {
          setShowCardButton(true);
      }, 2000);
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    initAudio();
    // Faster start: 100ms delay then immediate curtain opening
    setTimeout(() => {
        setCurtainsOpen(true);
        startListening();
    }, 100);
  };

  return (
    // Replaced dark background with Sky Blue Gradient (Twilight/Evening Sky for realism)
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#0f4c75] via-[#3282b8] to-[#bbe1fa] flex flex-col font-['Montserrat'] selection:bg-blue-300 selection:text-white">
      
      {/* Noise Texture for Realism */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* --- AMBIENT LIGHTING --- */}
      <div className="spotlight z-[2]"></div>
      
      {/* --- WINDOW (Left Side) --- */}
      <div className="absolute top-[10%] left-0 z-10 w-[200px] h-[300px] md:w-[300px] md:h-[400px] bg-[#1a1a2e] border-r-8 border-y-8 border-[#2d1b16] shadow-2xl overflow-hidden transform skew-y-6 origin-top-left">
          <div className="absolute inset-0 bg-gradient-to-b from-[#020024] to-[#090979]">
              {/* Moon */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-yellow-100 shadow-[0_0_40px_rgba(255,255,200,0.5)]"></div>
              {/* Stars */}
              <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-20 left-24 w-1 h-1 bg-white rounded-full animate-pulse delay-75"></div>
          </div>
          {/* Window Panes */}
          <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-[#2d1b16] -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-[#2d1b16] -translate-y-1/2"></div>
          {/* Light Reflection on Floor from Window */}
          <div className="absolute top-full left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/40 to-transparent transform -skew-x-12 blur-xl pointer-events-none"></div>
      </div>

      {/* --- CONFETTI --- */}
      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          gravity={0.15}
          colors={['#FFD700', '#FFFFFF', '#87CEEB', '#FF69B4']}
        />
      )}

      {/* --- BALLOONS --- */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
          {[{c:'#90CAF9'}, {c:'#F48FB1'}, {c:'#FFF59D'}, {c:'#A5D6A7'}, {c:'#CE93D8'}].map((b, i) => (
              <div key={i} className="balloon"
                style={{ left: `${15 + i * 18}%`, '--color': b.c, '--duration': `${20+i}s`, '--delay': `${i*2}s` } as React.CSSProperties}>
              </div>
          ))}
      </div>

      {/* --- CURTAINS (Updated Physics) --- */}
      {/* Curtains now open with a cubic-bezier ease-out-bounce feel and faster (700ms) */}
      <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-900 to-red-700 z-[60] shadow-[10px_0_60px_rgba(0,0,0,0.7)] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${curtainsOpen ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.3)_50px,transparent_60px)] opacity-40"></div>
            {/* Curtain Tie */}
            <div className={`absolute top-1/2 right-0 w-12 h-24 bg-yellow-500 shadow-lg transform -translate-y-1/2 rounded-l-full transition-opacity duration-500 ${curtainsOpen ? 'opacity-0' : 'opacity-100'}`}></div>
      </div>
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-900 to-red-700 z-[60] shadow-[-10px_0_60px_rgba(0,0,0,0.7)] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${curtainsOpen ? 'translate-x-full' : 'translate-x-0'}`}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.3)_50px,transparent_60px)] opacity-40"></div>
             {/* Curtain Tie */}
             <div className={`absolute top-1/2 left-0 w-12 h-24 bg-yellow-500 shadow-lg transform -translate-y-1/2 rounded-r-full transition-opacity duration-500 ${curtainsOpen ? 'opacity-0' : 'opacity-100'}`}></div>
      </div>

      {/* --- START SCREEN --- */}
      {!hasStarted && (
        <div className="absolute inset-0 z-[70] bg-[#1a1a2e] flex flex-col items-center justify-center transition-opacity duration-1000">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
             <button 
                onClick={handleStart} 
                className="group relative z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-16 py-6 rounded-full text-3xl font-serif font-bold shadow-[0_0_50px_rgba(60,130,246,0.6)] border-4 border-white hover:scale-105 transition-transform flex items-center gap-4 cursor-pointer"
             >
                <Gift className="fill-white animate-bounce" size={36} />
                <span>Begin Surprise</span>
             </button>
             <p className="mt-8 text-blue-200 tracking-[0.3em] uppercase text-sm font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">Enable Microphone & Sound 🎙️</p>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Header */}
            <div className="absolute top-[5%] z-30 text-center w-full pointer-events-none select-none">
                <h1 className="font-['Great_Vibes'] text-6xl md:text-9xl text-[#FFD700] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] animate-pulse">
                    {showCelebration ? "Happy Birthday!" : "Make a Wish..."}
                </h1>
            </div>

            {/* Mic Meter */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-xl">
                <Mic size={20} className={isListening ? "text-green-400" : "text-gray-400"} />
                <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-75" 
                        style={{ width: `${Math.min(micLevel * 3, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* --- 3D SCENE --- */}
            <div className="relative w-full h-[800px] flex items-center justify-center preserve-3d transition-transform duration-1000 perspective-1000" 
                 style={{ transform: 'rotateX(20deg) translateY(50px)' }}>
                 
                 {/* CAKE CONTAINER */}
                 <div className="relative z-30" style={{ transform: 'translateY(-60px)' }}>
                      <BirthdayCake candlesExtinguished={candlesExtinguished} />
                 </div>

                 {/* TABLE SURFACE */}
                 <div className="absolute top-1/2 left-1/2 w-[1500px] h-[1500px] wood-texture rounded-full z-10"
                      style={{ 
                          transform: 'translate(-50%, -50%) translateZ(-80px)', 
                          backgroundSize: '400px',
                          boxShadow: '0 50px 100px rgba(0,0,0,0.8), inset 0 0 200px rgba(0,0,0,0.9)'
                      }}>
                      {/* Dynamic Reflection */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white opacity-5 blur-[60px] rounded-full animate-shimmer"></div>
                      
                      {/* Standalone Golden Candle Holder */}
                      <div className="absolute top-[30%] left-[20%] z-20" style={{ transform: 'translateZ(10px)' }}>
                           <div className="relative w-8 h-32">
                               <div className="absolute bottom-0 w-12 h-4 bg-yellow-600 rounded-full -left-2 shadow-lg"></div>
                               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-20 bg-yellow-500"></div>
                               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-yellow-400 rounded-full"></div>
                               <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3 h-12 bg-white rounded-sm shadow-inner">
                                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-8 bg-orange-500 rounded-full blur-[2px] animate-flicker-real"></div>
                               </div>
                           </div>
                      </div>
                 </div>
            </div>

            {/* --- CARD BUTTON --- */}
            {showCardButton && !isCardOpen && (
                <div className="absolute bottom-12 z-50 animate-bounce">
                    <button 
                        onClick={() => setIsCardOpen(true)} 
                        className="bg-white/90 text-blue-600 px-10 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:bg-white border-2 border-blue-200 transition-colors flex items-center gap-2"
                    >
                        <Gift size={24} />
                        Open Greeting Card
                    </button>
                </div>
            )}

            {/* --- REALISTIC BOOK CARD MODAL --- */}
            {isCardOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                     <div className="book-container relative w-[320px] h-[440px] md:w-[420px] md:h-[560px] cursor-pointer" 
                          onClick={(e) => {
                             const book = e.currentTarget.querySelector('.book');
                             book?.classList.toggle('open');
                          }}>
                        <div className="book relative w-full h-full preserve-3d transition-transform duration-1000 shadow-2xl">
                            {/* Front Cover */}
                            <div className="cover absolute inset-0 z-20 origin-left preserve-3d duration-1000 bg-[#1e293b] rounded-r-md shadow-xl flex items-center justify-center border-l-4 border-gray-700">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-50 mix-blend-overlay"></div>
                                <div className="border-[3px] border-[#fbbf24] w-[85%] h-[90%] flex flex-col items-center justify-center p-6 border-double relative z-10">
                                    <Heart size={80} className="text-rose-500 fill-rose-500 drop-shadow-lg" />
                                    <h2 className="font-['Great_Vibes'] text-5xl text-[#fbbf24] mt-6 text-center">To My Love</h2>
                                    <p className="text-gray-400 text-xs mt-8 tracking-[0.4em] uppercase font-bold">Tap to Open</p>
                                </div>
                            </div>
                            
                            {/* Inside Page (Right) */}
                            <div className="page-right absolute inset-0 z-10 bg-[#f8fafc] rounded-r-md flex flex-col items-center justify-center p-8 text-center shadow-inner">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-30"></div>
                                <h3 className="font-['Great_Vibes'] text-6xl text-rose-600 mb-6 relative z-10">Happy Birthday!</h3>
                                <p className="font-['Montserrat'] text-gray-700 text-lg leading-loose font-medium relative z-10">
                                    "May your day be filled with magic, love, and all the sweetness you bring into my life."
                                </p>
                                <p className="font-['Montserrat'] text-blue-600 font-bold mt-6 text-xl relative z-10">
                                    I love you endlessly! ❤️
                                </p>
                            </div>
                        </div>
                     </div>
                     
                     <button className="absolute top-8 right-8 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors" onClick={() => setIsCardOpen(false)}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>
                </div>
            )}
      </div>
    </div>
  );
};

export default App;