import React, { useRef, useState, useEffect } from 'react'
import {
  initializeFaceAPI,
  startCamera,
  stopCamera,
  verifyFace,
} from '../services/faceRecognitionService'

export default function FaceVerification({ storedFaceData, onVerificationSuccess, onVerificationFailed }) {
  const videoRef = useRef(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('idle')
  const [verificationResult, setVerificationResult] = useState(null)

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
      setMessage('Camera ready! Position your face in the center of the frame.')
      setVerificationStatus('ready')
    } catch (err) {
      setError(err.message)
      setMessage('')
      setVerificationStatus('idle')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleVerifyFace = async () => {
    setIsVerifying(true)
    setError('')
    setMessage('Analyzing your face...')
    setVerificationStatus('verifying')

    try {
      if (!videoRef.current) {
        throw new Error('Camera not initialized')
      }

      if (!storedFaceData) {
        throw new Error('No stored face data found')
      }

      const result = await verifyFace(videoRef.current, storedFaceData)

      setVerificationResult(result)

      if (result.isVerified) {
        setVerificationStatus('verified')
        setMessage('✓ Face verified successfully! You may proceed to vote.')
        
        // Call success callback
        if (onVerificationSuccess) {
          setTimeout(() => {
            onVerificationSuccess(result)
          }, 1500)
        }
      } else {
        setVerificationStatus('failed')
        setError(
          `Face verification failed. Distance: ${result.minDistance.toFixed(3)} (threshold: 0.6)`
        )
        
        // Call failed callback
        if (onVerificationFailed) {
          setTimeout(() => {
            onVerificationFailed(result)
          }, 2000)
        }
      }
    } catch (err) {
      setError(err.message)
      setMessage('')
      setVerificationStatus('ready')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReset = () => {
    setMessage('Ready to verify. Click "Verify Face" to begin.')
    setError('')
    setVerificationStatus('ready')
    setVerificationResult(null)
  }

  const handleCancel = () => {
    stopCamera(videoRef)
    setCameraStarted(false)
    setVerificationStatus('idle')
    setMessage('')
    setError('')
    setVerificationResult(null)
  }

  return (
    <div className="face-verification-container bg-white rounded-lg shadow-lg p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🔐 Face Verification</h2>
        <p className="text-gray-600 mb-6">
          Before you vote, we need to verify that you are the registered voter.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">⚠️ Verification Failed</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {verificationStatus === 'verified' && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded animate-pulse">
            <p className="text-green-700 font-semibold">✓ Face Verified</p>
            <p className="text-green-600">{message}</p>
          </div>
        )}

        {/* Verification Result Details */}
        {verificationResult && (
          <div className="mb-6 bg-blue-50 border-l-4 border-voting-blue p-4 rounded">
            <p className="text-voting-blue font-semibold mb-2">Verification Details:</p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Minimum Distance: {verificationResult.minDistance.toFixed(4)}</p>
              <p>Average Distance: {verificationResult.avgDistance.toFixed(4)}</p>
              <p>Threshold: 0.6000</p>
              <p>Status: {verificationResult.isVerified ? '✓ VERIFIED' : '✗ NOT VERIFIED'}</p>
            </div>
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

            {/* Verification Instructions Overlay */}
            {verificationStatus === 'verifying' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="bg-white/95 backdrop-blur px-8 py-6 rounded-lg shadow-2xl">
                  <div className="animate-spin mb-4 text-4xl text-voting-blue">
                    ⏳
                  </div>
                  <p className="text-lg text-gray-800 text-center font-semibold">
                    Verifying your face...
                  </p>
                </div>
              </div>
            )}

            {/* Camera Not Started */}
            {!cameraStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                <div className="text-center text-white">
                  <p className="text-lg mb-4">📷 Click "Start Camera" to begin verification</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && !error && verificationStatus !== 'verifying' && (
          <div className="mb-6 bg-blue-50 border-l-4 border-voting-blue p-4 rounded">
            <p className="text-voting-blue font-semibold">{message}</p>
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
                onClick={handleVerifyFace}
                disabled={isVerifying || verificationStatus === 'verified'}
                className="flex-1 btn-primary"
              >
                {isVerifying ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Verifying...
                  </>
                ) : verificationStatus === 'verified' ? (
                  '✓ Face Verified'
                ) : (
                  '🔍 Verify Face'
                )}
              </button>

              {verificationStatus === 'verified' || (verificationStatus === 'failed' && verificationResult) ? (
                <button
                  onClick={handleReset}
                  className="flex-1 btn-secondary"
                >
                  Try Again
                </button>
              ) : null}

              <button
                onClick={handleCancel}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Verification Tips */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">💡 Tips for successful verification:</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span>🌞</span>
              <span>Good lighting is essential - ensure your face is well lit</span>
            </li>
            <li className="flex gap-2">
              <span>📱</span>
              <span>Look directly at the camera</span>
            </li>
            <li className="flex gap-2">
              <span>👤</span>
              <span>Remove sunglasses or hats that cover your face</span>
            </li>
            <li className="flex gap-2">
              <span>📏</span>
              <span>Position your face in the center of the frame</span>
            </li>
            <li className="flex gap-2">
              <span>🔄</span>
              <span>If verification fails, try again from a slightly different angle</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
