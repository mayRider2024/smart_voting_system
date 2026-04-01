import React from 'react'
import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-voting-blue to-voting-purple min-h-96">
      <div className="container-main py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <h1 className="text-5xl font-bold mb-6">🗳️ Welcome to Smart Voting</h1>
            <p className="text-xl text-blue-100 mb-8">
              The most secure, transparent, and fair online voting platform. 
              Cast your vote with confidence using blockchain-like security.
            </p>
            <div className="flex space-x-4">
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
            </div>
          </div>

          {/* Right Features */}
          <div className="space-y-4">
            <div className="card bg-white text-gray-800">
              <h3 className="text-xl font-bold mb-2">🔐 Secure & Encrypted</h3>
              <p>Your votes are encrypted and stored securely in the cloud.</p>
            </div>
            <div className="card bg-white text-gray-800">
              <h3 className="text-xl font-bold mb-2">📊 Real-time Results</h3>
              <p>View election results as votes are cast in real-time.</p>
            </div>
            <div className="card bg-white text-gray-800">
              <h3 className="text-xl font-bold mb-2">✅ Fair & Transparent</h3>
              <p>One vote per user, no duplicates, fully transparent.</p>
            </div>
            <div className="card bg-white text-gray-800">
              <h3 className="text-xl font-bold mb-2">⚡ Cloud Powered</h3>
              <p>Powered by Firebase for reliability and scalability.</p>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="mt-20 bg-white bg-opacity-10 backdrop-blur rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="font-bold mb-2">Easy Registration</h3>
              <p>Quick and simple sign-up process</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🗳️</div>
              <h3 className="font-bold mb-2">Cast Your Vote</h3>
              <p>Vote securely in any election</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="font-bold mb-2">Live Results</h3>
              <p>See results update in real-time</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="font-bold mb-2">Admin Control</h3>
              <p>Create and manage elections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
