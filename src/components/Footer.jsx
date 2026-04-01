import React from 'react'

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">🗳️ Smart Voting System</h3>
            <p className="text-gray-400">
              Secure, transparent, and fair online voting platform powered by Firebase.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-400">
              <li>✅ Secure Authentication</li>
              <li>✅ Real-time Results</li>
              <li>✅ Admin Dashboard</li>
              <li>✅ One Vote Per User</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Security</h3>
            <ul className="space-y-2 text-gray-400">
              <li>🔐 Firebase Auth</li>
              <li>🔐 Firestore Rules</li>
              <li>🔐 Encrypted Votes</li>
              <li>🔐 Audit Logs</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 Smart Voting System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
