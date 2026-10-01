import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

let handLandmarker;

async function setup() {

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },

      runningMode: "VIDEO",
      numHands: 2
    }
  );

  startCamera();
}

async function startCamera() {

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: 1280,
      height: 720
    }
  });

  video.srcObject = stream;

  video.addEventListener("loadeddata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    status.textContent = "✋ Show your hand!";
    detectHands();
  });
}

async function detectHands() {

  const results = handLandmarker.detectForVideo(
    video,
    performance.now()
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.landmarks) {

    for (const landmarks of results.landmarks) {

      for (const point of landmarks) {

        const x = point.x * canvas.width;
        const y = point.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);

        ctx.fillStyle = "#00ff88";
        ctx.fill();
      }

      // Connect the hand points
      const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
        [5,9],[9,13],[13,17]
      ];

      for (const [a,b] of connections) {

        const p1 = landmarks[a];
        const p2 = landmarks[b];

        ctx.beginPath();
        ctx.moveTo(
          p1.x * canvas.width,
          p1.y * canvas.height
        );

        ctx.lineTo(
          p2.x * canvas.width,
          p2.y * canvas.height
        );

        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(detectHands);
}

setup();
