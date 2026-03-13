const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const path = require('path');

const MODEL_PATH = path.join(
  __dirname, '..', 'node_modules', '@vladmandic', 'face-api', 'model'
);

let modelsLoaded = false;

async function initFaceApi() {
  if (modelsLoaded) return;
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
  modelsLoaded = true;
}

/**
 * Decode image input to a tf.Tensor3D.
 * Accepts a Buffer, base64 data URL string, or raw base64 string.
 */
function decodeToTensor(imageInput) {
  let buffer;
  if (Buffer.isBuffer(imageInput)) {
    buffer = imageInput;
  } else if (typeof imageInput === 'string') {
    const base64 = imageInput.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64, 'base64');
  } else {
    throw new Error('Unsupported image input type');
  }
  // Decode to RGB tensor (3 channels)
  return tf.node.decodeImage(buffer, 3);
}

/**
 * Get a 128-float face descriptor from an image.
 * Returns Float32Array or null if no face detected.
 */
async function getDescriptor(imageInput) {
  const tensor = decodeToTensor(imageInput);
  try {
    const detection = await faceapi
      .detectSingleFace(tensor)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection ? detection.descriptor : null;
  } finally {
    tensor.dispose();
  }
}

/**
 * Compare a query descriptor to stored employees.
 * Returns the best matching employee or null if no match within threshold.
 */
function findMatch(queryDescriptor, employees, threshold = 0.55) {
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const emp of employees) {
    if (!emp.face_descriptor || emp.face_descriptor.length !== 128) continue;
    const stored = new Float32Array(emp.face_descriptor);
    const distance = faceapi.euclideanDistance(queryDescriptor, stored);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = emp;
    }
  }

  return bestDistance <= threshold ? bestMatch : null;
}

module.exports = { initFaceApi, getDescriptor, findMatch };
