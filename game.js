// Request camera permissions first
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    const video = document.getElementById("video");
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    console.error("Error accessing the webcam", err);
  });

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("video");
const scoreElement = document.getElementById("score");

let player1Score = 0;
let player2Score = 0;

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight / 2;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const paddleWidth = 10;
const paddleHeight = canvas.height / 3; // Increased paddle height
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;

// Removed smoothPaddleMovement function as we'll update paddle positions directly

const ballSize = canvas.width / 100; // Reduced from 80 to 100
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
const initialSpeedMultiplier = 0.2; // Reduced initial speed
const speedIncreaseRate = 0.05; // Speed increase after each hit
const maxSpeedMultiplier = 0.6; // Maximum speed cap
let currentSpeedMultiplier = initialSpeedMultiplier;
let ballSpeedX = (canvas.width / 160) * currentSpeedMultiplier;
let ballSpeedY = (canvas.width / 160) * currentSpeedMultiplier;

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
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw paddles
  drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#0f0");
  drawRect(
    canvas.width - paddleWidth,
    rightPaddleY,
    paddleWidth,
    paddleHeight,
    "#0f0"
  );

  // Draw ball
  drawCircle(ballX, ballY, ballSize, "#0f0");

  // Draw center line
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "#0f0";
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw debug information
  drawDebugInfo(
    leftPaddleY + paddleHeight / 2,
    rightPaddleY + paddleHeight / 2
  );
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
    (ballX < paddleWidth &&
      ballY > leftPaddleY &&
      ballY < leftPaddleY + paddleHeight) ||
    (ballX > canvas.width - paddleWidth &&
      ballY > rightPaddleY &&
      ballY < rightPaddleY + paddleHeight)
  ) {
    ballSpeedX = -ballSpeedX;
    playBounceSound();
    
    // Increase speed after successful hit
    currentSpeedMultiplier = Math.min(currentSpeedMultiplier + speedIncreaseRate, maxSpeedMultiplier);
    const speedMagnitude = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
    ballSpeedX = (ballSpeedX / speedMagnitude) * (canvas.width / 160) * currentSpeedMultiplier;
    ballSpeedY = (ballSpeedY / speedMagnitude) * (canvas.width / 160) * currentSpeedMultiplier;
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
  // Reset speed to initial value
  currentSpeedMultiplier = initialSpeedMultiplier;
  ballSpeedX =
    (Math.random() > 0.5 ? 1 : -1) * (canvas.width / 160) * currentSpeedMultiplier;
  ballSpeedY =
    (Math.random() > 0.5 ? 1 : -1) * (canvas.width / 160) * currentSpeedMultiplier;
}

const startButton = document.getElementById("startButton");

startButton.addEventListener("click", startGame);

function startGame() {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";

  // Add flip video button
  const flipButton = document.createElement("button");
  flipButton.textContent = "Flip Video";
  flipButton.style.position = "absolute";
  flipButton.style.top = "10px";
  flipButton.style.left = "10px";
  flipButton.addEventListener("click", () => {
    flipVideo = !flipVideo;
  });
  document.body.appendChild(flipButton);

  // Initialize audio context and play start sound
  initializeAudio();
  playStartSound();

  resetGame();
  gameLoop();
  setInterval(trackHands, 50); // Track hands more frequently (every 50ms)
}

// Initialize audio context
let audioContext;

function initializeAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
  updateGame();
  drawGame();
  requestAnimationFrame(gameLoop);
}

function drawHandIndicator(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDebugInfo(leftHandY, rightHandY) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "14px Arial";

  // Draw video dimensions
  ctx.fillText(`Video: ${video.videoWidth}x${video.videoHeight}`, 10, 20);

  // Draw canvas dimensions
  ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 40);

  // Draw hand positions
  ctx.fillText(`Left Hand: ${Math.round(leftHandY)}`, 10, 60);
  ctx.fillText(`Right Hand: ${Math.round(rightHandY)}`, canvas.width - 150, 60);

  // Draw paddle positions
  ctx.fillText(`Left Paddle: ${Math.round(leftPaddleY)}`, 10, 80);
  ctx.fillText(
    `Right Paddle: ${Math.round(rightPaddleY)}`,
    canvas.width - 150,
    80
  );

  // Draw hand indicators
  drawHandIndicator(paddleWidth, leftHandY);
  drawHandIndicator(canvas.width - paddleWidth, rightHandY);
}

// Initialize webcam
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    console.error("Error accessing the webcam", err);
  });

function playSound(frequency, duration) {
  if (!audioContext) return; // Don't play sound if audio context is not initialized

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration
  );
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

// Simplified hand tracking
let flipVideo = true; // New variable to control video flipping

function trackHands() {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (videoWidth === 0 || videoHeight === 0) {
    console.log("Video dimensions are zero. Video might not be ready.");
    return;
  }

  const canvasElement = document.createElement("canvas");
  canvasElement.width = videoWidth;
  canvasElement.height = videoHeight;
  const canvasCtx = canvasElement.getContext("2d");

  canvasCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
  const imageData = canvasCtx.getImageData(0, 0, videoWidth, videoHeight);
  const data = imageData.data;

  const leftHeatMap = new Array(videoHeight).fill(0);
  const rightHeatMap = new Array(videoHeight).fill(0);

  for (let y = 0; y < videoHeight; y++) {
    for (let x = 0; x < videoWidth; x++) {
      const i = (y * videoWidth + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Simple skin color detection
      if (
        r > 95 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        r - Math.min(g, b) > 15 &&
        Math.abs(r - g) > 15
      ) {
        if (flipVideo ? x >= videoWidth / 2 : x < videoWidth / 2) {
          leftHeatMap[y]++;
        } else {
          rightHeatMap[y]++;
        }
      }
    }
  }

  const leftHandY = findLargestClusterCenter(leftHeatMap);
  const rightHandY = findLargestClusterCenter(rightHeatMap);

  // Map hand positions to paddle positions, allowing full range of motion
  leftPaddleY = (leftHandY / videoHeight) * canvas.height - paddleHeight / 2;
  rightPaddleY = (rightHandY / videoHeight) * canvas.height - paddleHeight / 2;

  // Ensure paddle positions stay within canvas bounds
  leftPaddleY = Math.max(
    0,
    Math.min(canvas.height - paddleHeight, leftPaddleY)
  );
  rightPaddleY = Math.max(
    0,
    Math.min(canvas.height - paddleHeight, rightPaddleY)
  );

  // Debug visualization
  drawDebugInfo(
    (leftHandY / videoHeight) * canvas.height,
    (rightHandY / videoHeight) * canvas.height
  );
}

function findLargestClusterCenter(heatMap) {
  let maxClusterSize = 0;
  let clusterStart = 0;
  let clusterEnd = 0;
  let currentClusterSize = 0;
  let currentClusterStart = 0;

  for (let i = 0; i < heatMap.length; i++) {
    if (heatMap[i] > 0) {
      if (currentClusterSize === 0) {
        currentClusterStart = i;
      }
      currentClusterSize += heatMap[i];
    } else if (currentClusterSize > 0) {
      if (currentClusterSize > maxClusterSize) {
        maxClusterSize = currentClusterSize;
        clusterStart = currentClusterStart;
        clusterEnd = i - 1;
      }
      currentClusterSize = 0;
    }
  }

  // Check if the last cluster is the largest
  if (currentClusterSize > maxClusterSize) {
    clusterStart = currentClusterStart;
    clusterEnd = heatMap.length - 1;
  }

  // Return the center of the largest cluster
  return (clusterStart + clusterEnd) / 2;
}

// Start the webcam
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    console.error("Error accessing the webcam", err);
  });

video.addEventListener("loadedmetadata", () => {
  gameLoop();
  setInterval(trackHands, 50); // Track hands more frequently (every 50ms)
});
