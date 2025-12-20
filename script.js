// Config
const TOTAL_CANDLES = 12; // Adjusted to fit ring nicely
const BLOW_THRESHOLD = 30;

// Colors matching the image
const flagColors = ['#ffca28', '#ef5350', '#42a5f5', '#66bb6a', '#ab47bc'];
const candlePairs = [
    {c1: '#66bb6a', c2: '#a5d6a7'}, // Green
    {c1: '#ffca28', c2: '#ffe082'}, // Yellow
    {c1: '#42a5f5', c2: '#90caf9'}, // Blue
    {c1: '#ab47bc', c2: '#ce93d8'}, // Purple
    {c1: '#ef5350', c2: '#ef9a9a'}, // Red
];

// Elements
const buntingContainer = document.getElementById('bunting-container');
const decorationsLayer = document.getElementById('decorations-layer');
const plateDecorations = document.getElementById('plate-decorations');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('start-overlay');
const micIndicator = document.getElementById('mic-indicator');
const micLevelBar = document.getElementById('mic-level-bar');
const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

let isListening = false;
let candlesExtinguished = 0;
let audioContext, analyser, microphone;
let gameWon = false;

// --- Setup Scene ---

function initScene() {
    // 1. Create Bunting
    for(let i=0; i<10; i++) {
        const flag = document.createElement('div');
        flag.className = 'flag';
        flag.style.setProperty('--f-color', flagColors[i % flagColors.length]);
        flag.style.setProperty('--delay', `${i * 0.2}s`);
        buntingContainer.appendChild(flag);
    }

    // 2. Create Candles & Treats on Top Ring
    // Perspective math: x = radius * cos(a), y = radius * sin(a) * scaleY
    const radiusX = 200;
    const radiusY = 45; // Flattened for perspective
    const centerX = 220; // Center of .cake-group (width 440)
    const centerY = 65;  // Center of .cake-top (height 110/2 + offset)

    for (let i = 0; i < TOTAL_CANDLES; i++) {
        // Place candles evenly
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        
        // Z-Index fix: items in front (lower y in DOM, higher visual Y) should be on top
        // But in CSS `top` property: higher value = lower on screen = closer to viewer = higher z-index
        const zIndex = Math.floor(y); 

        // Create Candle
        const candle = document.createElement('div');
        candle.className = 'candle';
        const colors = candlePairs[i % candlePairs.length];
        candle.style.setProperty('--c1', colors.c1);
        candle.style.setProperty('--c2', colors.c2);
        candle.style.left = (x - 5) + 'px'; // Center anchor
        candle.style.top = (y - 65) + 'px'; // Move up so bottom sits on ring
        candle.style.zIndex = zIndex + 20; // Candles sit high
        
        const flame = document.createElement('div');
        flame.className = 'flame';
        candle.appendChild(flame);
        decorationsLayer.appendChild(candle);

        // Add Treats between candles
        const treatAngle = angle + (Math.PI / TOTAL_CANDLES);
        const tx = centerX + Math.cos(treatAngle) * radiusX * 0.9; // Slightly inner
        const ty = centerY + Math.sin(treatAngle) * radiusY * 0.9;
        const tZ = Math.floor(ty);

        if (i % 2 === 0) {
            // Truffle
            const truffle = document.createElement('div');
            truffle.className = i % 4 === 0 ? 'truffle' : 'truffle white';
            truffle.style.left = (tx - 15) + 'px';
            truffle.style.top = (ty - 15) + 'px';
            truffle.style.zIndex = tZ + 10;
            decorationsLayer.appendChild(truffle);
        } else {
            // Macaron
            const mac = document.createElement('div');
            mac.className = 'macaron';
            mac.style.setProperty('--mc', i % 3 === 0 ? '#4dd0e1' : '#f06292');
            mac.style.left = (tx - 17) + 'px';
            mac.style.top = (ty - 10) + 'px';
            mac.style.zIndex = tZ + 10;
            decorationsLayer.appendChild(mac);
        }
    }

    // 3. Plate Decorations (Random scatter at bottom)
    const plateItems = [
        { type: 'truffle', x: 20, y: 150 },
        { type: 'macaron', x: 80, y: 180, c: '#ffd54f' },
        { type: 'truffle white', x: 380, y: 170 },
        { type: 'macaron', x: 320, y: 190, c: '#e57373' }
    ];

    plateItems.forEach(item => {
        const el = document.createElement('div');
        el.className = item.type;
        if(item.c) el.style.setProperty('--mc', item.c);
        el.style.left = item.x + 'px';
        el.style.top = item.y + 'px';
        el.style.zIndex = 50; // On top of plate/cake base
        plateDecorations.appendChild(el);
    });
}

// --- Audio ---
async function startAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 512;
        isListening = true;
        overlay.classList.add('hidden');
        micIndicator.classList.remove('hidden');
        audioLoop();
    } catch(e) {
        alert("Microphone required!");
    }
}

function audioLoop() {
    if(!isListening || gameWon) return;

    const arr = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(arr);
    
    // Calculate average volume (low freq focus)
    let sum = 0;
    for(let i=0; i<50; i++) sum += arr[i];
    const vol = sum / 50;
    
    // UI Update
    micLevelBar.style.width = Math.min(100, vol * 2) + '%';
    
    // Flicker Candles
    const flames = document.querySelectorAll('.flame:not(.out)');
    flames.forEach(f => {
        const scale = 1 + (vol / 50);
        const rot = (Math.random()-0.5) * (vol / 2);
        f.style.transform = `translateX(-50%) scale(1, ${scale}) rotate(${rot}deg)`;
    });

    if(vol > BLOW_THRESHOLD) {
        if(Math.random() > 0.8 && flames.length > 0) {
            // Extinguish
            const target = flames[Math.floor(Math.random()*flames.length)];
            target.classList.add('out');
            
            // Smoke
            const smoke = document.createElement('div');
            smoke.className = 'smoke';
            target.parentElement.appendChild(smoke);
            setTimeout(() => smoke.remove(), 1000);
            
            candlesExtinguished++;
            if(candlesExtinguished >= TOTAL_CANDLES) win();
        }
    }
    
    requestAnimationFrame(audioLoop);
}

function win() {
    gameWon = true;
    isListening = false;
    micIndicator.classList.add('hidden');
    message.classList.remove('hidden');
    
    // Confetti
    startConfetti();
}

// --- Confetti ---
const particles = [];
function startConfetti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for(let i=0; i<300; i++) {
        particles.push({
            x: canvas.width/2, y: canvas.height/2,
            vx: (Math.random()-0.5)*30, vy: (Math.random()-1)*30,
            c: `hsl(${Math.random()*360}, 100%, 50%)`
        });
    }
    renderConfetti();
}
function renderConfetti() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach((p,i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.8;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 8, 8);
        if(p.y > canvas.height) particles.splice(i,1);
    });
    if(particles.length) requestAnimationFrame(renderConfetti);
}

startBtn.addEventListener('click', startAudio);
initScene();