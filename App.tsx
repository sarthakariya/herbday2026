import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { BirthdayCake } from './components/BirthdayCake';
import { useBlowDetection } from './hooks/useBlowDetection';
import { Play, Mic } from 'lucide-react';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [candlesExtinguished, setCandlesExtinguished] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const TOTAL_CANDLES = 17;

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBlow = () => {
    if (candlesExtinguished < TOTAL_CANDLES) {
      // Extinguish random amount between 1 and 3 per blow detection
      const amount = Math.floor(Math.random() * 3) + 1;
      setCandlesExtinguished(prev => Math.min(prev + amount, TOTAL_CANDLES));
    }
  };

  const { startListening, isListening } = useBlowDetection(hasStarted, handleBlow);

  // Check for win condition
  useEffect(() => {
    if (candlesExtinguished >= TOTAL_CANDLES && !showCelebration) {
      setShowCelebration(true);
    }
  }, [candlesExtinguished, showCelebration]);

  const handleStart = () => {
    setHasStarted(true);
    startListening();
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center overflow-hidden font-sans relative">
      
      {/* Full screen confetti on win */}
      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={400}
        />
      )}

      {/* Decorative Balloons Background (CSS only) */}
      <div className="absolute top-10 left-10 text-6xl opacity-50 animate-float hidden md:block">🎈</div>
      <div className="absolute top-20 right-20 text-5xl opacity-50 animate-float hidden md:block" style={{ animationDelay: '1s' }}>🎈</div>
      <div className="absolute bottom-20 left-20 text-6xl opacity-40 animate-float hidden md:block" style={{ animationDelay: '2s' }}>🎉</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-40 animate-float hidden md:block" style={{ animationDelay: '1.5s' }}>🎁</div>

      {/* Main Content */}
      <div className="z-50 flex flex-col items-center w-full max-w-4xl p-4">
        
        {/* Header Message */}
        <div className="text-center mb-8 transition-all duration-1000 ease-in-out">
          {!showCelebration ? (
            <h1 className="text-4xl md:text-6xl font-script text-pink-600 drop-shadow-md">
              Make a Wish!
            </h1>
          ) : (
            <div className="animate-bounce">
              <h1 className="text-5xl md:text-7xl font-script text-purple-600 drop-shadow-lg mb-2">
                Happy Birthday!
              </h1>
              <p className="text-xl text-gray-700 font-sans">
                May all your wishes come true! ❤️
              </p>
            </div>
          )}
        </div>

        {/* Start Button / Instructions */}
        {!hasStarted ? (
          <button
            onClick={handleStart}
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
          >
            <Play fill="white" size={24} />
            Light the Candles
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
            </span>
          </button>
        ) : !showCelebration ? (
           <div className={`flex flex-col items-center gap-2 ${isListening ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
             <div className="bg-white/80 px-6 py-2 rounded-full shadow-sm flex items-center gap-2 text-gray-600 border border-pink-100">
               <Mic className={`w-5 h-5 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
               <span className="text-sm font-semibold">
                 {candlesExtinguished === 0 
                   ? "Blow into your microphone!" 
                   : "Keep blowing!"}
               </span>
             </div>
             <div className="text-xs text-gray-400">
               {TOTAL_CANDLES - candlesExtinguished} candles left
             </div>
           </div>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-white text-pink-600 rounded-full font-bold shadow-md hover:bg-gray-50 transition-colors"
          >
            Go Again
          </button>
        )}

        {/* The Cake */}
        <div className={`transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
          <BirthdayCake candlesExtinguished={candlesExtinguished} />
        </div>

      </div>
    </div>
  );
};

export default App;