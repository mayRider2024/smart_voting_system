import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getElectionById, getResults } from '../utils/voteUtils'

function ResultsPage({ user, isAdmin }) {
  const { electionId } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResultsData = async () => {
      try {
        setLoading(true)
        const electionData = await getElectionById(electionId)
        if (!electionData) {
          setError('Election not found!')
          return
        }

        const isDeclared = electionData.status === 'results_declared' || electionData.status === 'closed'

        if (!isAdmin && !isDeclared) {
          setError('Results are not declared yet. Please wait for admin announcement.')
          setElection(null)
          return
        }

        setElection(electionData)

        const votesCount = await getResults(electionId)
        setResults(votesCount)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (electionId && user?.uid) {
      fetchResultsData()
    }
  }, [electionId, user])

  if (loading) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center">
        <div className="loading"></div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center">
        <div className="card">
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full btn-primary mt-4"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0)

  const getPercentage = (candidateId) => {
    if (totalVotes === 0) return 0
    return ((results[candidateId] || 0) / totalVotes * 100).toFixed(2)
  }

  const sortedCandidates = [...(election.candidates || [])].sort((a, b) => 
    (results[b.id] || 0) - (results[a.id] || 0)
  )

  return (
    <div className="container-main py-12">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 {election.title}</h1>
              <p className="text-gray-600">{election.description}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-bold text-white ${
              election.status === 'active' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {election.status === 'active' ? '🟢 Active' : '🔴 Closed'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
            <p>Total Votes: <strong>{totalVotes}</strong></p>
            <p>Last Updated: {new Date(election.updatedAt?.toDate?.() || Date.now()).toLocaleString()}</p>
          </div>
        </div>

        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {sortedCandidates.map((candidate, index) => {
            const votes = results[candidate.id] || 0
            const percentage = getPercentage(candidate.id)
            const isLeading = votes === Math.max(...sortedCandidates.map(c => results[c.id] || 0))

            return (
              <div key={candidate.id} className={`card ${isLeading ? 'ring-2 ring-voting-blue' : ''}`}>
                <div className="mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '●'} {candidate.name}
                      </h3>
                      <p className="text-gray-600">{candidate.description}</p>
                    </div>
                    <span className="text-2xl font-bold text-voting-blue">{votes}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isLeading 
                        ? 'bg-gradient-to-r from-voting-blue to-voting-purple' 
                        : 'bg-blue-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="mt-2 text-sm font-semibold text-gray-700">
                  {percentage}% ({votes} {votes === 1 ? 'vote' : 'votes'})
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="card bg-gradient-to-br from-voting-blue to-voting-purple text-white">
            <p className="text-gray-200">Total Votes</p>
            <p className="text-4xl font-bold">{totalVotes}</p>
          </div>
          <div className="card bg-gradient-to-br from-voting-purple to-pink-500 text-white">
            <p className="text-gray-200">Candidates</p>
            <p className="text-4xl font-bold">{election.candidates?.length || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-pink-500 to-red-500 text-white">
            <p className="text-gray-200">Status</p>
            <p className="text-4xl font-bold">{election.status === 'active' ? '🟢' : '🔴'}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full btn-primary mt-8"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default ResultsPage
