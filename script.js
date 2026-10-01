const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const threeCanvas =
  document.getElementById("threeCanvas");

const status =
  document.getElementById("status");

const handStatus =
  document.getElementById("handStatus");

const gestureText =
  document.getElementById("gesture");

const zoomText =
  document.getElementById("zoom");


let handLandmarker = null;

let lastVideoTime = -1;

let THREE = null;

let scene = null;

let camera = null;

let renderer = null;

let object = null;

let targetRotationX = 0;

let targetRotationY = 0;

let currentZoom = 1;


// ======================================
// CAMERA
// ======================================

async function startCamera() {

  try {

    const stream =
      await navigator.mediaDevices
      .getUserMedia({

        video: {
          facingMode: "user",

          width: {
            ideal: 1280
          },

          height: {
            ideal: 720
          }

        },

        audio: false

      });


    video.srcObject = stream;

    await video.play();


    await new Promise(resolve => {

      if (video.readyState >= 2) {

        resolve();

      } else {

        video.onloadedmetadata =
          resolve;

      }

    });


    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;


    status.textContent =
      "Camera online. Initializing 3D system.";


    startThree();

    loadMediaPipe();

  }

  catch (error) {

    console.error(error);

    status.textContent =
      "Camera error: " +
      error.message;

  }

}


// ======================================
// THREE.JS
// ======================================

async function startThree() {

  try {

    THREE = await import(
      "https://cdn.jsdelivr.net/npm/three@0.180.0/+esm"
    );


    scene =
      new THREE.Scene();


    camera =
      new THREE.PerspectiveCamera(
        45,
        1,
        0.1,
        100
      );


    camera.position.z = 5;


    renderer =
      new THREE.WebGLRenderer({

        canvas: threeCanvas,

        alpha: true,

        antialias: true

      });


    renderer.setPixelRatio(

      Math.min(
        window.devicePixelRatio,
        2
      )

    );


    resizeThree();


    createHologram();


    animate();

  }

  catch (error) {

    console.error(
      "THREE ERROR:",
      error
    );

    status.textContent =
      "3D system failed to load.";

  }

}


// ======================================
// CREATE 3D OBJECT
// ======================================

function createHologram() {

  const geometry =
    new THREE.IcosahedronGeometry(
      1.25,
      2
    );


  const material =
    new THREE.MeshBasicMaterial({

      color: 0x00eaff,

      wireframe: true,

      transparent: true,

      opacity: 0.95

    });


  object =
    new THREE.Mesh(
      geometry,
      material
    );


  scene.add(object);


  // Inner holographic core

  const coreGeometry =
    new THREE.IcosahedronGeometry(
      0.65,
      1
    );


  const coreMaterial =
    new THREE.MeshBasicMaterial({

      color: 0x00ffff,

      wireframe: true,

      transparent: true,

      opacity: 0.2

    });


  const core =
    new THREE.Mesh(
      coreGeometry,
      coreMaterial
    );


  object.add(core);


  // Outer ring

  const ringGeometry =
    new THREE.TorusGeometry(
      1.55,
      0.015,
      16,
      100
    );


  const ringMaterial =
    new THREE.MeshBasicMaterial({

      color: 0x00eaff,

      transparent: true,

      opacity: 0.8

    });


  const ring =
    new THREE.Mesh(
      ringGeometry,
      ringMaterial
    );


  ring.rotation.x =
    Math.PI / 2;


  object.add(ring);

}


// ======================================
// RESIZE
// ======================================

function resizeThree() {

  if (!renderer || !camera) {
    return;
  }


  const width =
    threeCanvas.clientWidth;

  const height =
    threeCanvas.clientHeight;


  renderer.setSize(
    width,
    height,
    false
  );


  camera.aspect =
    width / height;


  camera.updateProjectionMatrix();

}


window.addEventListener(
  "resize",
  resizeThree
);


// ======================================
// ANIMATION
// ======================================

function animate() {

  requestAnimationFrame(
    animate
  );


  if (!object) {
    return;
  }


  object.rotation.y +=
    (
      targetRotationY -
      object.rotation.y
    ) * 0.08;


  object.rotation.x +=
    (
      targetRotationX -
      object.rotation.x
    ) * 0.08;


  object.rotation.z +=
    0.003;


  const scale =
    currentZoom;


  object.scale.x +=
    (
      scale -
      object.scale.x
    ) * 0.08;


  object.scale.y +=
    (
      scale -
      object.scale.y
    ) * 0.08;


  object.scale.z +=
    (
      scale -
      object.scale.z
    ) * 0.08;


  renderer.render(
    scene,
    camera
  );

}


// ======================================
// MEDIAPIPE
// ======================================

async function loadMediaPipe() {

  try {

    const {

      HandLandmarker,

      FilesetResolver

    } = await import(

      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm"

    );


    const vision =
      await FilesetResolver
      .forVisionTasks(

        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"

      );


    handLandmarker =
      await HandLandmarker
      .createFromOptions(

        vision,

        {

          baseOptions: {

            modelAssetPath:

              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

          },

          runningMode:
            "VIDEO",

          numHands: 2,

          minHandDetectionConfidence:
            0.5,

          minHandPresenceConfidence:
            0.5,

          minTrackingConfidence:
            0.5

        }

      );


    status.textContent =
      "SYSTEM READY. MOVE YOUR HAND.";

    handStatus.textContent =
      "READY";


    trackHands();

  }

  catch (error) {

    console.error(
      "MEDIAPIPE ERROR:",
      error
    );

    status.textContent =
      "Hand tracking failed.";

  }

}


// ======================================
// TRACK HANDS
// ======================================

function trackHands() {

  if (!handLandmarker) {

    requestAnimationFrame(
      trackHands
    );

    return;

  }


  if (

    video.readyState >= 2 &&

    video.currentTime !==
      lastVideoTime

  ) {

    lastVideoTime =
      video.currentTime;


    const results =
      handLandmarker
      .detectForVideo(

        video,

        performance.now()

      );


    drawHands(results);

    controlObject(results);

  }


  requestAnimationFrame(
    trackHands
  );

}


// ======================================
// DRAW HAND
// ======================================

function drawHands(results) {

  ctx.clearRect(

    0,
    0,
    canvas.width,
    canvas.height

  );


  if (

    !results.landmarks ||

    results.landmarks.length === 0

  ) {

    handStatus.textContent =
      "SEARCHING";

    gestureText.textContent =
      "NONE";

    return;

  }


  handStatus.textContent =
    "TRACKING";


  const connections = [

    [0,1],
    [1,2],
    [2,3],
    [3,4],

    [0,5],
    [5,6],
    [6,7],
    [7,8],

    [5,9],
    [9,10],
    [10,11],
    [11,12],

    [9,13],
    [13,14],
    [14,15],
    [15,16],

    [13,17],
    [17,18],
    [18,19],
    [19,20],

    [0,17]

  ];


  for (
    const hand
    of results.landmarks
  ) {

    ctx.strokeStyle =
      "#00eaff";

    ctx.lineWidth = 4;

    ctx.shadowColor =
      "#00eaff";

    ctx.shadowBlur = 10;


    for (
      const [a, b]
      of connections
    ) {

      const x1 =
        hand[a].x *
        canvas.width;

      const y1 =
        hand[a].y *
        canvas.height;


      const x2 =
        hand[b].x *
        canvas.width;

      const y2 =
        hand[b].y *
        canvas.height;


      ctx.beginPath();

      ctx.moveTo(
        x1,
        y1
      );

      ctx.lineTo(
        x2,
        y2
      );

      ctx.stroke();

    }


    ctx.fillStyle =
      "#00ffff";


    for (
      const point
      of hand
    ) {

      const x =
        point.x *
        canvas.width;

      const y =
        point.y *
        canvas.height;


      ctx.beginPath();

      ctx.arc(
        x,
        y,
        6,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }


    ctx.shadowBlur = 0;

  }

}


// ======================================
// HAND CONTROLS 3D OBJECT
// ======================================

function controlObject(results) {

  if (

    !results.landmarks ||

    results.landmarks.length === 0

  ) {

    return;

  }


  const hand =
    results.landmarks[0];


  const indexFinger =
    hand[8];


  // Horizontal hand movement
  // controls Y rotation

  targetRotationY =
    (indexFinger.x - 0.5)
    * Math.PI * 2;


  // Vertical hand movement
  // controls X rotation

  targetRotationX =
    (indexFinger.y - 0.5)
    * Math.PI;


  // ====================================
  // PINCH
  // ====================================

  const thumb =
    hand[4];


  const dx =
    thumb.x -
    indexFinger.x;


  const dy =
    thumb.y -
    indexFinger.y;


  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );


  if (distance < 0.07) {

    gestureText.textContent =
      "PINCH";

    currentZoom = 1.6;

    zoomText.textContent =
      "160%";

  }

  else {

    gestureText.textContent =
      "HAND CONTROL";

    currentZoom = 1;

    zoomText.textContent =
      "100%";

  }

}


// ======================================
// START
// ======================================

startCamera();
