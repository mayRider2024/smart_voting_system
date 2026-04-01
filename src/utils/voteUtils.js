// Database utilities for voting operations
import { db } from '../config/firebase'
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDocsFromServer,
  getDoc,
  doc,
  query, 
  where,
  limit,
  deleteDoc,
  writeBatch,
  updateDoc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'

export const NOTA_CANDIDATE_ID = '__NOTA__'

const NOTA_CANDIDATE = {
  id: NOTA_CANDIDATE_ID,
  name: 'NOTA',
  description: 'None of the above',
  votes: 0
}

const getVoteDocId = (electionId, userId) => `${electionId}_${userId}`

const ensureNotaCandidate = (candidates = []) => {
  const safeCandidates = Array.isArray(candidates) ? candidates : []
  const hasNota = safeCandidates.some((candidate) => candidate?.id === NOTA_CANDIDATE_ID)

  if (hasNota) {
    return safeCandidates
  }

  return [...safeCandidates, NOTA_CANDIDATE]
}

const getTimestampMillis = (timestamp) => {
  if (!timestamp) {
    return 0
  }

  if (typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis()
  }

  if (typeof timestamp.seconds === 'number') {
    const nanos = typeof timestamp.nanoseconds === 'number' ? timestamp.nanoseconds : 0
    return (timestamp.seconds * 1000) + Math.floor(nanos / 1000000)
  }

  return 0
}

const getQuerySnapshotPreferServer = async (queryRef) => {
  try {
    return await getDocsFromServer(queryRef)
  } catch {
    return await getDocs(queryRef)
  }
}

export const createElection = async (electionData, adminId) => {
  try {
    const docRef = await addDoc(collection(db, 'elections'), {
      ...electionData,
      adminId: adminId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      totalVotes: 0,
      candidates: ensureNotaCandidate(electionData.candidates)
    })
    return docRef.id
  } catch (error) {
    throw new Error(error.message)
  }
}

export const backfillNotaForAdminElections = async (adminId) => {
  try {
    if (!adminId) {
      return 0
    }

    const electionsQuery = query(
      collection(db, 'elections'),
      where('adminId', '==', adminId)
    )
    const querySnapshot = await getDocs(electionsQuery)

    const batch = writeBatch(db)
    let updatedCount = 0

    querySnapshot.forEach((electionDoc) => {
      const electionData = electionDoc.data()
      const existingCandidates = Array.isArray(electionData.candidates) ? electionData.candidates : []
      const hasNota = existingCandidates.some((candidate) => candidate?.id === NOTA_CANDIDATE_ID)

      if (hasNota) {
        return
      }

      batch.update(electionDoc.ref, {
        candidates: ensureNotaCandidate(existingCandidates),
        updatedAt: serverTimestamp()
      })
      updatedCount += 1
    })

    if (updatedCount > 0) {
      await batch.commit()
    }

    return updatedCount
  } catch (error) {
    throw new Error(error.message)
  }
}

export const getElections = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'elections'))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      candidates: ensureNotaCandidate(doc.data().candidates)
    }))
  } catch (error) {
    throw new Error(error.message)
  }
}

export const getElectionById = async (electionId) => {
  try {
    const docRef = doc(db, 'elections', electionId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        candidates: ensureNotaCandidate(data.candidates)
      }
    }
    return null
  } catch (error) {
    throw new Error(error.message)
  }
}

export const castVote = async (electionId, candidateId, userId) => {
  try {
    const q = query(
      collection(db, 'votes'),
      where('electionId', '==', electionId),
      where('userId', '==', userId)
    )
    const existingVotes = await getQuerySnapshotPreferServer(q)

    if (!existingVotes.empty) {
      throw new Error('You have already voted in this election!')
    }

    const voteRef = doc(db, 'votes', getVoteDocId(electionId, userId))
    const electionRef = doc(db, 'elections', electionId)

    await runTransaction(db, async (transaction) => {
      const voteDoc = await transaction.get(voteRef)
      const electionDoc = await transaction.get(electionRef)

      if (voteDoc.exists()) {
        throw new Error('You have already voted in this election!')
      }

      if (!electionDoc.exists()) {
        throw new Error('Election not found!')
      }

      const electionData = electionDoc.data()
      const existingCandidates = ensureNotaCandidate(electionData.candidates)

      const candidateExists = existingCandidates.some((candidate) => candidate.id === candidateId)
      if (!candidateExists) {
        throw new Error('Selected candidate not found!')
      }

      const updatedCandidates = existingCandidates.map((candidate) => {
        if (candidate.id !== candidateId) {
          return candidate
        }

        return {
          ...candidate,
          votes: (candidate.votes || 0) + 1
        }
      })

      transaction.set(voteRef, {
        electionId: electionId,
        candidateId: candidateId,
        userId: userId,
        timestamp: serverTimestamp()
      })

      transaction.update(electionRef, {
        totalVotes: (electionData.totalVotes || 0) + 1,
        candidates: updatedCandidates,
        updatedAt: serverTimestamp()
      })
    })

    return voteRef.id
  } catch (error) {
    throw new Error(error.message)
  }
}

export const getResults = async (electionId) => {
  try {
    const q = query(collection(db, 'votes'), where('electionId', '==', electionId))
    const querySnapshot = await getQuerySnapshotPreferServer(q)
    const votes = {}
    const latestVoteByUser = new Map()

    querySnapshot.forEach((voteDoc) => {
      const voteData = voteDoc.data()
      const voterKey = voteData.userId || `doc:${voteDoc.id}`
      const currentTimestampMillis = getTimestampMillis(voteData.timestamp)
      const existingVote = latestVoteByUser.get(voterKey)

      if (!existingVote || currentTimestampMillis >= existingVote.timestampMillis) {
        latestVoteByUser.set(voterKey, {
          candidateId: voteData.candidateId,
          timestampMillis: currentTimestampMillis
        })
      }
    })

    latestVoteByUser.forEach(({ candidateId }) => {
      if (!candidateId) {
        return
      }

      votes[candidateId] = (votes[candidateId] || 0) + 1
    })

    return votes
  } catch (error) {
    throw new Error(error.message)
  }
}

export const getVoteTotalsForElectionIds = async (electionIds = []) => {
  try {
    const validElectionIds = [...new Set(electionIds.filter(Boolean))]

    if (validElectionIds.length === 0) {
      return {}
    }

    const voteTotals = {}
    const chunkSize = 10
    const uniqueVotes = new Set()

    for (let index = 0; index < validElectionIds.length; index += chunkSize) {
      const idsChunk = validElectionIds.slice(index, index + chunkSize)
      const q = query(collection(db, 'votes'), where('electionId', 'in', idsChunk))
      const querySnapshot = await getQuerySnapshotPreferServer(q)

      querySnapshot.forEach((voteDoc) => {
        const voteData = voteDoc.data()
        if (!voteData.electionId) {
          return
        }

        const uniqueVoteKey = voteData.userId
          ? `${voteData.electionId}::${voteData.userId}`
          : `${voteData.electionId}::doc:${voteDoc.id}`

        if (uniqueVotes.has(uniqueVoteKey)) {
          return
        }

        uniqueVotes.add(uniqueVoteKey)
        voteTotals[voteData.electionId] = (voteTotals[voteData.electionId] || 0) + 1
      })
    }

    return voteTotals
  } catch (error) {
    throw new Error(error.message)
  }
}

export const hasUserVoted = async (electionId, userId) => {
  try {
    const voteDocRef = doc(db, 'votes', getVoteDocId(electionId, userId))
    const voteDocSnap = await getDoc(voteDocRef)

    if (voteDocSnap.exists()) {
      return true
    }

    const q = query(
      collection(db, 'votes'),
      where('electionId', '==', electionId),
      where('userId', '==', userId)
    )
    const querySnapshot = await getQuerySnapshotPreferServer(q)
    return !querySnapshot.empty
  } catch (error) {
    throw new Error(error.message)
  }
}

export const updateElectionStatus = async (electionId, status) => {
  try {
    const electionRef = doc(db, 'elections', electionId)
    await updateDoc(electionRef, {
      status: status,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const deleteElection = async (electionId) => {
  try {
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

    const electionRef = doc(db, 'elections', electionId)
    await deleteDoc(electionRef)
  } catch (error) {
    throw new Error(error.message)
  }
}
