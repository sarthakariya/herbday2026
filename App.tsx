
import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { BirthdayCake } from './components/BirthdayCake';
import { useBlowDetection } from './hooks/useBlowDetection';
import { Play, Mic, Volume2 } from 'lucide-react';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [candlesExtinguished, setCandlesExtinguished] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const TOTAL_CANDLES = 17;
  const audioContextRef = useRef<AudioContext | null>(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Win Sound Effect
  const playWinMusic = () => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;
        
        // Happy Birthday Jingle (Simplified)
        const notes = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63]; // C C D C F E
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
      // Extinguish 1-2 candles per blow event
      const amount = Math.floor(Math.random() * 2) + 1;
      setCandlesExtinguished(prev => Math.min(prev + amount, TOTAL_CANDLES));
    }
  };

  const { startListening, isListening, micLevel } = useBlowDetection(curtainsOpen, handleBlow);

  // Check Win
  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
      playWinMusic();
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    // Trigger curtain animation
    setTimeout(() => {
        setCurtainsOpen(true);
        startListening();
    }, 100);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a0b1c]">
      
      {/* --- STATIC BACKGROUND ELEMENTS --- */}
      <div className="spotlight"></div>
      
      {/* Bunting */}
      <div className="absolute top-0 w-full h-20 flex justify-between px-4 z-0 opacity-80 pointer-events-none">
         {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-transparent border-t-red-500 even:border-t-yellow-500 animate-pulse" style={{ animationDelay: `${i*0.1}s` }}></div>
         ))}
      </div>

      {/* Balloons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute left-[10%] bottom-[-100px] w-16 h-20 bg-red-500 rounded-[50%] opacity-60 animate-float-balloon shadow-lg"></div>
         <div className="absolute left-[80%] bottom-[-150px] w-16 h-20 bg-blue-500 rounded-[50%] opacity-60 animate-float-balloon shadow-lg" style={{ animationDelay: '2s' }}></div>
         <div className="absolute left-[40%] bottom-[-120px] w-20 h-24 bg-yellow-400 rounded-[50%] opacity-60 animate-float-balloon shadow-lg" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Confetti on Win */}
      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}

      {/* --- CURTAINS --- */}
      {hasStarted && (
        <>
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-900 to-red-700 z-50 shadow-2xl ${curtainsOpen ? 'animate-curtain-left' : ''}`}></div>
            <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-900 to-red-700 z-50 shadow-2xl ${curtainsOpen ? 'animate-curtain-right' : ''}`}></div>
        </>
      )}

      {/* --- MAIN UI --- */}
      <div className="relative z-40 flex flex-col items-center justify-center min-h-screen">
        
        {/* START SCREEN BUTTON */}
        {!hasStarted && (
          <div className="z-50 text-center animate-bounce">
             <button 
                onClick={handleStart}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-10 py-5 rounded-full text-2xl font-bold shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-110 transition-transform flex items-center gap-3"
             >
                <Play fill="white" /> Open the Surprise
             </button>
             <p className="text-white mt-4 font-light opacity-80">Turn up your volume & Allow Microphone</p>
          </div>
        )}

        {/* GAME SCREEN */}
        {hasStarted && (
            <div className={`transition-opacity duration-1000 ${curtainsOpen ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Header */}
                <div className="absolute top-20 w-full text-center">
                    <h1 className="font-['Great_Vibes'] text-6xl md:text-8xl text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] animate-pulse">
                        {showCelebration ? "Happy Birthday!" : "Make a Wish!"}
                    </h1>
                    {showCelebration && <p className="text-white text-xl mt-2 font-light">All your wishes have been granted ✨</p>}
                </div>

                {/* Mic Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    <Mic size={20} className={isListening ? "text-green-400" : "text-gray-400"} />
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75"
                            style={{ width: `${Math.min(micLevel * 3, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* The Cake Component */}
                <BirthdayCake candlesExtinguished={candlesExtinguished} />

                {/* Restart Button (Win State) */}
                {showCelebration && (
                    <div className="absolute bottom-20">
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-white text-pink-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100"
                        >
                            Replay
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default App;
