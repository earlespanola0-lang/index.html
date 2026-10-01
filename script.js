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
