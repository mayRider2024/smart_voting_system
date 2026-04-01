import * as faceapi from '@vladmandic/face-api'

let isModelsLoaded = false

export const initializeFaceAPI = async () => {
  if (isModelsLoaded) return

  try {
    // Load models from a CDN or local path
    const MODEL_URL =
      'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/'

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ])

    isModelsLoaded = true
    console.log('Face API models loaded successfully')
  } catch (error) {
    console.error('Error loading Face API models:', error)
    throw new Error('Failed to load face recognition models')
  }
}

export const startCamera = async (videoRef) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
    })
    if (videoRef.current) {
      videoRef.current.srcObject = stream

      await new Promise((resolve, reject) => {
        const video = videoRef.current

        const onReady = () => {
          video.play().then(resolve).catch(() => resolve())
        }

        const onError = () => {
          reject(new Error('Unable to start camera stream.'))
        }

        if (video.readyState >= 2) {
          onReady()
          return
        }

        video.addEventListener('loadeddata', onReady, { once: true })
        video.addEventListener('error', onError, { once: true })
      })

      return stream
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    throw new Error('Unable to access camera. Please check permissions.')
  }
}

export const stopCamera = (videoRef) => {
  if (videoRef.current && videoRef.current.srcObject) {
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
  }
}

export const detectFace = async (videoElement) => {
  try {
    if (!videoElement || videoElement.readyState < 2) {
      return null
    }

    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.35,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions()

    return detection
  } catch (error) {
    console.error('Error detecting face:', error)
    return null
  }
}

const calculateLandmarkCenter = (points) => {
  if (!points?.length) return { x: 0, y: 0 }

  const total = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 }
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  }
}

const classifyHeadDirection = (landmarks) => {
  if (!landmarks) {
    return { direction: 'unknown', confidence: 0 }
  }

  const leftEyeCenter = calculateLandmarkCenter(landmarks.getLeftEye())
  const rightEyeCenter = calculateLandmarkCenter(landmarks.getRightEye())
  const noseCenter = calculateLandmarkCenter(landmarks.getNose())

  const eyeDistance = Math.max(1, rightEyeCenter.x - leftEyeCenter.x)
  const noseOffsetRatio = (noseCenter.x - leftEyeCenter.x) / eyeDistance

  // Ratio around 0.50 indicates frontal face. Lower/higher means head turned.
  const centerThreshold = 0.055
  const offsetFromCenter = noseOffsetRatio - 0.5

  if (Math.abs(offsetFromCenter) <= centerThreshold) {
    return {
      direction: 'center',
      confidence: 1 - Math.min(1, Math.abs(offsetFromCenter) / centerThreshold),
    }
  }

  return {
    direction: offsetFromCenter > 0 ? 'left' : 'right',
    confidence: Math.min(1, Math.abs(offsetFromCenter) / 0.18),
  }
}

export const scanFaceSequence = async (videoElement, onProgress) => {
  if (!videoElement) {
    throw new Error('Camera not initialized correctly. Please restart camera.')
  }

  const detections = []
  const positions = [
    {
      name: 'center-left',
      instruction: 'Turn your head to one side (left or right) and hold still.',
      requiredPose: 'side',
    },
    {
      name: 'center',
      instruction: 'Face the camera straight and hold still.',
      requiredPose: 'center',
    },
    {
      name: 'center-right',
      instruction: 'Now turn to the opposite side and hold still.',
      requiredPose: 'opposite-side',
    },
  ]

  const maxAttemptsPerStep = 50
  const retryDelayMs = 180
  const requiredStableFrames = 3
  let firstSideDirection = null

  for (let i = 0; i < positions.length; i++) {
    const position = positions[i]

    // Notify user to move head
    if (onProgress) {
      onProgress({
        step: i + 1,
        totalSteps: positions.length,
        message: position.instruction,
        position: position.name,
      })
    }

    // Detect face at this position
    let attempts = 0
    let detection = null
    let consecutiveValidFrames = 0
    let lastDetectedDirection = 'unknown'

    while (attempts < maxAttemptsPerStep && !detection) {
      const currentDetection = await detectFace(videoElement)

      if (!currentDetection) {
        consecutiveValidFrames = 0
        attempts++
      } else {
        const { direction } = classifyHeadDirection(currentDetection.landmarks)
        lastDetectedDirection = direction

        let isValidForStep = false

        if (position.requiredPose === 'side') {
          isValidForStep = direction === 'left' || direction === 'right'
        } else if (position.requiredPose === 'center') {
          isValidForStep = direction === 'center'
        } else if (position.requiredPose === 'opposite-side') {
          isValidForStep =
            (direction === 'left' || direction === 'right') &&
            firstSideDirection &&
            direction !== firstSideDirection
        }

        if (isValidForStep) {
          consecutiveValidFrames++
          if (consecutiveValidFrames >= requiredStableFrames) {
            detection = currentDetection

            if (position.requiredPose === 'side') {
              firstSideDirection = direction
            }
          }
        } else {
          consecutiveValidFrames = 0
          attempts++
        }
      }

      if (!detection && attempts < maxAttemptsPerStep) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      }
    }

    if (!detection) {
      const readableDirection =
        lastDetectedDirection === 'unknown' ? 'not clearly detected' : lastDetectedDirection

      throw new Error(
        `Could not capture required pose for step ${i + 1}. Last detected head direction: ${readableDirection}. Please try again and follow the on-screen instruction.`
      )
    }

    detections.push({
      position: position.name,
      descriptor: detection.descriptor,
      landmarks: detection.landmarks,
      expressions: detection.expressions,
      timestamp: new Date(),
    })

    if (onProgress) {
      onProgress({
        step: i + 1,
        totalSteps: positions.length,
        message: `✓ ${position.name} captured successfully!`,
        position: position.name,
      })
    }

    // Brief pause between scans
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return detections
}

export const registerFace = async (videoElement, userId) => {
  try {
    await initializeFaceAPI()
    const detections = await scanFaceSequence(videoElement)

    // Use descriptors from all three positions for better accuracy
    const faceData = {
      centerLeft: Array.from(detections[0].descriptor),
      center: Array.from(detections[1].descriptor),
      centerRight: Array.from(detections[2].descriptor),
      averageDescriptor: calculateAverageDescriptor([
        detections[0].descriptor,
        detections[1].descriptor,
        detections[2].descriptor,
      ]),
      expressions: detections[1].expressions, // Center position expressions
      registeredAt: new Date().toISOString(),
      userId: userId,
    }

    return faceData
  } catch (error) {
    console.error('Error registering face:', error)
    throw error
  }
}

export const verifyFace = async (videoElement, storedFaceData) => {
  try {
    await initializeFaceAPI()
    const detection = await detectFace(videoElement)

    if (!detection) {
      throw new Error('No face detected. Please ensure your face is clearly visible.')
    }

    const currentDescriptor = detection.descriptor
    const storedDescriptors = [
      new Float32Array(storedFaceData.centerLeft),
      new Float32Array(storedFaceData.center),
      new Float32Array(storedFaceData.centerRight),
    ]

    // Compare with all three stored descriptors
    const distances = storedDescriptors.map((stored) =>
      calculateEuclideanDistance(currentDescriptor, stored)
    )

    const minDistance = Math.min(...distances)
    const avgDistance = distances.reduce((a, b) => a + b) / distances.length

    // Face is considered verified if distance is below threshold
    const threshold = 0.6
    const isVerified = minDistance < threshold

    return {
      isVerified,
      minDistance,
      avgDistance,
      distances,
      expressions: detection.expressions,
    }
  } catch (error) {
    console.error('Error verifying face:', error)
    throw error
  }
}

export const calculateEuclideanDistance = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    throw new Error('Arrays must have the same length')
  }

  let sum = 0
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

export const calculateAverageDescriptor = (descriptors) => {
  if (!descriptors.length) {
    throw new Error('No descriptors provided')
  }

  const length = descriptors[0].length
  const average = new Float32Array(length)

  for (let i = 0; i < length; i++) {
    let sum = 0
    for (let j = 0; j < descriptors.length; j++) {
      sum += descriptors[j][i]
    }
    average[i] = sum / descriptors.length
  }

  return Array.from(average)
}

export const drawFaceDetection = (
  canvasRef,
  videoElement,
  detection
) => {
  if (!canvasRef.current || !detection) return

  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')

  canvas.width = videoElement.width
  canvas.height = videoElement.height

  // Draw video frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

  // Draw face detection box
  const { box, landmarks } = detection
  const regionsToDrawOptions = {
    drawProabilities: false,
  }

  faceapi.draw.drawDetections(canvas, [detection])
  faceapi.draw.drawFaceLandmarks(canvas, [landmarks])
}
