import React from 'react'
import { Link } from 'react-router-dom'
import { logoutUser } from '../utils/authUtils'

function Navbar({ user, isAdmin }) {
  const handleLogout = async () => {
    try {
      await logoutUser()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="bg-gradient-to-r from-voting-blue to-voting-purple shadow-lg">
      <div className="container-main flex justify-between items-center py-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl">🗳️</span>
          <span className="text-xl font-bold text-white">Smart Voting</span>
        </Link>

        <div className="hidden md:flex space-x-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-blue-200 font-semibold transition">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-white hover:text-blue-200 font-semibold transition">
                  Admin
                </Link>
              )}
              <div className="flex items-center space-x-4">
                <span className="text-white">{user.displayName || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-blue-200 font-semibold transition">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white text-2xl">☰</button>
      </div>
    </nav>
  )
}

export default Navbar
