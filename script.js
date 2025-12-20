/* --- CONFIGURATION --- */
const TOTAL_CANDLES = 12; // Adjusted to fit the cake image nicely
const BLOW_SENSITIVITY = 35; // How loud needed to affect candles
const BLOW_EXTINGUISH_THRESHOLD = 50; // How loud to actually kill the flame
const CURTAIN_DURATION = 3000; // 3 seconds ms

/* --- STATE --- */
let audioCtx;
let analyser;
let microphone;
let dataArray;
let isListening = false;
let candlesExtinguished = 0;
let hasWon = false;
let candleElements = [];

/* --- DOM --- */
const app = document.getElementById('app');
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const curtainLeft = document.getElementById('curtain-left');
const curtainRight = document.getElementById('curtain-right');
const micMeterLevel = document.getElementById('mic-level');
const micMeterContainer = document.getElementById('mic-meter');
const candlesLayer = document.getElementById('candles-layer');
const headerText = document.getElementById('header-text');
const replayContainer = document.getElementById('replay-container');
const heartsContainer = document.getElementById('hearts-container');

/* --- INIT --- */
init();

function init() {
    createBackgroundHearts();
    placeCandles();
    startBtn.addEventListener('click', startExperience);
}

/* --- VISUALS --- */
function createBackgroundHearts() {
    const symbols = ['❤', '♥', '♡'];
    for(let i=0; i<30; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart-bg';
        heart.innerText = symbols[Math.floor(Math.random()*symbols.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
        heart.style.animationDelay = Math.random() * 10 + 's';
        heart.style.animationDuration = (Math.random() * 5 + 8) + 's';
        heartsContainer.appendChild(heart);
    }
}

function placeCandles() {
    // The image is a chocolate cake. We need to place candles on top.
    // Coordinates are percentages relative to the image container.
    // Based on the perspective of the specific Unsplash image chosen.
    
    // We'll arrange them in a rough circle on top of the cake surface
    const centerX = 50;
    const centerY = 35; // Top surface of the cake is higher up
    const radiusX = 25;
    const radiusY = 12; // Flattened circle due to perspective

    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;

        const candleWrap = document.createElement('div');
        candleWrap.className = 'candle-container';
        candleWrap.style.left = `${x}%`;
        candleWrap.style.top = `${y}%`;
        
        // Randomize z-index based on Y position (closer items on top)
        candleWrap.style.zIndex = Math.floor(y);

        const flame = document.createElement('div');
        flame.className = 'flame';
        flame.id = `flame-${i}`;
        
        const wick = document.createElement('div');
        wick.className = 'wick';
        
        const wax = document.createElement('div');
        wax.className = 'wax';

        candleWrap.appendChild(flame);
        candleWrap.appendChild(wick);
        candleWrap.appendChild(wax);
        
        candlesLayer.appendChild(candleWrap);
        candleElements.push({ el: candleWrap, flame: flame, x: x, active: true });
    }
}

/* --- FLOW --- */
async function startExperience() {
    // 1. Fade Overlay
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.remove(), 1000);

    // 2. Open Curtains (3 Seconds)
    document.body.classList.add('curtains-open');
    
    // 3. Audio Setup (Immediately ask for permission)
    try {
        await setupAudio();
        // Wait for curtain animation to finish before showing UI fully
        setTimeout(() => {
            app.style.opacity = '1';
            micMeterContainer.style.opacity = '1';
            headerText.style.opacity = '1';
            headerText.style.transform = 'translateY(0)';
            startGameLoop();
        }, CURTAIN_DURATION);
    } catch (e) {
        alert("Please allow Microphone access. It's needed to blow out the candles!");
        console.error(e);
    }
}

/* --- AUDIO ENGINE --- */
async function setupAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    microphone = audioCtx.createMediaStreamSource(stream);
    
    // Filter to isolate "wind" sounds (Low pass)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    
    microphone.connect(filter);
    filter.connect(analyser);
    
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    isListening = true;
}

/* --- PHYSICS LOOP --- */
function startGameLoop() {
    if (!isListening) return;

    requestAnimationFrame(startGameLoop);

    analyser.getByteFrequencyData(dataArray);

    // Calculate Volume (Focus on lower frequencies for blowing)
    let sum = 0;
    const binCount = dataArray.length / 3;
    for (let i = 0; i < binCount; i++) {
        sum += dataArray[i];
    }
    const volume = sum / binCount;

    // Update Mic Meter
    micMeterLevel.style.width = Math.min(100, (volume / 60) * 100) + '%';

    // Physics
    candleElements.forEach(candle => {
        if (!candle.active) return;

        if (volume > BLOW_SENSITIVITY) {
            // "Bend" the flame
            const bendDir = (candle.x - 50) > 0 ? 1 : -1; // Blow away from center (roughly)
            const strength = Math.min((volume - BLOW_SENSITIVITY) / 2, 20);
            
            candle.flame.style.transform = `translateX(-50%) scale(0.9) rotate(${bendDir * strength}deg) skewX(${bendDir * strength}deg)`;
            candle.flame.style.opacity = 0.6 + (Math.random() * 0.4);

            // Extinguish Logic
            if (volume > BLOW_EXTINGUISH_THRESHOLD) {
                // Random chance to extinguish based on how loud
                if (Math.random() < 0.05) {
                    extinguish(candle);
                }
            }
        } else {
            // Restore flame
            candle.flame.style.transform = `translateX(-50%) scale(1) rotate(0deg)`;
            candle.flame.style.opacity = 0.9;
        }
    });

    if (candlesExtinguished >= TOTAL_CANDLES && !hasWon) {
        triggerWin();
    }
}

function extinguish(candle) {
    if (!candle.active) return;
    candle.active = false;
    candle.flame.classList.add('out');
    candlesExtinguished++;

    // Spawn Smoke
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            const smoke = document.createElement('div');
            smoke.className = 'smoke-particle';
            // Randomize smoke trajectory
            smoke.style.left = (Math.random() * 10 + 45) + '%';
            candle.el.appendChild(smoke);
        }, i * 200);
    }
}

/* --- WIN SEQUENCE --- */
function triggerWin() {
    hasWon = true;
    
    // Change Text
    headerText.style.transition = 'opacity 0.5s';
    headerText.style.opacity = '0';
    setTimeout(() => {
        headerText.innerText = "Happy Birthday My Love!";
        headerText.style.color = "#d32f2f";
        headerText.style.opacity = '1';
    }, 500);

    // Show Replay
    replayContainer.classList.remove('hidden');
    setTimeout(() => {
        replayContainer.style.opacity = '1';
    }, 1000);

    // Confetti Explosion
    const duration = 5000;
    const end = Date.now() + duration;

    (function frame() {
        if (Date.now() > end) return;
        
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ef9a9a', '#e57373', '#ffebee', '#ffd700']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ef9a9a', '#e57373', '#ffebee', '#ffd700']
        });

        requestAnimationFrame(frame);
    }());
    
    playWinSound();
}

function playWinSound() {
    if(!audioCtx) return;
    // Simple arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C Major
    const now = audioCtx.currentTime;
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, now + i*0.2);
        gain.gain.linearRampToValueAtTime(0.1, now + i*0.2 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.2 + 1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i*0.2);
        osc.stop(now + i*0.2 + 1.2);
    });
}
