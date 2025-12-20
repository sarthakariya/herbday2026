import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { BirthdayCake } from './components/BirthdayCake';
import { useBlowDetection } from './hooks/useBlowDetection';
import { Play, Mic, Heart } from 'lucide-react';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [candlesExtinguished, setCandlesExtinguished] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const TOTAL_CANDLES = 17;
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playWinMusic = () => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;
        // Happy Birthday / Celebration Melody
        const notes = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63, 261.63, 261.63, 293.66, 261.63, 392.00, 349.23];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'triangle'; // Softer tone
            gain.gain.setValueAtTime(0, t + i * 0.4);
            gain.gain.linearRampToValueAtTime(0.15, t + i * 0.4 + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.4 + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + i * 0.4);
            osc.stop(t + i * 0.4 + 0.6);
        });
    } catch (e) { console.error(e); }
  };

  const handleBlow = () => {
    if (candlesExtinguished < TOTAL_CANDLES) {
      // Extinguish 1-3 candles at a time for realism
      const amount = Math.floor(Math.random() * 3) + 1;
      setCandlesExtinguished(prev => Math.min(prev + amount, TOTAL_CANDLES));
    }
  };

  const { startListening, isListening, micLevel } = useBlowDetection(curtainsOpen, handleBlow);

  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
      playWinMusic();
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    // Slight delay to allow overlay to fade out before curtains move
    setTimeout(() => {
        setCurtainsOpen(true);
        startListening();
    }, 100);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a0b1c] flex flex-col font-['Montserrat'] selection:bg-pink-500 selection:text-white">
      
      {/* --- AMBIENT LIGHTING --- */}
      <div className="spotlight"></div>
      
      {/* --- CONFETTI --- */}
      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          gravity={0.12}
          colors={['#FF69B4', '#FFD700', '#FFFFFF', '#87CEEB']}
        />
      )}

      {/* --- FLOATING PARTICLES --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({length: 20}).map((_, i) => (
             <div key={i} className="absolute text-white/10 animate-float-balloon"
                  style={{
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${15 + Math.random() * 10}s`,
                      animationDelay: `${Math.random() * 5}s`,
                      fontSize: `${Math.random() * 30 + 10}px`
                  }}>
                  {Math.random() > 0.5 ? '♥' : '★'}
             </div>
          ))}
      </div>

      {/* --- CURTAINS (Managed by React) --- */}
      <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#5a0000] to-[#800000] z-[60] shadow-[10px_0_60px_rgba(0,0,0,0.8)] transition-transform duration-[3000ms] ease-in-out ${curtainsOpen ? '-translate-x-full' : 'translate-x-0'}`}>
            {/* Velvet Texture */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.3)_50px,transparent_60px)] opacity-50"></div>
      </div>
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#5a0000] to-[#800000] z-[60] shadow-[-10px_0_60px_rgba(0,0,0,0.8)] transition-transform duration-[3000ms] ease-in-out ${curtainsOpen ? 'translate-x-full' : 'translate-x-0'}`}>
            {/* Velvet Texture */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.3)_50px,transparent_60px)] opacity-50"></div>
      </div>

      {/* --- START SCREEN OVERLAY --- */}
      {!hasStarted && (
        <div className="absolute inset-0 z-[70] bg-[#2c0505] flex flex-col items-center justify-center transition-opacity duration-1000">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hearts.png')] opacity-10"></div>
             <button 
                onClick={handleStart} 
                className="group relative z-10 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-16 py-6 rounded-full text-3xl font-serif font-bold shadow-[0_0_60px_rgba(233,30,99,0.5)] border-2 border-pink-300 hover:scale-105 transition-transform flex items-center gap-4"
             >
                <Heart className="fill-white animate-pulse" size={36} />
                <span>Open Surprise</span>
             </button>
             <p className="mt-8 text-pink-200/80 tracking-[0.3em] uppercase text-sm font-semibold">Please Enable Microphone 🎙️</p>
        </div>
      )}

      {/* --- MAIN STAGE --- */}
      <div className={`flex-grow relative z-40 flex flex-col items-center justify-center transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Greeting Header */}
            <div className="absolute top-[8%] z-30 text-center w-full pointer-events-none select-none">
                <h1 className="font-['Great_Vibes'] text-6xl md:text-9xl text-[#FFD700] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-pulse">
                    {showCelebration ? "I Love You!" : "Make a Wish..."}
                </h1>
            </div>

            {/* Mic Meter UI */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-lg">
                <Mic size={20} className={isListening ? "text-green-400" : "text-gray-500"} />
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75 shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
                        style={{ width: `${Math.min(micLevel * 3, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* THE CAKE */}
            {/* Added 3D rotation to the container to tilt the whole scene slightly towards viewer */}
            <div className="relative z-20 transform rotate-x-12 scale-90 md:scale-100 transition-transform duration-1000">
                 <BirthdayCake candlesExtinguished={candlesExtinguished} />
            </div>

            {/* WOODEN TABLE */}
            <div className="absolute bottom-[-30vh] w-[180vw] h-[80vh] wood-texture rounded-[100%] z-10 transform rotate-x-12 shadow-[inset_0_20px_100px_rgba(0,0,0,0.9)] border-t-[12px] border-[#3e2723]">
                {/* Surface Reflection */}
                <div className="absolute top-[10%] left-[25%] w-[50%] h-[30%] bg-white blur-[100px] opacity-5 rounded-full pointer-events-none"></div>
            </div>

            {/* REPLAY BUTTON */}
            {showCelebration && (
                <div className="absolute bottom-12 z-50 animate-bounce">
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-white/90 backdrop-blur text-rose-600 px-10 py-4 rounded-full font-bold shadow-2xl hover:bg-white transition-colors"
                    >
                        Blow Again ❤️
                    </button>
                </div>
            )}
      </div>
    </div>
  );
};

export default App;
