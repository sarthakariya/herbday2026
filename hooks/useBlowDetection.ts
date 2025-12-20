
import { useState, useEffect, useRef, useCallback } from 'react';

// Sound Synthesis Utility
const playPuffSound = (ctx: AudioContext) => {
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
};

export const useBlowDetection = (isActive: boolean, onBlow: () => void) => {
  const [isListening, setIsListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const blowTriggeredRef = useRef(false);

  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const array = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(array);

    // Calculate average volume of lower frequencies
    let sum = 0;
    const binCount = Math.floor(array.length / 4); // Focus on bass/wind
    for (let i = 0; i < binCount; i++) {
      sum += array[i];
    }
    const average = sum / binCount;
    
    setMicLevel(average); // Expose for UI feedback

    // Threshold Lowered to 25 (very sensitive)
    // Add debounce/cooldown to prevent machine-gun triggering
    if (average > 25 && !blowTriggeredRef.current) {
      blowTriggeredRef.current = true;
      if (audioContextRef.current) playPuffSound(audioContextRef.current);
      onBlow();
      
      // Reset trigger after short delay
      setTimeout(() => {
        blowTriggeredRef.current = false;
      }, 100); 
    }

    requestRef.current = requestAnimationFrame(checkAudioLevel);
  }, [onBlow]);

  const startListening = async () => {
    if (isListening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Low pass filter to isolate "wind" noise
      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      microphoneRef.current.connect(filter);
      filter.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      
      setIsListening(true);
      requestRef.current = requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Fallback or alert logic could go here
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
         // We generally keep context open, but strict cleanup:
         // audioContextRef.current.close(); 
      }
    };
  }, []);

  return { startListening, isListening, micLevel };
};
