/* --- CONFIGURATION --- */
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 40; // Sensitivity (0-255). Lower = more sensitive.

/* --- STATE --- */
let audioContext = null;
let analyser = null;
let microphone = null;
let isListening = false;
let candlesExtinguished = 0;
let hasWon = false;

/* --- DOM ELEMENTS --- */
const app = document.getElementById('app');
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const curtainLeft = document.getElementById('curtain-left');
const curtainRight = document.getElementById('curtain-right');
const micMeter = document.getElementById('mic-meter');
const micLevelEl = document.getElementById('mic-level');
const cakeContainer = document.getElementById('cake');
const headerText = document.getElementById('header-text');
const replayContainer = document.getElementById('replay-container');
const balloonContainer = document.getElementById('balloon-container');

/* --- INITIALIZATION --- */
function init() {
    renderCake();
    createBalloons();
    startBtn.addEventListener('click', startGame);
}

function renderCake() {
    // 1. Layers
    const bottomLayer = document.createElement('div');
    bottomLayer.className = 'cake-layer-bottom';
    cakeContainer.appendChild(bottomLayer);

    const topLayer = document.createElement('div');
    topLayer.className = 'cake-layer-top';
    cakeContainer.appendChild(topLayer);

    // 2. Text on Cake
    const textDiv = document.createElement('div');
    textDiv.className = "absolute top-[40%] left-1/2 -translate-x-1/2 z-20 text-4xl text-[#D81B60] font-['Great_Vibes'] rotate-[-5deg] drop-shadow-sm whitespace-nowrap";
    textDiv.innerText = "My Babyyy";
    topLayer.appendChild(textDiv);

    // 3. Candles
    // We place them in an oval on the top layer
    const colors = ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'];
    
    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const candle = document.createElement('div');
        candle.className = 'candle';
        
        // Oval math
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const xOffset = Math.cos(angle) * 140; // Width radius
        const yOffset = Math.sin(angle) * 60;  // Height radius
        
        // Randomize height slightly
        const height = 35 + Math.random() * 15;
        
        // CSS vars and styling
        candle.style.height = `${height}px`;
        candle.style.left = `calc(50% + ${xOffset}px)`;
        // The top of the cake is roughly at Y=20px inside the container logic
        // We position relative to the center of the cake top
        candle.style.top = `calc(20px + ${yOffset}px)`;
        candle.style.zIndex = Math.floor(yOffset + 100); // 3D z-sorting
        candle.style.setProperty('--c-color', colors[i % 4]);
        
        // Wick
        const wick = document.createElement('div');
        wick.className = 'wick';
        candle.appendChild(wick);

        // Flame
        const flame = document.createElement('div');
        flame.className = 'flame';
        flame.id = `flame-${i}`;
        candle.appendChild(flame);

        cakeContainer.appendChild(candle);
    }
}

function createBalloons() {
    const colors = ['bg-red-500', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-500'];
    for(let i=0; i<10; i++) {
        const b = document.createElement('div');
        b.className = `balloon ${colors[i%colors.length]}`;
        b.style.left = `${Math.random() * 100}%`;
        b.style.animationDelay = `${Math.random() * 5}s`;
        b.style.transform = `scale(${0.5 + Math.random() * 0.5})`;
        balloonContainer.appendChild(b);
    }
}

/* --- GAME LOGIC --- */
async function startGame() {
    // 1. Fade out overlay
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.remove(), 700);

    // 2. Open Curtains
    curtainLeft.classList.add('curtain-open-left');
    curtainRight.classList.add('curtain-open-right');

    // 3. Show App
    app.style.opacity = '1';

    // 4. Init Audio
    try {
        await setupAudio();
        micMeter.style.opacity = '1';
        gameLoop();
    } catch (err) {
        console.error("Mic denied", err);
        alert("Please allow microphone access to blow out the candles!");
    }
}

async function setupAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);

    // Low pass filter to isolate "wind" sounds (blowing) from high pitched noises
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600; 

    microphone.connect(filter);
    filter.connect(analyser);
    analyser.fftSize = 256;
    isListening = true;
}

function gameLoop() {
    if (!isListening) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    // We only check the lower frequencies where "blowing" energy usually sits
    const binCount = Math.floor(dataArray.length / 2); 
    for (let i = 0; i < binCount; i++) {
        sum += dataArray[i];
    }
    const average = sum / binCount;

    // Update UI Meter
    const widthPct = Math.min(100, (average / 80) * 100);
    micLevelEl.style.width = `${widthPct}%`;

    // Blow Detection
    if (average > BLOW_THRESHOLD && !hasWon) {
        handleBlow(average);
    } else {
        // Reset flames to upright if not blowing hard
        const flames = document.querySelectorAll('.flame:not(.out)');
        flames.forEach(f => f.style.transform = 'translateX(-50%) scale(1) rotate(0deg)');
    }

    requestAnimationFrame(gameLoop);
}

function handleBlow(intensity) {
    const flames = document.querySelectorAll('.flame:not(.out)');
    
    if (flames.length === 0) return;

    // Visual effect: Bend flames
    flames.forEach(f => {
        const randomBend = (Math.random() - 0.5) * 40;
        f.style.transform = `translateX(-50%) scale(0.9) skewX(${randomBend}deg)`;
        f.style.opacity = '0.7';
    });

    // Extinguish logic: Random chance based on intensity
    // The harder you blow, the higher the chance
    const chance = intensity / 200; // e.g. 50 / 200 = 0.25
    
    if (Math.random() < chance) {
        // Pick a random candle to extinguish
        const randomIndex = Math.floor(Math.random() * flames.length);
        const targetFlame = flames[randomIndex];
        extinguishCandle(targetFlame);
    }
}

function extinguishCandle(flameElement) {
    if (flameElement.classList.contains('out')) return;

    flameElement.classList.add('out');
    
    // Smoke Effect
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    // Append smoke to the candle container (parent of flame)
    flameElement.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1000);

    // Audio SFX (Procedural white noise puff)
    playPuffSound();

    candlesExtinguished++;

    // Check Win
    if (candlesExtinguished >= TOTAL_CANDLES) {
        triggerWin();
    }
}

function playPuffSound() {
    if (!audioContext) return;
    const osc = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    osc.buffer = buffer;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, audioContext.currentTime);
    
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
}

function triggerWin() {
    hasWon = true;
    headerText.innerText = "Happy Birthday!";
    replayContainer.classList.remove('hidden');

    // Confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: Math.random(), y: Math.random() - 0.2 } 
        }));
    }, 250);

    // Win Music (Simple Chime)
    playWinMelody();
}

function playWinMelody() {
    if (!audioContext) return;
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 523.25]; // C D E F G C
    const now = audioContext.currentTime;
    
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now + i*0.2);
        gain.gain.linearRampToValueAtTime(0.2, now + i*0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.2 + 0.4);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now + i*0.2);
        osc.stop(now + i*0.2 + 0.5);
    });
}

// Start
init();
