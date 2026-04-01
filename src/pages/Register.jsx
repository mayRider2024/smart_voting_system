import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../utils/authUtils'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long!')
      return
    }

    setLoading(true)
    setError('')

    try {
      await registerUser(email, password, displayName)
      // Show success state and let App component's auth listener handle routing
      setRegistrationSuccess(true)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center">
              <div className="loading mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold mb-4">✅ Registration Successful!</h2>
              <p className="text-gray-600 mb-6">Setting up your account...</p>
              <p className="text-sm text-gray-500">You will be redirected automatically.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-main min-h-96 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h2 className="text-3xl font-bold text-center mb-8">📝 Register</h2>

            {error && (
              <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-voting-blue font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-voting-blue font-semibold hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
