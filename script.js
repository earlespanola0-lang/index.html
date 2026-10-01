const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

let handLandmarker;
let lastVideoTime = -1;


// =========================
// START CAMERA FIRST
// =========================
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    video.srcObject = stream;

    await video.play();

    await new Promise(resolve => {
      if (video.readyState >= 2) {
        resolve();
      } else {
        video.onloadedmetadata = resolve;
      }
    });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    status.textContent = "Camera ready! Loading hand tracker...";

    loadHandTracker();

  } catch (error) {
    console.error(error);
    status.textContent = "Camera error: " + error.message;
  }
}


// =========================
// LOAD MEDIAPIPE
// =========================
async function loadHandTracker() {
  try {

    const {
      HandLandmarker,
      FilesetResolver
    } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs"
    );

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
        },

        runningMode: "VIDEO",
        numHands: 2
      }
    );

    status.textContent = "🖐️ Show your hand!";

    detectHands();

  } catch (error) {

    console.error(error);

    status.textContent =
      "Camera works, but the hand tracker failed to load.";

  }
}


// =========================
// DETECT HANDS
// =========================
function detectHands() {

  if (!handLandmarker) {
    requestAnimationFrame(detectHands);
    return;
  }

  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {

    lastVideoTime = video.currentTime;

    const results = handLandmarker.detectForVideo(
      video,
      performance.now()
    );

    drawHands(results);
  }

  requestAnimationFrame(detectHands);
}


// =========================
// DRAW HANDS
// =========================
function drawHands(results) {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (!results.landmarks) return;

  for (const landmarks of results.landmarks) {

    // Draw connections
    ctx.strokeStyle = "#00ff66";
    ctx.lineWidth = 5;

    const connections = [
      [0,1], [1,2], [2,3], [3,4],
      [0,5], [5,6], [6,7], [7,8],
      [5,9], [9,10], [10,11], [11,12],
      [9,13], [13,14], [14,15], [15,16],
      [13,17], [17,18], [18,19], [19,20],
      [0,17]
    ];

    for (const [a, b] of connections) {

      const x1 = landmarks[a].x * canvas.width;
      const y1 = landmarks[a].y * canvas.height;

      const x2 = landmarks[b].x * canvas.width;
      const y2 = landmarks[b].y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }


    // Draw 21 landmarks
    for (const point of landmarks) {

      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);

      ctx.fillStyle = "#00ff66";
      ctx.fill();
    }
  }
}


// START
startCamera();
