// Authentication utilities
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { auth, db } from '../config/firebase'
import { collection, doc, setDoc, getDoc, query, where, getDocs, getDocsFromServer, deleteDoc, limit, writeBatch } from 'firebase/firestore'

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()

const normalizeAndValidateEmail = (email) => {
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail.endsWith('.ocm')) {
    throw new Error('Email looks mistyped (.ocm). Please use .com if that is your real email.')
  }

  return normalizedEmail
}

const mapAuthError = (error) => {
  const code = error?.code || ''

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is not configured yet. In Firebase Console, open Authentication → Sign-in method, enable Email/Password, then try again.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.'
  }

  if (code === 'auth/email-already-in-use') {
    return 'This email already exists in Firebase Authentication. Please log in instead, or use Forgot Password if needed.'
  }

  if (code === 'auth/invalid-credential') {
    return 'Invalid email or password. If you already registered, use Forgot Password to reset it.'
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled in Firebase Authentication.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many login attempts. Please wait a moment and try again.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (code === 'auth/requires-recent-login') {
    return 'For security, please log out and log in again, then try deleting your account.'
  }

  if (code === 'auth/invalid-email') {
    return 'Invalid email format. Please check and try again.'
  }

  if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Invalid email or password. Use Forgot Password if needed.'
  }

  return error?.message || 'Authentication failed. Please try again.'
}

export const registerUser = async (email, password, displayName) => {
  try {
    const normalizedEmail = normalizeAndValidateEmail(email)
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
    const user = userCredential.user

    // Update profile with display name
    await updateProfile(user, {
      displayName: displayName
    })

    // Add user document to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'voter',
      createdAt: new Date(),
      hasVoted: {}
    })

    return user
  } catch (error) {
    throw new Error(mapAuthError(error))
  }
}

export const ensureUserProfileExists = async (user) => {
  if (!user?.uid) {
    return
  }

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    return
  }

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    role: 'voter',
    createdAt: new Date(),
    hasVoted: {}
  })
}

const deleteVotesByElection = async (electionId) => {
  const votesRef = collection(db, 'votes')

  while (true) {
    const votesSnapshot = await getDocs(
      query(votesRef, where('electionId', '==', electionId), limit(450))
    )

    if (votesSnapshot.empty) {
      break
    }

    const batch = writeBatch(db)
    votesSnapshot.docs.forEach((voteDoc) => {
      batch.delete(voteDoc.ref)
    })

    await batch.commit()
  }
}

const deleteVotesByUser = async (uid) => {
  const votesRef = collection(db, 'votes')

  while (true) {
    const votesSnapshot = await getDocs(
      query(votesRef, where('userId', '==', uid), limit(450))
    )

    if (votesSnapshot.empty) {
      break
    }

    const batch = writeBatch(db)
    votesSnapshot.docs.forEach((voteDoc) => {
      batch.delete(voteDoc.ref)
    })

    try {
      await batch.commit()
    } catch (error) {
      console.error('[deleteVotesByUser] Batch delete failed:', error.code, error.message)
      throw new Error(`Failed to delete votes: ${error.message}`)
    }
  }
}

const deleteOwnedElections = async (uid) => {
  const electionsQuery = query(collection(db, 'elections'), where('adminId', '==', uid))
  const electionsSnapshot = await getDocs(electionsQuery)

  for (const electionDoc of electionsSnapshot.docs) {
    try {
      await deleteVotesByElection(electionDoc.id)
      await deleteDoc(electionDoc.ref)
    } catch (error) {
      console.error('[deleteOwnedElections] Failed to delete election', electionDoc.id, ':', error.code, error.message)
      throw new Error(`Failed to delete election: ${error.message}`)
    }
  }
}

const getSnapshotPreferServer = async (queryRef) => {
  try {
    return await getDocsFromServer(queryRef)
  } catch {
    return await getDocs(queryRef)
  }
}

const deleteUserProfileFromFirestore = async (uid) => {
  const primaryUserRef = doc(db, 'users', uid)
  
  try {
    await deleteDoc(primaryUserRef)
  } catch (error) {
    console.error('[deleteUserProfileFromFirestore] Primary user doc delete failed:', error.code, error.message)
    throw new Error(`Failed to delete user profile: ${error.message}`)
  }

  const fallbackUsersQuery = query(collection(db, 'users'), where('uid', '==', uid), limit(20))
  const fallbackSnapshot = await getSnapshotPreferServer(fallbackUsersQuery)

  if (!fallbackSnapshot.empty) {
    const batch = writeBatch(db)
    fallbackSnapshot.docs.forEach((userDoc) => {
      batch.delete(userDoc.ref)
    })
    
    try {
      await batch.commit()
    } catch (error) {
      console.error('[deleteUserProfileFromFirestore] Fallback batch delete failed:', error.code, error.message)
      throw new Error(`Failed to delete fallback user profiles: ${error.message}`)
    }
  }

  const verifyPrimarySnap = await getDoc(primaryUserRef)
  const verifyFallbackSnap = await getSnapshotPreferServer(fallbackUsersQuery)

  if (verifyPrimarySnap.exists() || !verifyFallbackSnap.empty) {
    throw new Error('Could not fully delete your Firestore profile. Your Authentication account was kept intact to avoid partial deletion. Please try again.')
  }
}

const deleteAuthUserViaRestApi = async (activeUser) => {
  const apiKey = auth?.app?.options?.apiKey

  if (!apiKey) {
    throw new Error('Missing Firebase API key required to delete Authentication account.')
  }

  const idToken = await activeUser.getIdToken(true)
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idToken })
  })

  if (!response.ok) {
    let errorMessage = 'Failed to delete account from Firebase Authentication.'

    try {
      const payload = await response.json()
      const serverMessage = payload?.error?.message
      if (serverMessage) {
        errorMessage = `Failed to delete account from Firebase Authentication: ${serverMessage}`
      }
    } catch {
    }

    throw new Error(errorMessage)
  }
}

export const loginUser = async (email, password) => {
  try {
    const normalizedEmail = normalizeAndValidateEmail(email)
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    await ensureUserProfileExists(userCredential.user)
    return userCredential.user
  } catch (error) {
    throw new Error(mapAuthError(error))
  }
}

export const logoutUser = async () => {
  try {
    await auth.signOut()
  } catch (error) {
    throw new Error(error.message)
  }
}

export const resetPassword = async (email) => {
  try {
    const normalizedEmail = normalizeAndValidateEmail(email)
    await sendPasswordResetEmail(auth, normalizedEmail)
  } catch (error) {
    throw new Error(mapAuthError(error))
  }
}

export const getCurrentUser = () => {
  return auth.currentUser
}

export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      return userSnap.data()
    }

    const fallbackQuery = query(collection(db, 'users'), where('uid', '==', uid))
    const fallbackSnapshot = await getDocs(fallbackQuery)
    if (!fallbackSnapshot.empty) {
      return fallbackSnapshot.docs[0].data()
    }

    return null
  } catch (error) {
    throw new Error(error.message)
  }
}

export const deleteOwnAccount = async (currentPassword) => {
  let uid = null
  const deletionSessionKey = 'accountDeletionInProgress'

  try {
    const currentUser = auth.currentUser

    if (!currentUser?.uid) {
      throw new Error('No authenticated user found.')
    }

    uid = currentUser.uid

    if (!currentUser.email) {
      throw new Error('Unable to verify your account email for deletion. Please log out and log in again, then retry.')
    }

    if (!currentPassword || !currentPassword.trim()) {
      throw new Error('Please enter your current password to permanently delete your account from Firebase Authentication.')
    }

    const passwordToUse = currentPassword.trim()
    const credential = EmailAuthProvider.credential(currentUser.email, passwordToUse)
    await reauthenticateWithCredential(currentUser, credential)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(deletionSessionKey, 'true')
    }

    try {
      await deleteOwnedElections(uid)
    } catch (error) {
      console.error('[deleteOwnAccount] Failed to delete elections (non-blocking):', error.code, error.message)
    }

    try {
      await deleteVotesByUser(uid)
    } catch (error) {
      console.error('[deleteOwnAccount] Failed to delete votes (non-blocking):', error.code, error.message)
    }

    try {
      await deleteUserProfileFromFirestore(uid)
    } catch (error) {
      console.error('[deleteOwnAccount] Failed to delete profile (non-blocking):', error.code, error.message)
    }

    const ensureActiveUserForDeletion = async () => {
      if (auth.currentUser?.uid === uid) {
        return auth.currentUser
      }

      const restoredSession = await signInWithEmailAndPassword(auth, currentUser.email, passwordToUse)
      return restoredSession.user
    }

    const deleteAuthUserWithFreshReauth = async () => {
      const activeUser = await ensureActiveUserForDeletion()
      const freshCredential = EmailAuthProvider.credential(activeUser.email, passwordToUse)
      await reauthenticateWithCredential(activeUser, freshCredential)

      try {
        await deleteUser(activeUser)
      } catch (deleteError) {
        console.error('[deleteOwnAccount] SDK deleteUser failed:', deleteError.code, deleteError.message)
        await deleteAuthUserViaRestApi(activeUser)
      }
    }

    try {
      await deleteAuthUserWithFreshReauth()
    } catch (error) {
      const retryableDeleteCodes = [
        'auth/requires-recent-login',
        'auth/user-token-expired',
        'auth/invalid-user-token',
      ]

      if (retryableDeleteCodes.includes(error?.code)) {
        await deleteAuthUserWithFreshReauth()
      } else {
        throw error
      }
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(deletionSessionKey)
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(deletionSessionKey)
    }

    throw new Error(mapAuthError(error))
  }
}
export const saveFaceDataToFirestore = async (userId, detections) => {
  try {
    if (!userId || !detections || detections.length < 3) {
      throw new Error('Invalid user ID or detections data')
    }

    const sanitizeDescriptor = (descriptor) =>
      Array.from(descriptor || []).map((value) => {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : 0
      })

    const centerLeft = sanitizeDescriptor(detections[0]?.descriptor)
    const center = sanitizeDescriptor(detections[1]?.descriptor)
    const centerRight = sanitizeDescriptor(detections[2]?.descriptor)

    if (!centerLeft.length || !center.length || !centerRight.length) {
      throw new Error('Face descriptors are empty. Please scan again.')
    }

    const faceData = {
      centerLeft,
      center,
      centerRight,
      registeredAt: new Date().toISOString(),
    }

    const payload = JSON.parse(
      JSON.stringify({
        faceData,
        faceRegistered: true,
        faceRegisteredAt: new Date().toISOString(),
      })
    )

    // Save to Firestore in users collection
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, payload, { merge: true })

    return { success: true, message: 'Face data saved successfully' }
  } catch (error) {
    console.error('Error saving face data:', error)

    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied by Firestore rules for face data write. Please deploy updated rules and try again.')
    }

    if (error?.code === 'invalid-argument') {
      throw new Error(error?.message || 'Face data format was rejected by Firestore. Please scan again.')
    }

    throw new Error(error?.message || 'Failed to save face data. Please try again.')
  }
}

export const getFaceDataFromFirestore = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      throw new Error('User document not found')
    }

    const userData = userSnap.data()
    if (!userData.faceData || !userData.faceRegistered) {
      return null
    }

    return userData.faceData
  } catch (error) {
    console.error('Error fetching face data:', error)
    throw new Error('Failed to fetch face data')
  }
}

export const isFaceRegistered = async (userId) => {
  try {
    if (!userId) {
      return false
    }

    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return false
    }

    return userSnap.data().faceRegistered === true
  } catch (error) {
    console.error('Error checking face registration:', error)
    return false
  }
}