const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

let handLandmarker;
let lastTime = -1;


// CAMERA
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    status.textContent = "Camera ready — loading hand tracking...";

    startHandTracking();

  } catch (error) {
    console.error(error);
    status.textContent = "Camera error: " + error.message;
  }
}


// MEDIAPIPE
async function startHandTracking() {
  try {

    const {
      HandLandmarker,
      FilesetResolver
    } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm"
    );

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
    );

    handLandmarker =
      await HandLandmarker.createFromOptions(vision, {

        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
        },

        runningMode: "VIDEO",

        numHands: 2,

        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

    status.textContent = " Hand tracking is ON!";

    trackHands();

  } catch (error) {

    console.error("HAND TRACKER ERROR:", error);

    status.textContent =
      "Hand tracker error. Open the browser console for details.";
  }
}


// TRACK HANDS
function trackHands() {

  if (!handLandmarker) {
    requestAnimationFrame(trackHands);
    return;
  }

  if (
    video.readyState >= 2 &&
    video.currentTime !== lastTime
  ) {

    lastTime = video.currentTime;

    const result =
      handLandmarker.detectForVideo(
        video,
        performance.now()
      );

    drawHands(result);
  }

  requestAnimationFrame(trackHands);
}


// DRAW HAND
function drawHands(result) {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (!result.landmarks) return;

  for (const hand of result.landmarks) {

    const connections = [
      [0,1], [1,2], [2,3], [3,4],
      [0,5], [5,6], [6,7], [7,8],
      [5,9], [9,10], [10,11], [11,12],
      [9,13], [13,14], [14,15], [15,16],
      [13,17], [17,18], [18,19], [19,20],
      [0,17]
    ];

    // Lines
    ctx.strokeStyle = "#00ff66";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    for (const [a, b] of connections) {

      const x1 = hand[a].x * canvas.width;
      const y1 = hand[a].y * canvas.height;

      const x2 = hand[b].x * canvas.width;
      const y2 = hand[b].y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }


    // Points
    ctx.fillStyle = "#00ff66";

    for (const point of hand) {

      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


startCamera();
