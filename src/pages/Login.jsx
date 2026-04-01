import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { loginUser, resetPassword } from '../utils/authUtils'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await loginUser(email, password)
      // Show success state and let App component's auth listener handle routing
      setLoginSuccess(true)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Please enter your email address first, then click Forgot Password.')
      return
    }

    try {
      setResetLoading(true)
      await resetPassword(email)
      setSuccess('Password reset email sent. Please check your inbox and spam folder.')
    } catch (err) {
      setError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  if (loginSuccess) {
    return (
      <div className="container-main min-h-96 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center">
              <div className="loading mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold mb-4">✅ Login Successful!</h2>
              <p className="text-gray-600 mb-6">Loading your dashboard...</p>
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
          <h2 className="text-3xl font-bold text-center mb-8">🔐 Login</h2>

          {error && (
            <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="mt-2 text-sm text-voting-blue font-semibold hover:underline"
              >
                {resetLoading ? 'Sending reset email...' : 'Forgot Password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-voting-blue font-semibold hover:underline">
                Register here
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

export default Login
