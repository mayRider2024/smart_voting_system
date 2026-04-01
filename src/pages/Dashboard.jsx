import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { getElections, getVoteTotalsForElectionIds, hasUserVoted } from '../utils/voteUtils'
import { deleteOwnAccount } from '../utils/authUtils'

function Dashboard({ user, isAdmin }) {
  const navigate = useNavigate()
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accountActionError, setAccountActionError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [votedElections, setVotedElections] = useState(new Set())

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true)
        const electionsList = await getElections()
        const voteTotals = await getVoteTotalsForElectionIds(electionsList.map(election => election.id))
        const electionsWithTotals = electionsList.map((election) => ({
          ...election,
          totalVotes: voteTotals[election.id] || 0
        }))
        setElections(electionsWithTotals)

        // Check which elections user has voted in
        const voted = new Set()
        for (const election of electionsWithTotals) {
          const hasVoted = await hasUserVoted(election.id, user.uid)
          if (hasVoted) {
            voted.add(election.id)
          }
        }
        setVotedElections(voted)
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

  if (loading) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center">
        <div className="loading"></div>
      </div>
    )
  }

  const activeElections = elections.filter(e => e.status === 'active')
  const closedElections = elections.filter(e => e.status === 'closed')
  const declaredElections = elections.filter(e => e.status === 'results_declared')

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This will delete your Firebase Authentication account (email login), profile, votes, and all elections created by you.'
    )

    if (!confirmed) {
      return
    }

    const currentPassword = window.prompt('Please enter your current password to confirm account deletion:')

    if (currentPassword === null) {
      return
    }

    setAccountActionError('')
    setDeletingAccount(true)

    try {
      await deleteOwnAccount(currentPassword)
      navigate('/login')
    } catch (err) {
      setAccountActionError(err.message)
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div className="container-main py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          👋 Welcome, {user?.displayName || user?.email}!
        </h1>
        <p className="text-gray-600">Cast your vote in ongoing elections and view results</p>
      </div>

      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Active Elections */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          🗳️ Active Elections ({activeElections.length})
        </h2>
        {activeElections.length === 0 ? (
          <div className="card bg-gradient-to-br from-gray-100 to-gray-50">
            <p className="text-gray-500 text-center py-8">No active elections available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeElections.map((election) => (
              <div key={election.id} className="card group">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{election.title}</h3>
                <p className="text-gray-600 mb-4">{election.description}</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    📊 Candidates: {election.candidates?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    🗳️ Total Votes: {election.totalVotes || 0}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {votedElections.has(election.id) ? (
                    election.status === 'results_declared' || election.status === 'closed' || isAdmin ? (
                      <Link
                        to={`/results/${election.id}`}
                        className="flex-1 btn-secondary text-center"
                      >
                        View Results
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex-1 btn-secondary opacity-60 cursor-not-allowed"
                      >
                        Awaiting Result
                      </button>
                    )
                  ) : (
                    <Link
                      to={`/vote/${election.id}`}
                      className="flex-1 btn-primary text-center"
                    >
                      Cast Vote
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed Elections */}
      {(closedElections.length > 0 || declaredElections.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            ✅ Published Results ({closedElections.length + declaredElections.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...closedElections, ...declaredElections].map((election) => (
              <div key={election.id} className="card opacity-70">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {election.title} ({election.status === 'results_declared' ? 'Results Declared' : 'Closed'})
                </h3>
                <p className="text-gray-600 mb-4">{election.description}</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    🗳️ Total Votes: {election.totalVotes || 0}
                  </p>
                </div>
                <Link
                  to={`/results/${election.id}`}
                  className="block btn-primary text-center"
                >
                  View Final Results
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-12 bg-gradient-to-r from-voting-blue to-voting-purple rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">⚙️ Admin Dashboard</h2>
          <p className="mb-6">Create and manage elections</p>
          <Link to="/admin" className="bg-white text-voting-blue px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
            Go to Admin Panel
          </Link>
        </div>
      )}

      <div className="mt-12 card border border-red-200">
        <h2 className="text-2xl font-bold text-red-700 mb-3">⚠️ Delete My Account</h2>
        <p className="text-gray-700 mb-4">
          This permanently deletes your account, your votes, and any elections created by you.
        </p>
        {accountActionError && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {accountActionError}
          </div>
        )}
        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="btn-danger"
        >
          {deletingAccount ? 'Deleting Account...' : 'Delete My Account'}
        </button>
      </div>
    </div>
  )
}

export default Dashboard
