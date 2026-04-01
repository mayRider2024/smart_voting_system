import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FaceRegistration from '../components/FaceRegistration'
import { saveFaceDataToFirestore } from '../utils/authUtils'

function FaceSetup({ user }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isWaitingForUser, setIsWaitingForUser] = useState(!user)

  useEffect(() => {
    if (user?.uid) {
      setIsWaitingForUser(false)
    }
  }, [user?.uid])

  const handleFaceDataReady = async (detections) => {
    if (!user?.uid) {
      const message = 'User not found. Please log in again.'
      setError(message)
      throw new Error(message)
    }

    try {
      setSaving(true)
      setError('')
      await saveFaceDataToFirestore(user.uid, detections)
      sessionStorage.setItem(`faceRegistered:${user.uid}`, 'true')
      navigate('/dashboard')
      return true
    } catch (err) {
      const message = err.message || 'Failed to save face data. Please try again.'
      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-main py-12">
      <div className="max-w-4xl mx-auto">
        {isWaitingForUser && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading mx-auto mb-4"></div>
              <p className="text-voting-blue text-lg font-semibold">Preparing face setup...</p>
            </div>
          </div>
        )}

        {!isWaitingForUser && (
          <>
            {error && (
              <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {saving && (
              <div className="success-message bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-6">
                Saving face data...
              </div>
            )}

            <FaceRegistration userId={user?.uid} onFaceDataReady={handleFaceDataReady} />
          </>
        )}
      </div>
    </div>
  )
}

export default FaceSetup
