<script type="module">
  import {
    HandLandmarker,
    FilesetResolver
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs";

  window.HandLandmarker = HandLandmarker;
  window.FilesetResolver = FilesetResolver;
</script>

const video = document.getElementById("video");
const status = document.getElementById("status");

async function startCamera() {
  try {
    status.textContent = "Requesting camera permission...";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    video.srcObject = stream;
    status.textContent = "✅ Camera working!";

  } catch (error) {
    status.textContent = "❌ Camera error: " + error.message;
    console.error(error);
  }
}

startCamera();
