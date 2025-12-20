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
          
          // A chaotic mix of sawtooth waves to simulate a horn
          const osc1 = ctx.createOscillator();
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(300, t);
          osc1.frequency.linearRampToValueAtTime(500, t + 0.1); // Pitch bend up
          
          const osc2 = ctx.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(305, t);
          osc2.frequency.linearRampToValueAtTime(510, t + 0.1);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.5, t);
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
        const t = ctx.currentTime + 0.5; // Start after slight delay
        
        // Faster, Happier "Happy Birthday" Notes
        // Notes: G4, G4, A4, G4, C5, B4 ...
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
            osc.type = 'sawtooth'; // Brighter sound
            
            // Envelope
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
      
      // Delay for Card Button
      setTimeout(() => {
          setShowCardButton(true);
      }, 2000);
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    initAudio();
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

      {/* --- BALLOONS --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {[
            {color: '#f8bbd0'}, {color: '#e1bee7'}, {color: '#fff9c4'}, {color: '#b2dfdb'}, {color: '#ffccbc'}
           ].map((b, i) => (
              <div key={i} className="balloon"
                style={{ left: `${10 + i * 20}%`, '--color': b.color, '--duration': `${15+i}s`, '--delay': `${i*2}s` } as React.CSSProperties}>
              </div>
          ))}
      </div>

      {/* --- CURTAINS --- */}
      <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-rose-900 to-rose-700 z-[60] shadow-[10px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-[3000ms] ease-in-out ${curtainsOpen ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.2)_50px,transparent_60px)] opacity-30"></div>
      </div>
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-900 to-rose-700 z-[60] shadow-[-10px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-[3000ms] ease-in-out ${curtainsOpen ? 'translate-x-full' : 'translate-x-0'}`}>
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

      {/* --- MAIN CONTENT --- */}
      <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Header */}
            <div className="absolute top-[8%] z-30 text-center w-full pointer-events-none select-none">
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

            {/* --- 3D SCENE WRAPPER --- */}
            {/* This container rotates everything to 25 degrees so we see side + top */}
            <div className="relative w-full h-[600px] flex items-center justify-center preserve-3d transition-transform duration-1000" 
                 style={{ transform: 'rotateX(25deg)' }}>
                 
                 {/* CAKE */}
                 <div className="relative z-20" style={{ transform: 'translateY(-20px)' }}>
                      <BirthdayCake candlesExtinguished={candlesExtinguished} />
                 </div>

                 {/* TABLE - Now positioned RELATIVE to the cake in 3D space */}
                 <div className="absolute top-1/2 left-1/2 w-[180vw] h-[180vh] wood-texture rounded-full z-0"
                      style={{ 
                          transform: 'translate(-50%, -50%) translateZ(-50px)', // Pushes table BELOW cake
                          backgroundSize: '300px'
                      }}>
                      {/* Reflection */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white opacity-10 blur-3xl rounded-full"></div>
                      
                      {/* Gifts on Table */}
                      <div className="absolute top-[40%] left-[60%] w-20 h-20 bg-purple-400 shadow-xl flex items-center justify-center transform rotate-12" style={{ transform: 'translateZ(10px)' }}>
                          <div className="w-full h-4 bg-yellow-300 absolute"></div>
                          <div className="h-full w-4 bg-yellow-300 absolute"></div>
                      </div>
                      <div className="absolute top-[45%] left-[30%] w-16 h-16 bg-pink-400 shadow-xl flex items-center justify-center transform -rotate-12" style={{ transform: 'translateZ(10px)' }}>
                          <div className="w-full h-3 bg-white absolute"></div>
                          <div className="h-full w-3 bg-white absolute"></div>
                      </div>
                 </div>
            </div>

            {/* --- CARD BUTTON --- */}
            {showCardButton && !isCardOpen && (
                <div className="absolute bottom-12 z-50 animate-bounce">
                    <button 
                        onClick={() => setIsCardOpen(true)} 
                        className="bg-white text-rose-500 px-10 py-4 rounded-full font-bold shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:bg-rose-50 border-2 border-rose-100 transition-colors flex items-center gap-2"
                    >
                        <Gift size={24} />
                        Open Greeting Card
                    </button>
                </div>
            )}

            {/* --- GREETING CARD MODAL --- */}
            {isCardOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                     <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px] perspective-1000 cursor-pointer group" onClick={(e) => {
                         // Simple toggle for click effect if desired, but we mostly just show it open
                         const target = e.currentTarget.querySelector('.card-inner');
                         target?.classList.toggle('open');
                     }}>
                        <div className="card-inner w-full h-full duration-1000">
                            {/* Front */}
                            <div className="card-front flex flex-col items-center justify-center bg-pink-100 rounded-xl shadow-2xl border-4 border-white">
                                <Heart size={64} className="text-rose-500 fill-rose-500 animate-pulse" />
                                <h2 className="font-['Great_Vibes'] text-4xl text-rose-600 mt-4">For You</h2>
                                <p className="text-rose-400 text-sm mt-2 font-bold uppercase tracking-widest">Tap to Open</p>
                            </div>

                            {/* Back (Inside Left) - when flipped it is the left side */}
                            <div className="card-inside-left absolute top-0 left-0 w-full h-full bg-white rounded-xl shadow-2xl border-2 border-pink-100 flex flex-col items-center justify-center p-6 text-center transform rotate-y-180 backface-hidden">
                                <h3 className="font-['Great_Vibes'] text-5xl text-rose-600 mb-6">Happy Birthday!</h3>
                                <p className="font-['Montserrat'] text-gray-700 leading-relaxed mb-4">
                                    Happy Birthday my baby and many many happy returns of the day!
                                </p>
                                <p className="font-['Montserrat'] text-rose-500 font-bold">
                                    I love you so much! ❤️
                                </p>
                                <div className="mt-8 text-4xl">🎂🎁🎈</div>
                            </div>
                        </div>
                     </div>
                     
                     <button className="absolute top-8 right-8 text-white bg-white/20 hover:bg-white/40 rounded-full p-2" onClick={() => setIsCardOpen(false)}>
                         Close
                     </button>
                </div>
            )}
      </div>
    </div>
  );
};

export default App;
