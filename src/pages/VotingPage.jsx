import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getElectionById, castVote, NOTA_CANDIDATE_ID } from '../utils/voteUtils'
import { getUserData } from '../utils/authUtils'
import FaceVerification from '../components/FaceVerification'

function VotingPage({ user }) {
  const { electionId } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timeoutHandled, setTimeoutHandled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [faceVerified, setFaceVerified] = useState(false)
  const [faceData, setFaceData] = useState(null)
  const [faceDataLoading, setFaceDataLoading] = useState(false)
  const [showFaceVerification, setShowFaceVerification] = useState(false)

  useEffect(() => {
    const fetchElectionAndFaceData = async () => {
      try {
        setLoading(true)
        
        // Fetch election data
        const electionData = await getElectionById(electionId)
        if (!electionData) {
          setError('Election not found!')
          return
        }
        setElection(electionData)

        // Fetch user's face data
        if (user?.uid) {
          setFaceDataLoading(true)
          const userData = await getUserData(user.uid)
          if (userData?.faceData) {
            setFaceData(userData.faceData)
            setShowFaceVerification(true)
          } else {
            // User doesn't have face data registered
            setError('Face registration not found. Please complete registration first.')
          }
        }
      } catch (err) {
        console.error('Error fetching election or face data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
        setFaceDataLoading(false)
      }
    }

    if (electionId && user?.uid) {
      fetchElectionAndFaceData()
    }
  }, [electionId, user?.uid])

  useEffect(() => {
    if (loading || !election || success || timeoutHandled) {
      return
    }

    if (timeLeft <= 0) {
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, loading, election, success, timeoutHandled, faceVerified])

  useEffect(() => {
    const submitNotaOnTimeout = async () => {
      if (loading || !election || success || timeoutHandled || timeLeft > 0 || !faceVerified) {
        return
      }

      try {
        setVoting(true)
        setTimeoutHandled(true)
        setError('')
        await castVote(electionId, NOTA_CANDIDATE_ID, user.uid)
        setSuccess('Time expired. Your vote has been recorded as NOTA. ✅')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } catch (err) {
        if (err.message === 'You have already voted in this election!') {
          setSuccess('You have already voted in this election.')
          setTimeout(() => {
            navigate('/dashboard')
          }, 1500)
          return
        }
        setError(err.message)
      } finally {
        setVoting(false)
      }
    }

    submitNotaOnTimeout()
  }, [timeLeft, loading, election, success, timeoutHandled, electionId, user, navigate, faceVerified])

  const handleFaceVerificationSuccess = (result) => {
    setFaceVerified(true)
    setShowFaceVerification(false)
    setSuccess('✓ Face verified! You may now vote.')
    setTimeout(() => {
      setSuccess('')
    }, 3000)
  }

  const handleFaceVerificationFailed = (result) => {
    setError('Face verification failed. Please ensure your face is clearly visible and try again.')
  }

  const handleVote = async (e) => {
    e.preventDefault()
    
    if (!selectedCandidate) {
      setError('Please select a candidate!')
      return
    }

    if (timeLeft <= 0) {
      setError('Voting time expired. Please go back and try again.')
      return
    }

    setVoting(true)
    setError('')

    try {
      await castVote(electionId, selectedCandidate, user.uid)
      setSuccess('Vote cast successfully! ✅')
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setVoting(false)
    }
  }

  if (loading || faceDataLoading) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center">
        <div className="loading"></div>
      </div>
    )
  }

  if (showFaceVerification && faceData) {
    return (
      <div className="container-main py-12">
        <FaceVerification
          storedFaceData={faceData}
          onVerificationSuccess={handleFaceVerificationSuccess}
          onVerificationFailed={handleFaceVerificationFailed}
        />
      </div>
    )
  }

  if (!election || !faceVerified) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center">
        <div className="card">
          <p className="text-red-600 text-center">{error || 'Loading...'}</p>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isWarningTime = timeLeft <= 10
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const candidatesForVoting = election?.candidates || []

  return (
    <div className="container-main py-12">
      <div className="max-w-2xl mx-auto">
        <div className="card mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🗳️ {election.title}</h1>
          <p className="text-gray-600 text-lg mb-2">{election.description}</p>
          <div className="text-sm text-gray-500">
            <p>Created by: {election.adminId}</p>
            <p>Status: <span className="badge badge-success">{election.status}</span></p>
          </div>
        </div>

        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Choice</h2>

          <div className={`mb-6 p-4 rounded-lg border ${
            isWarningTime
              ? 'bg-red-50 border-red-500 animate-pulse'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`font-semibold ${isWarningTime ? 'text-red-700' : 'text-blue-700'}`}>
                ⏱️ Time Left
              </p>
              <p className={`text-2xl font-bold ${isWarningTime ? 'text-red-700' : 'text-blue-700'}`}>
                {minutes}:{seconds}
              </p>
            </div>
            {isWarningTime && timeLeft > 0 && (
              <p className="text-red-700 text-sm font-semibold mt-2">⚠️ Hurry up! Final 10 seconds</p>
            )}
          </div>
          
          <form onSubmit={handleVote} className="space-y-4">
            {candidatesForVoting.map((candidate) => (
              <label key={candidate.id} className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                style={{
                  borderColor: selectedCandidate === candidate.id ? '#0066cc' : '#d1d5db',
                  backgroundColor: selectedCandidate === candidate.id ? '#f0f4ff' : 'white'
                }}>
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.id}
                  checked={selectedCandidate === candidate.id}
                  onChange={() => setSelectedCandidate(candidate.id)}
                  className="w-4 h-4 text-voting-blue"
                />
                <div className="ml-4 flex-1">
                  <h3 className="font-bold text-gray-800">{candidate.name}</h3>
                  <p className="text-gray-600">{candidate.description}</p>
                  {candidate.id === NOTA_CANDIDATE_ID && (
                    <p className="text-sm text-gray-500 mt-1">Default choice if time expires</p>
                  )}
                </div>
              </label>
            ))}

            <div className="flex space-x-4 mt-8">
              <button
                type="submit"
                disabled={voting || !selectedCandidate || timeLeft <= 0}
                className="flex-1 btn-primary"
              >
                {timeLeft <= 0 ? 'Time Expired' : voting ? 'Casting Vote...' : 'Cast Vote'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VotingPage
