import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth, db } from './config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { ensureUserProfileExists, getUserData } from './utils/authUtils'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import VotingPage from './pages/VotingPage'
import ResultsPage from './pages/ResultsPage'
import FaceSetup from './pages/FaceSetup'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileResolved, setProfileResolved] = useState(false)

  useEffect(() => {
    let profileUnsubscribe = null

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setProfileResolved(false)

      if (profileUnsubscribe) {
        profileUnsubscribe()
        profileUnsubscribe = null
      }

      if (currentUser?.uid) {
        try {
          await ensureUserProfileExists(currentUser)

          const profile = await getUserData(currentUser.uid)
          setUserProfile(profile)
          setProfileResolved(true)

          profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), async (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data())
              setProfileResolved(true)
              return
            }

            const profile = await getUserData(currentUser.uid)
            setUserProfile(profile)
            setProfileResolved(true)
          }, async () => {
            const fallbackProfile = await getUserData(currentUser.uid)
            setUserProfile(fallbackProfile)
            setProfileResolved(true)
          })
        } catch {
          setUserProfile(null)
          setProfileResolved(true)
        }
      } else {
        setUserProfile(null)
        setProfileResolved(true)
      }

      setLoading(false)
    })

    return () => {
      unsubscribe()
      if (profileUnsubscribe) {
        profileUnsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (user?.uid && userProfile?.faceRegistered === true) {
      sessionStorage.removeItem(`faceRegistered:${user.uid}`)
    }
  }, [user?.uid, userProfile?.faceRegistered])

  useEffect(() => {
    const isDeletionInProgress = typeof window !== 'undefined'
      && sessionStorage.getItem('accountDeletionInProgress') === 'true'

    if (user && profileResolved && !userProfile && !isDeletionInProgress) {
      auth.signOut().catch(() => {})
    }
  }, [user, profileResolved, userProfile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-voting-blue to-voting-purple">
        <div className="text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (user && !profileResolved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-voting-blue to-voting-purple">
        <div className="text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (user && profileResolved && !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-voting-blue to-voting-purple">
        <div className="text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Signing you out...</p>
        </div>
      </div>
    )
  }

  const isAdmin = userProfile?.role === 'admin'
  const faceRegisteredSessionOverride = user?.uid
    ? sessionStorage.getItem(`faceRegistered:${user.uid}`) === 'true'
    : false

  const needsFaceSetup = !!user && !isAdmin && profileResolved && !!userProfile && userProfile?.faceRegistered !== true && !faceRegisteredSessionOverride

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar user={user} isAdmin={isAdmin} />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to={needsFaceSetup ? '/face-setup' : '/dashboard'} />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to={needsFaceSetup ? '/face-setup' : '/dashboard'} />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to={needsFaceSetup ? '/face-setup' : '/dashboard'} />} />

            {/* Protected Routes */}
            {user ? (
              <>
                <Route path="/face-setup" element={needsFaceSetup ? <FaceSetup user={user} /> : <Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={needsFaceSetup ? <Navigate to="/face-setup" /> : <Dashboard user={user} isAdmin={isAdmin} />} />
                <Route path="/admin" element={isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />} />
                <Route path="/vote/:electionId" element={needsFaceSetup ? <Navigate to="/face-setup" /> : <VotingPage user={user} />} />
                <Route path="/results/:electionId" element={<ResultsPage user={user} isAdmin={isAdmin} />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
