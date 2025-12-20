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
        // Celebration Melody (Soft & Happy)
        const notes = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63, 261.63, 261.63, 293.66, 261.63, 392.00, 349.23];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'triangle';
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
    setTimeout(() => {
        setCurtainsOpen(true);
        startListening();
    }, 100);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex flex-col font-['Montserrat'] selection:bg-rose-300 selection:text-white">
      
      {/* --- AMBIENT LIGHTING --- */}
      <div className="spotlight"></div>
      
      {/* --- CONFETTI (Rose Gold Theme) --- */}
      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          gravity={0.12}
          colors={['#f48fb1', '#f8bbd0', '#ffd700', '#ffffff', '#81d4fa']}
        />
      )}

      {/* --- FLOATING PARTICLES --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({length: 25}).map((_, i) => (
             <div key={i} className="absolute text-rose-300/30 animate-float-balloon"
                  style={{
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${15 + Math.random() * 10}s`,
                      animationDelay: `${Math.random() * 5}s`,
                      fontSize: `${Math.random() * 30 + 10}px`
                  }}>
                  {Math.random() > 0.6 ? '♥' : '✨'}
             </div>
          ))}
      </div>

      {/* --- BALLOONS (Pastel) --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {[
            {c:'var(--color-1)', l:'10%', color: '#f8bbd0'}, // pink
            {c:'var(--color-2)', l:'85%', color: '#e1bee7'}, // purple
            {c:'var(--color-3)', l:'25%', color: '#fff9c4'}, // yellow
            {c:'var(--color-4)', l:'70%', color: '#b2dfdb'}, // teal
            {c:'var(--color-5)', l:'50%', color: '#ffccbc'}  // orange
           ].map((b, i) => (
              <div key={i} className="balloon"
                style={{ left: b.l, '--color': b.color, '--duration': `${15+i}s`, '--delay': `${i*2}s` } as React.CSSProperties}>
              </div>
          ))}
      </div>

      {/* --- CURTAINS --- */}
      <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-rose-800 to-rose-600 z-[60] shadow-[10px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-[3000ms] ease-in-out ${curtainsOpen ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.2)_50px,transparent_60px)] opacity-30"></div>
      </div>
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-800 to-rose-600 z-[60] shadow-[-10px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-[3000ms] ease-in-out ${curtainsOpen ? 'translate-x-full' : 'translate-x-0'}`}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.2)_50px,transparent_60px)] opacity-30"></div>
      </div>

      {/* --- START SCREEN --- */}
      {!hasStarted && (
        <div className="absolute inset-0 z-[70] bg-[#fff0f5] flex flex-col items-center justify-center transition-opacity duration-1000">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hearts.png')] opacity-20"></div>
             <button 
                onClick={handleStart} 
                className="group relative z-10 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-16 py-6 rounded-full text-3xl font-serif font-bold shadow-[0_10px_40px_rgba(233,30,99,0.3)] border-4 border-white hover:scale-105 transition-transform flex items-center gap-4 cursor-pointer"
             >
                <Heart className="fill-white animate-pulse" size={36} />
                <span>Open Surprise</span>
             </button>
             <p className="mt-8 text-rose-400 tracking-[0.3em] uppercase text-sm font-bold bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">Enable Microphone 🎙️</p>
        </div>
      )}

      {/* --- MAIN CONTENT CENTERED --- */}
      <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Header */}
            <div className="absolute top-[10%] z-30 text-center w-full pointer-events-none select-none">
                <h1 className="font-['Great_Vibes'] text-6xl md:text-8xl text-rose-500 drop-shadow-sm animate-pulse">
                    {showCelebration ? "I Love You!" : "Make a Wish..."}
                </h1>
            </div>

            {/* Mic Meter */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-2 rounded-full border border-rose-200 shadow-xl">
                <Mic size={20} className={isListening ? "text-green-500" : "text-gray-400"} />
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-green-400 to-rose-500 transition-all duration-75" 
                        style={{ width: `${Math.min(micLevel * 3, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* CAKE SCENE - Perfectly Centered */}
            <div className="relative z-20 transition-transform duration-1000">
                 <BirthdayCake candlesExtinguished={candlesExtinguished} />
            </div>

            {/* TABLE - Lowered for eye-level perspective */}
            <div className="absolute bottom-[-50vh] w-[200vw] h-[100vh] wood-texture rounded-[100%] z-10 transform rotate-x-12 shadow-[inset_0_50px_100px_rgba(0,0,0,0.2)] border-t-[8px] border-[#a1887f]"></div>

            {/* REPLAY */}
            {showCelebration && (
                <div className="absolute bottom-12 z-50 animate-bounce">
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-white text-rose-500 px-10 py-4 rounded-full font-bold shadow-2xl hover:bg-rose-50 border-2 border-rose-100 transition-colors"
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