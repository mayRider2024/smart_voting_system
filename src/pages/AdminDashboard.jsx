import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { backfillNotaForAdminElections, createElection, deleteElection, getElections, getVoteTotalsForElectionIds, updateElectionStatus } from '../utils/voteUtils'

function AdminDashboard({ user }) {
  const navigate = useNavigate()
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    candidates: []
  })
  const [currentCandidate, setCurrentCandidate] = useState({
    name: '',
    description: ''
  })

  const enrichElectionsWithVoteTotals = async (rawElections) => {
    const voteTotals = await getVoteTotalsForElectionIds(rawElections.map(e => e.id))
    return rawElections.map((election) => ({
      ...election,
      totalVotes: voteTotals[election.id] || 0
    }))
  }

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true)
        await backfillNotaForAdminElections(user.uid)
        const electionsList = await getElections()
        // Filter only admin's elections
        const adminElections = electionsList.filter(e => e.adminId === user.uid)
        const electionsWithTotals = await enrichElectionsWithVoteTotals(adminElections)
        setElections(electionsWithTotals)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user?.uid) {
      fetchElections()
    }
  }, [user])

  const handleAddCandidate = () => {
    if (!currentCandidate.name.trim()) {
      setError('Candidate name is required!')
      return
    }
    
    setFormData({
      ...formData,
      candidates: [
        ...formData.candidates,
        {
          id: Date.now().toString(),
          name: currentCandidate.name,
          description: currentCandidate.description,
          votes: 0
        }
      ]
    })
    setCurrentCandidate({ name: '', description: '' })
  }

  const handleRemoveCandidate = (id) => {
    setFormData({
      ...formData,
      candidates: formData.candidates.filter(c => c.id !== id)
    })
  }

  const handleCreateElection = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim()) {
      setError('Election title is required!')
      return
    }

    if (formData.candidates.length < 2) {
      setError('You need at least 2 candidates!')
      return
    }

    try {
      const electionId = await createElection(formData, user.uid)
      setSuccess('Election created successfully! ✅')
      
      // Refresh elections list
      const electionsList = await getElections()
      const adminElections = electionsList.filter(e => e.adminId === user.uid)
      const electionsWithTotals = await enrichElectionsWithVoteTotals(adminElections)
      setElections(electionsWithTotals)

      // Reset form
      setFormData({ title: '', description: '', candidates: [] })
      setShowForm(false)

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeclareResults = async (electionId) => {
    try {
      await updateElectionStatus(electionId, 'results_declared')
      setSuccess('Results declared successfully! ✅')
      
      // Refresh elections
      const electionsList = await getElections()
      const adminElections = electionsList.filter(e => e.adminId === user.uid)
      const electionsWithTotals = await enrichElectionsWithVoteTotals(adminElections)
      setElections(electionsWithTotals)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteElection = async (electionId, electionTitle) => {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete "${electionTitle}"? This action cannot be undone.`
    )

    if (!shouldDelete) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteElection(electionId)
      setSuccess('Election deleted successfully! ✅')

      const electionsList = await getElections()
      const adminElections = electionsList.filter(e => e.adminId === user.uid)
      const electionsWithTotals = await enrichElectionsWithVoteTotals(adminElections)
      setElections(electionsWithTotals)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center">
        <div className="loading"></div>
      </div>
    )
  }

  return (
    <div className="container-main py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">⚙️ Admin Dashboard</h1>
        <p className="text-gray-600">Create and manage elections</p>
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

      {/* Create Election Form */}
      <div className="mb-12">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary mb-6"
        >
          {showForm ? '❌ Cancel' : '➕ Create New Election'}
        </button>

        {showForm && (
          <div className="card max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Election</h2>
            <form onSubmit={handleCreateElection} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Election Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-field"
                  placeholder="e.g., President Election 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field h-24"
                  placeholder="Election description..."
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Candidates</h3>
                <div className="space-y-4 mb-4">
                  <div>
                    <input
                      type="text"
                      value={currentCandidate.name}
                      onChange={(e) => setCurrentCandidate({...currentCandidate, name: e.target.value})}
                      className="input-field mb-2"
                      placeholder="Candidate name"
                    />
                    <textarea
                      value={currentCandidate.description}
                      onChange={(e) => setCurrentCandidate({...currentCandidate, description: e.target.value})}
                      className="input-field h-20 mb-2"
                      placeholder="Candidate description"
                    />
                    <button
                      type="button"
                      onClick={handleAddCandidate}
                      className="btn-secondary"
                    >
                      Add Candidate
                    </button>
                  </div>
                </div>

                {/* Candidates List */}
                <div className="space-y-2 mb-6">
                  {formData.candidates.map((candidate) => (
                    <div key={candidate.id} className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                      <div>
                        <p className="font-bold text-gray-800">{candidate.name}</p>
                        <p className="text-sm text-gray-600">{candidate.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(candidate.id)}
                        className="btn-danger text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Total Candidates: {formData.candidates.length}
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Create Election
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Elections List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Elections</h2>
        {elections.length === 0 ? (
          <div className="card bg-gradient-to-br from-gray-100 to-gray-50">
            <p className="text-gray-500 text-center py-8">No elections created yet. Click "Create New Election" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elections.map((election) => (
              <div key={election.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{election.title}</h3>
                    <p className="text-gray-600">{election.description}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-bold text-white ${
                    election.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {election.status === 'active' ? '🟢 Active' : '🔴 Closed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500">Candidates</p>
                    <p className="text-2xl font-bold text-voting-blue">{election.candidates?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Votes</p>
                    <p className="text-2xl font-bold text-voting-blue">{election.totalVotes || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(election.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => navigate(`/results/${election.id}`)}
                    className="flex-1 btn-secondary"
                  >
                    View Results
                  </button>
                  {election.status === 'active' && (
                    <button
                      onClick={() => handleDeclareResults(election.id)}
                      className="flex-1 btn-danger"
                    >
                      Declare Results
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteElection(election.id, election.title)}
                    className="flex-1 btn-danger"
                  >
                    Delete Election
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
