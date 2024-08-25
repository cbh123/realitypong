const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('video');
const scoreElement = document.getElementById('score');

let player1Score = 0;
let player2Score = 0;

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const paddleWidth = 10;
const paddleHeight = canvas.height / 4;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
let leftPaddleTargetY = leftPaddleY;
let rightPaddleTargetY = rightPaddleY;
const paddleSmoothingFactor = 0.3;

function smoothPaddleMovement() {
    leftPaddleY += (leftPaddleTargetY - leftPaddleY) * paddleSmoothingFactor;
    rightPaddleY += (rightPaddleTargetY - rightPaddleY) * paddleSmoothingFactor;
}

const ballSize = canvas.width / 80;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
const speedMultiplier = 0.3;
let ballSpeedX = canvas.width / 160 * speedMultiplier;
let ballSpeedY = canvas.width / 160 * speedMultiplier;

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
}

function drawGame() {
    // Clear the canvas with a semi-transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, '#0f0');
    drawRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, '#0f0');

    // Draw ball
    drawCircle(ballX, ballY, ballSize, '#0f0');

    // Draw center line
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#0f0';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw debug information
    drawDebugInfo(leftPaddleTargetY + paddleHeight / 2, rightPaddleTargetY + paddleHeight / 2);
}

function updateGame() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top and bottom walls
    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY = -ballSpeedY;
        playBounceSound();
    }

    // Ball collision with paddles
    if (
        (ballX < paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) ||
        (ballX > canvas.width - paddleWidth && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight)
    ) {
        ballSpeedX = -ballSpeedX;
        playBounceSound();
    }

    // Score points
    if (ballX < 0) {
        player2Score++;
        playScoreSound();
        resetBall();
    } else if (ballX > canvas.width) {
        player1Score++;
        playScoreSound();
        resetBall();
    }

    scoreElement.textContent = `Player 1: ${player1Score} | Player 2: ${player2Score}`;
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    // Ensure the ball speed is correct after reset
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * (canvas.width / 160) * speedMultiplier;
    ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * (canvas.width / 160) * speedMultiplier;
}

const startButton = document.getElementById('startButton');

startButton.addEventListener('click', startGame);

function startGame() {
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    playStartSound();
    resetGame();
    gameLoop();
    setInterval(trackHands, 100); // Track hands every 100ms
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    resetBall();
    leftPaddleY = canvas.height / 2 - paddleHeight / 2;
    rightPaddleY = canvas.height / 2 - paddleHeight / 2;
    scoreElement.textContent = `Player 1: 0 | Player 2: 0`;
}

function gameLoop() {
    smoothPaddleMovement();
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function drawDebugInfo(leftHandY, rightHandY) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px Arial';

    // Draw left hand position
    if (leftHandY !== null) {
        const leftHandCanvasY = (leftHandY / video.videoHeight) * canvas.height;
        ctx.fillText(`Left Hand: ${Math.round(leftHandCanvasY)}`, 10, 20);
        ctx.beginPath();
        ctx.arc(paddleWidth, leftHandCanvasY, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw right hand position
    if (rightHandY !== null) {
        const rightHandCanvasY = (rightHandY / video.videoHeight) * canvas.height;
        ctx.fillText(`Right Hand: ${Math.round(rightHandCanvasY)}`, canvas.width - 150, 20);
        ctx.beginPath();
        ctx.arc(canvas.width - paddleWidth, rightHandCanvasY, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw paddle positions
    ctx.fillText(`Left Paddle: ${Math.round(leftPaddleY)}`, 10, 40);
    ctx.fillText(`Right Paddle: ${Math.round(rightPaddleY)}`, canvas.width - 150, 40);
}

// Initialize webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
        video.play();
    })
    .catch((err) => {
        console.error("Error accessing the webcam", err);
    });

// Audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
}

function playBounceSound() {
    playSound(500, 0.1);
}

function playScoreSound() {
    playSound(700, 0.15);
}

function playStartSound() {
    playSound(400, 0.5);
}

// Simple hand tracking
function trackHands() {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const canvasElement = document.createElement('canvas');
    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;
    const canvasCtx = canvasElement.getContext('2d');

    canvasCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
    const imageData = canvasCtx.getImageData(0, 0, videoWidth, videoHeight);
    const data = imageData.data;

    let leftHandY = 0;
    let rightHandY = 0;
    let leftCount = 0;
    let rightCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple skin color detection
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 15 && Math.abs(r - g) > 15) {
            const y = Math.floor((i / 4) / videoWidth);
            const x = (i / 4) % videoWidth;

            // Account for mirrored video
            if (x < videoWidth / 2) {
                leftHandY += y;
                leftCount++;
            } else {
                rightHandY += y;
                rightCount++;
            }
        }
    }

    // Calculate paddle positions based on hand positions
    if (leftCount > 0) {
        const leftHandAvg = leftHandY / leftCount;
        leftPaddleTargetY = (leftHandAvg / videoHeight) * canvas.height - paddleHeight / 2;
    }
    if (rightCount > 0) {
        const rightHandAvg = rightHandY / rightCount;
        rightPaddleTargetY = (rightHandAvg / videoHeight) * canvas.height - paddleHeight / 2;
    }

    // Ensure paddle targets stay within canvas bounds
    leftPaddleTargetY = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddleTargetY));
    rightPaddleTargetY = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddleTargetY));

    // Debug visualization
    drawDebugInfo(leftCount > 0 ? leftHandY / leftCount : null, rightCount > 0 ? rightHandY / rightCount : null);
}

// Start the webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
        video.play();
    })
    .catch((err) => {
        console.error("Error accessing the webcam", err);
    });

video.addEventListener('loadedmetadata', () => {
    gameLoop();
    setInterval(trackHands, 100); // Track hands every 100ms
});

