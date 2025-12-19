import { useState, useEffect, useRef, useCallback } from 'react';

export const useBlowDetection = (isActive: boolean, onBlow: () => void) => {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);

  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const array = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(array);

    let sum = 0;
    // Focus on lower frequencies where "blowing" usually registers strongly
    for (let i = 0; i < array.length / 2; i++) {
      sum += array[i];
    }
    const average = sum / (array.length / 2);

    // Threshold for "blowing"
    if (average > 45) {
      onBlow();
    }

    requestRef.current = requestAnimationFrame(checkAudioLevel);
  }, [onBlow]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 512;
      
      setIsListening(true);
      requestRef.current = requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to blow out the candles!");
    }
  };

  useEffect(() => {
    if (isActive && !isListening) {
      // We don't auto-start here to comply with browser autoplay policies usually,
      // but the component will trigger startListening via user interaction.
    }
    
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isActive, isListening, checkAudioLevel]);

  return { startListening, isListening };
};