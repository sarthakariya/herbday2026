// Config
const TOTAL_CANDLES = 12;
// Increased threshold significantly for low sensitivity (user must blow hard)
const BLOW_THRESHOLD = 75; 

// Colors
const flagColors = ['#ffca28', '#ef5350', '#42a5f5', '#66bb6a', '#ab47bc'];
const candlePairs = [
    {c1: '#66bb6a', c2: '#a5d6a7'}, 
    {c1: '#ffca28', c2: '#ffe082'}, 
    {c1: '#42a5f5', c2: '#90caf9'}, 
    {c1: '#ab47bc', c2: '#ce93d8'}, 
    {c1: '#ef5350', c2: '#ef9a9a'}, 
];

// Elements
const buntingContainer = document.getElementById('bunting-container');
const decorationsLayer = document.getElementById('decorations-layer');
const plateDecorations = document.getElementById('plate-decorations');
const micIndicator = document.getElementById('mic-indicator');
const micLevelBar = document.getElementById('mic-level-bar');
const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
const unlockLayer = document.getElementById('unlock-audio-layer');

let isListening = false;
let candlesExtinguished = 0;
let audioContext, analyser, microphone;
let gameWon = false;

// --- Setup Scene ---
function initScene() {
    // 1. Create Bunting
    for(let i=0; i<12; i++) {
        const flag = document.createElement('div');
        flag.className = 'flag';
        flag.style.setProperty('--f-color', flagColors[i % flagColors.length]);
        flag.style.setProperty('--delay', `${2.5 + (i * 0.1)}s`); // Start after cake drops
        buntingContainer.appendChild(flag);
    }

    // 2. Create Candles & Treats
    const radiusX = 200;
    const radiusY = 45;
    const centerX = 220; 
    const centerY = 65;  

    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        const zIndex = Math.floor(y); 

        // Candle
        const candle = document.createElement('div');
        candle.className = 'candle';
        const colors = candlePairs[i % candlePairs.length];
        candle.style.setProperty('--c1', colors.c1);
        candle.style.setProperty('--c2', colors.c2);
        candle.style.left = (x - 6) + 'px';
        candle.style.top = (y - 75) + 'px'; 
        candle.style.zIndex = zIndex + 20;
        
        const flame = document.createElement('div');
        flame.className = 'flame';
        candle.appendChild(flame);
        decorationsLayer.appendChild(candle);

        // Treats
        const treatAngle = angle + (Math.PI / TOTAL_CANDLES);
        const tx = centerX + Math.cos(treatAngle) * radiusX * 0.92;
        const ty = centerY + Math.sin(treatAngle) * radiusY * 0.92;
        const tZ = Math.floor(ty);

        if (i % 2 === 0) {
            const truffle = document.createElement('div');
            truffle.className = i % 4 === 0 ? 'truffle' : 'truffle white';
            truffle.style.left = (tx - 17) + 'px';
            truffle.style.top = (ty - 15) + 'px';
            truffle.style.zIndex = tZ + 10;
            decorationsLayer.appendChild(truffle);
        } else {
            const mac = document.createElement('div');
            mac.className = 'macaron';
            mac.style.setProperty('--mc', i % 3 === 0 ? '#4dd0e1' : '#f06292');
            mac.style.left = (tx - 20) + 'px';
            mac.style.top = (ty - 12) + 'px';
            mac.style.zIndex = tZ + 10;
            decorationsLayer.appendChild(mac);
        }
    }

    // 3. Plate Decorations
    const plateItems = [
        { type: 'truffle', x: 20, y: 150 },
        { type: 'macaron', x: 90, y: 170, c: '#ffd54f' },
        { type: 'truffle white', x: 380, y: 160 },
        { type: 'macaron', x: 340, y: 180, c: '#e57373' }
    ];

    plateItems.forEach(item => {
        const el = document.createElement('div');
        el.className = item.type;
        if(item.c) el.style.setProperty('--mc', item.c);
        el.style.left = item.x + 'px';
        el.style.top = item.y + 'px';
        el.style.zIndex = 50; 
        plateDecorations.appendChild(el);
    });
}

// --- Audio Logic ---
async function startAudio() {
    try {
        if(isListening) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256; // Smaller FFT for performance
        isListening = true;
        
        // Remove the unlock layer
        unlockLayer.style.display = 'none';
        micIndicator.classList.remove('hidden');
        
        audioLoop();
    } catch(e) {
        console.error(e);
        document.querySelector('.tap-hint').textContent = "Microphone access denied 😔";
    }
}

function audioLoop() {
    if(!isListening || gameWon) return;

    const arr = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(arr);
    
    // Low Sensitivity Logic:
    // Only check the very low frequencies (blow noise)
    // Range 0-10 covers distinct "whoosh" sounds
    let sum = 0;
    const binCount = 8;
    for(let i=0; i<binCount; i++) sum += arr[i];
    const avg = sum / binCount;
    
    // Normalize for display (just visual feedback)
    const visualVol = Math.min(100, avg);
    micLevelBar.style.width = visualVol + '%';
    
    // Candle flicker effect based on volume
    const flames = document.querySelectorAll('.flame:not(.out)');
    if (avg > 20) {
        flames.forEach(f => {
            // More chaotic when blowing
            const scale = 1 + (avg / 100);
            const skew = (Math.random() - 0.5) * 30;
            f.style.transform = `translateX(-50%) scale(${scale}) skewX(${skew}deg)`;
        });
    }

    // Trigger Blow Check
    if(avg > BLOW_THRESHOLD) {
        // Must be a sustained or strong blow
        if(Math.random() > 0.6 && flames.length > 0) {
            const target = flames[Math.floor(Math.random()*flames.length)];
            extinguish(target);
        }
    }
    
    requestAnimationFrame(audioLoop);
}

function extinguish(target) {
    if(target.classList.contains('out')) return;
    
    target.classList.add('out');
    
    // Create smoke puff
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    target.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1200);
    
    candlesExtinguished++;
    if(candlesExtinguished >= TOTAL_CANDLES) win();
}

function win() {
    gameWon = true;
    isListening = false;
    micIndicator.classList.add('hidden');
    
    // Small delay before message
    setTimeout(() => {
        message.classList.remove('hidden');
        startConfetti();
    }, 500);
}

// --- Confetti ---
const particles = [];
function startConfetti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for(let i=0; i<400; i++) {
        particles.push({
            x: canvas.width/2, y: canvas.height/2,
            vx: (Math.random()-0.5)*35, vy: (Math.random()-1)*35,
            c: `hsl(${Math.random()*360}, 100%, 60%)`,
            size: Math.random() * 8 + 4
        });
    }
    renderConfetti();
}
function renderConfetti() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach((p,i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.6;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if(p.y > canvas.height) particles.splice(i,1);
    });
    if(particles.length) requestAnimationFrame(renderConfetti);
}

// Unlock audio on first user interaction anywhere
document.body.addEventListener('click', startAudio, { once: true });
document.body.addEventListener('touchstart', startAudio, { once: true });

initScene();