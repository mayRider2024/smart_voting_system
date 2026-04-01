import React, { useRef, useState, useEffect } from 'react'
import {
  initializeFaceAPI,
  startCamera,
  stopCamera,
  scanFaceSequence,
  drawFaceDetection,
} from '../services/faceRecognitionService'

export default function FaceRegistration({ onFaceDataReady, userId }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [progress, setProgress] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [registrationStep, setRegistrationStep] = useState('idle')

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        stopCamera(videoRef)
      }
    }
  }, [])

  const handleInitializeCamera = async () => {
    setIsInitializing(true)
    setError('')
    setMessage('Initializing camera and loading face recognition models...')

    try {
      await initializeFaceAPI()
      await startCamera(videoRef)
      setCameraStarted(true)
      setMessage('Camera ready! Please ensure good lighting and face the camera.')
      setRegistrationStep('ready')
    } catch (err) {
      setError(err.message)
      setMessage('')
      setRegistrationStep('idle')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleScanFace = async () => {
    setIsScanning(true)
    setError('')
    setMessage('Starting face scan...')
    setRegistrationStep('scanning')

    try {
      if (!videoRef.current) {
        throw new Error('Camera not initialized')
      }

      const handleProgress = (progressData) => {
        setProgress(progressData)
        setMessage(progressData.message)
      }

      const detections = await scanFaceSequence(videoRef.current, handleProgress)

      setMessage('✓ Face scan completed successfully! Saving face data...')
      setProgress(null)

      if (onFaceDataReady) {
        await onFaceDataReady(detections)
      }

      setMessage('✓ Face registered successfully!')
      setRegistrationStep('completed')
    } catch (err) {
      setError(err.message)
      setMessage('')
      setRegistrationStep('ready')
    } finally {
      setIsScanning(false)
    }
  }

  const handleReset = () => {
    setProgress(null)
    setMessage('Ready to scan. Click "Scan Face" to begin.')
    setError('')
    setRegistrationStep('ready')
  }

  const handleCancel = () => {
    stopCamera(videoRef)
    setCameraStarted(false)
    setRegistrationStep('idle')
    setMessage('')
    setProgress(null)
    setError('')
  }

  return (
    <div className="face-registration-container bg-white rounded-lg shadow-lg p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📸 Face Registration</h2>
        <p className="text-gray-600 mb-6">
          We need to scan your face from three angles to register you. This ensures only you can vote.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">⚠️ Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Video Container */}
        <div className="mb-8 bg-gray-900 rounded-lg overflow-hidden">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full bg-black rounded-lg"
              style={{ minHeight: '400px' }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />

            {/* Instructions Overlay */}
            {registrationStep === 'scanning' && progress && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                <div className="bg-white/95 backdrop-blur px-8 py-6 rounded-lg shadow-2xl">
                  <p className="text-2xl font-bold text-gray-800 mb-4">
                    Step {progress.step} of {progress.totalSteps}
                  </p>
                  <p className="text-lg text-gray-700 text-center">
                    {progress.message}
                  </p>
                  <div className="mt-6 flex gap-2">
                    {Array.from({ length: progress.totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < progress.step
                            ? 'bg-voting-blue'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Camera Not Started */}
            {!cameraStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                <div className="text-center text-white">
                  <p className="text-lg mb-4">📷 Click "Start Camera" to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && !error && (
          <div className="mb-6 bg-blue-50 border-l-4 border-voting-blue p-4 rounded">
            <p className="text-voting-blue font-semibold">{message}</p>
          </div>
        )}

        {/* Progress Display */}
        {progress && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 text-sm font-semibold">
              Position {progress.step} of {progress.totalSteps}: {progress.position}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4">
          {!cameraStarted ? (
            <button
              onClick={handleInitializeCamera}
              disabled={isInitializing}
              className="flex-1 btn-primary"
            >
              {isInitializing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Initializing...
                </>
              ) : (
                '📷 Start Camera'
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleScanFace}
                disabled={isScanning || registrationStep === 'completed'}
                className="flex-1 btn-primary"
              >
                {isScanning ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Scanning...
                  </>
                ) : registrationStep === 'completed' ? (
                  '✓ Face Registered'
                ) : (
                  '🔍 Scan Face'
                )}
              </button>

              {registrationStep === 'completed' && (
                <button
                  onClick={handleReset}
                  className="flex-1 btn-secondary"
                >
                  Scan Again
                </button>
              )}

              <button
                onClick={handleCancel}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Step Guide */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">📋 How it works:</h3>
          <ol className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span className="font-bold text-voting-blue min-w-6">1.</span>
              <span>Click "Start Camera" and grant camera permission</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-voting-blue min-w-6">2.</span>
              <span>Ensure good lighting and your face is clearly visible</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-voting-blue min-w-6">3.</span>
              <span>Click "Scan Face" to begin the registration</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-voting-blue min-w-6">4.</span>
              <span>Follow the instructions: turn to one side, face center, then turn to the opposite side</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-voting-blue min-w-6">5.</span>
              <span>Your face will be saved securely for voting verification</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
