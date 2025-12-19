// Configuration
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 50; // Adjust if too sensitive/insensitive (0-255)

// State
let candlesExtinguished = 0;
let isListening = false;
let audioContext;
let analyser;
let microphone;

// Elements
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('start-overlay');
const candlesContainer = document.getElementById('candles-container');
const headerText = document.getElementById('header-text');
const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Colors
const candleColors = ['#ff69b4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const sprinkleColors = ['#FFC107', '#FF5722', '#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#8BC34A'];

// Initialize Candles
function initCandles() {
    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const candle = document.createElement('div');
        candle.className = 'candle';
        
        // Random color
        const randomColor = candleColors[Math.floor(Math.random() * candleColors.length)];
        candle.style.setProperty('--c-color', randomColor);
        
        const flame = document.createElement('div');
        flame.className = 'flame';
        flame.id = `flame-${i}`;
        
        candle.appendChild(flame);
        candlesContainer.appendChild(candle);
    }
}

// Generate Sprinkles
function initSprinkles() {
    const sprinkleContainers = document.querySelectorAll('.sprinkles-container');
    
    sprinkleContainers.forEach(container => {
        // Add 20-30 sprinkles per layer
        const count = Math.floor(Math.random() * 10) + 20; 
        
        for (let i = 0; i < count; i++) {
            const sprinkle = document.createElement('div');
            sprinkle.className = 'sprinkle';
            
            // Random Position
            sprinkle.style.left = `${Math.random() * 100}%`;
            sprinkle.style.top = `${Math.random() * 100}%`;
            
            // Random Rotation
            sprinkle.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            // Random Color
            sprinkle.style.backgroundColor = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];
            
            container.appendChild(sprinkle);
        }
    });
}

// Audio Handling
async function startListening() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        isListening = true;
        overlay.classList.add('hidden'); // Hide start screen
        detectBlow();
    } catch (err) {
        console.error("Microphone error:", err);
        alert("We need microphone access to blow out the candles! Please allow it and try again.");
    }
}

function detectBlow() {
    if (!isListening) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume of lower frequencies (where blowing sound lives)
    let sum = 0;
    // We only check the first half of the frequency bins for low-pitched "wind" noise
    for (let i = 0; i < bufferLength / 2; i++) {
        sum += dataArray[i];
    }
    const average = sum / (bufferLength / 2);

    if (average > BLOW_THRESHOLD) {
        blowOutCandles();
    }

    requestAnimationFrame(detectBlow);
}

function blowOutCandles() {
    // If we've already done everything, stop
    if (candlesExtinguished >= TOTAL_CANDLES) return;

    // Find all currently lit flames
    const litFlames = Array.from(document.querySelectorAll('.flame:not(.out)'));
    
    if (litFlames.length > 0) {
        // Randomly pick 1 to 3 candles to extinguish at once for realism
        const amount = Math.min(Math.floor(Math.random() * 3) + 1, litFlames.length);
        
        for (let i = 0; i < amount; i++) {
            const randomIndex = Math.floor(Math.random() * litFlames.length);
            const flame = litFlames[randomIndex];
            
            // Add 'out' class to extinguish
            flame.classList.add('out');
            
            // Remove from our temp array so we don't pick it again this frame
            litFlames.splice(randomIndex, 1);
            
            candlesExtinguished++;
        }

        // Check for win condition
        if (candlesExtinguished >= TOTAL_CANDLES) {
            celebrate();
        }
    }
}

function celebrate() {
    isListening = false;
    if (audioContext) audioContext.close(); // Stop listening
    
    headerText.classList.add('hidden');
    setTimeout(() => {
        headerText.style.display = 'none';
        message.classList.remove('hidden');
        startConfetti();
    }, 500);
}

// Simple Confetti Implementation
let confettiParticles = [];

function startConfetti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create particles
    for (let i = 0; i < 300; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: Math.random() * 10 + 5,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 5 - 2
        });
    }
    
    animateConfetti();
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiParticles.forEach((p, index) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        
        // Reset if off screen
        if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
        }
    });
    
    requestAnimationFrame(animateConfetti);
}

// Event Listeners
startBtn.addEventListener('click', startListening);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Run
initCandles();
initSprinkles();