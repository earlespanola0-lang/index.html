const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const status = document.getElementById("status");

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

  } catch (error) {
    console.error(error);
    status.textContent = "Camera permission was denied or unavailable.";
  }
}

startCamera();
