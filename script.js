// Configuration
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 30; // Lowered for better sensitivity

// State
let candlesExtinguished = 0;
let isListening = false;
let audioContext;
let analyser;
let microphone;
let gameWon = false;

// Elements
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('start-overlay');
const candlesContainer = document.getElementById('candles-container');
const cakeContainer = document.getElementById('cake-container');
const headerText = document.getElementById('header-text');
const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Expanded Colors
const candleColors = [
    '#ff69b4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', 
    '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#eab308', '#f97316'
];
const sprinkleColors = ['#FFC107', '#FF5722', '#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#8BC34A', '#FFFFFF'];

// --- Audio Synthesizer (No external files) ---
const playSound = {
    blow: () => {
        if(!audioContext) return;
        // White noise for wind
        const bufferSize = audioContext.sampleRate * 0.5; // 0.5 seconds
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        const gain = audioContext.createGain();
        
        // Filter to make it sound more like wind/breath
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        noise.start();
    },
    win: () => {
        if(!audioContext) return;
        const now = audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
        
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.1, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.5);
        });
    }
};

// --- Initialization ---

function initCandles() {
    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const candle = document.createElement('div');
        candle.className = 'candle';
        
        const randomColor = candleColors[Math.floor(Math.random() * candleColors.length)];
        candle.style.setProperty('--c-color', randomColor);
        
        const flame = document.createElement('div');
        flame.className = 'flame';
        flame.id = `flame-${i}`;
        
        candle.appendChild(flame);
        candlesContainer.appendChild(candle);
    }
}

function initSprinkles() {
    const sprinkleContainers = document.querySelectorAll('.sprinkles-container');
    sprinkleContainers.forEach(container => {
        const count = Math.floor(Math.random() * 10) + 20; 
        for (let i = 0; i < count; i++) {
            const sprinkle = document.createElement('div');
            sprinkle.className = 'sprinkle';
            sprinkle.style.left = `${Math.random() * 90 + 5}%`;
            sprinkle.style.top = `${Math.random() * 90 + 5}%`;
            sprinkle.style.transform = `rotate(${Math.random() * 360}deg)`;
            sprinkle.style.backgroundColor = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];
            container.appendChild(sprinkle);
        }
    });
}

// --- Audio Handling ---

async function startListening() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        // Use a low-pass filter to isolate breath/wind sounds (bass heavy)
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        microphone.connect(filter);
        filter.connect(analyser);
        
        analyser.fftSize = 512; // Higher resolution
        
        isListening = true;
        overlay.classList.add('hidden');
        detectBlow();
    } catch (err) {
        console.error("Microphone error:", err);
        alert("We need microphone access to blow out the candles! Please allow it and try again.");
    }
}

function detectBlow() {
    if (!isListening || gameWon) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    // Focus on lower frequencies for blowing sound
    const lowFreqCount = Math.floor(bufferLength * 0.3);
    for (let i = 0; i < lowFreqCount; i++) {
        sum += dataArray[i];
    }
    const average = sum / lowFreqCount;

    // Visual feedback based on volume
    visualizeBlow(average);

    if (average > BLOW_THRESHOLD) {
        // Debounce slightly to prevent instant clear
        if (Math.random() > 0.1) {
            blowOutCandles();
        }
    }

    requestAnimationFrame(detectBlow);
}

function visualizeBlow(volume) {
    // Shake the candles and stretch flames based on volume
    const flames = document.querySelectorAll('.flame:not(.out)');
    const scaleY = 1 + (volume / 200);
    const shake = (Math.random() - 0.5) * (volume / 10);
    
    flames.forEach(flame => {
        flame.style.transform = `translateX(-50%) scale(1, ${scaleY}) rotate(${shake}deg)`;
        flame.style.opacity = 1 - (volume / 300); // Flicker dim
    });
    
    // Pulse the whole cake slightly
    if (volume > 10) {
        cakeContainer.style.transform = `translateY(${shake}px)`;
    }
}

function blowOutCandles() {
    if (candlesExtinguished >= TOTAL_CANDLES) return;

    const litFlames = Array.from(document.querySelectorAll('.flame:not(.out)'));
    
    if (litFlames.length > 0) {
        playSound.blow();
        
        const amount = Math.min(Math.floor(Math.random() * 2) + 1, litFlames.length);
        
        for (let i = 0; i < amount; i++) {
            const randomIndex = Math.floor(Math.random() * litFlames.length);
            const flame = litFlames[randomIndex];
            
            // Extinguish
            flame.classList.add('out');
            
            // Add Smoke
            const smoke = document.createElement('div');
            smoke.className = 'smoke';
            flame.parentElement.appendChild(smoke);
            
            // Cleanup smoke
            setTimeout(() => smoke.remove(), 1500);
            
            litFlames.splice(randomIndex, 1);
            candlesExtinguished++;
        }

        if (candlesExtinguished >= TOTAL_CANDLES) {
            celebrate();
        }
    }
}

function celebrate() {
    gameWon = true;
    isListening = false;
    
    // Reset visual transforms
    cakeContainer.style.transform = '';
    
    playSound.win();
    
    headerText.classList.add('hidden');
    setTimeout(() => {
        headerText.style.display = 'none';
        message.classList.remove('hidden');
        startConfetti(true); // Continuous burst
    }, 500);
}

// --- Confetti System ---
let particles = [];

function startConfetti(continuous = false) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Add initial blast
    addConfettiBatch(200, canvas.width / 2, canvas.height / 2);
    
    if (continuous) {
        animateConfetti();
    }
}

function addConfettiBatch(amount, x, y) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x: x,
            y: y,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: Math.random() * 8 + 4,
            speedX: (Math.random() - 0.5) * 20, // Explosive X
            speedY: (Math.random() - 1) * 20, // Explosive Y (Upwards)
            gravity: 0.5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        
        p.speedY += p.gravity; // Gravity
        p.speedX *= 0.96; // Air resistance
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        // Remove particles that fall off screen
        if (p.y > canvas.height + 50) {
            particles.splice(i, 1);
            i--;
        }
    }
    
    requestAnimationFrame(animateConfetti);
}

// Allow user to click for more confetti
canvas.addEventListener('click', (e) => {
    if(gameWon) {
        addConfettiBatch(50, e.clientX, e.clientY);
        playSound.win(); // Replay little jingle on click
    }
});

// Event Listeners
startBtn.addEventListener('click', startListening);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Run
initCandles();
initSprinkles();