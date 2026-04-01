# 🚀 Development Guide

This guide covers extending and improving the Smart Voting System.

## Project Overview

The Smart Voting System is built with:
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Architecture**: Component-based React with Router

## Code Structure

### Components (`src/components/`)
- `Navbar.jsx` - Navigation bar with auth status
- `Footer.jsx` - Footer with info

### Pages (`src/pages/`)
- `LandingPage.jsx` - Welcome page
- `Login.jsx` - User login
- `Register.jsx` - User registration
- `Dashboard.jsx` - Main dashboard for voters
- `AdminDashboard.jsx` - Admin election management
- `VotingPage.jsx` - Casting votes
- `ResultsPage.jsx` - Viewing results

### Utilities (`src/utils/`)
- `authUtils.js` - Authentication functions
- `voteUtils.js` - Voting database operations

### Configuration (`src/config/`)
- `firebase.js` - Firebase initialization

## How to Extend

### Adding a New Feature

1. **Define Requirements** - What should it do?
2. **Update Database Schema** - Add new collections if needed
3. **Update Security Rules** - Configure Firestore access
4. **Create Components** - Build React components
5. **Test Thoroughly** - Check all edge cases

### Example: Adding Email Notifications

```javascript
// 1. Create new utility: src/utils/emailUtils.js
export const sendVoteConfirmation = async (email, electionName) => {
  // Use Firebase Functions to send email
}

// 2. Call in VotingPage.jsx after vote cast
const handleVote = async () => {
  await castVote(...)
  await sendVoteConfirmation(user.email, election.title)
}
```

### Example: Adding Export to CSV

```javascript
// 1. Create utility: src/utils/exportUtils.js
export const exportResultsToCSV = (election, results) => {
  const csv = `Candidate,Votes\n`
  election.candidates.forEach(c => {
    csv += `${c.name},${results[c.id] || 0}\n`
  })
  // Download CSV
}

// 2. Add button to ResultsPage
<button onClick={() => exportResultsToCSV(election, results)}>
  📥 Export Results
</button>
```

## Common Development Tasks

### Running Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm run preview  # Preview production build
```

### Adding New Dependencies
```bash
npm install package-name
```

### Debugging

1. **Browser DevTools**:
   - F12 → Console tab for errors
   - Network tab for API calls
   - Application tab for localStorage

2. **Firebase Console**:
   - Check Firestore data in Dashboard
   - Monitor Authentication users
   - View error logs

3. **React DevTools**:
   - Install React DevTools browser extension
   - Inspect component props/state

## Adding Authentication Options

### Adding Google Login

```javascript
// 1. Update firebase.js
import { GoogleAuthProvider } from "firebase/auth"

// 2. Create new function in authUtils.js
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

// 3. Add button to Login.jsx
<button onClick={loginWithGoogle}>
  Login with Google
</button>
```

### Adding GitHub Login
Similar to Google, use `GithubAuthProvider`

## Adding Advanced Features

### 1. Real-time Vote Counter
```javascript
// In Dashboard.jsx
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'votes')),
    (snapshot) => {
      setLiveVoteCount(snapshot.docs.length)
    }
  )
  return unsubscribe
}, [])
```

### 2. Election Analytics
```javascript
// src/utils/analyticsUtils.js
export const getElectionAnalytics = async (electionId) => {
  const votes = await getResults(electionId)
  return {
    totalVotes: Object.values(votes).reduce((a, b) => a + b, 0),
    topCandidate: Object.entries(votes)
      .sort(([, a], [, b]) => b - a)[0],
    percentages: Object.entries(votes).map(([id, count]) => ({
      id,
      percentage: (count / total) * 100
    }))
  }
}
```

### 3. Admin Notifications
```javascript
// src/components/AdminNotifications.jsx
const [notifications, setNotifications] = useState([])

useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'votes'), 
      where('electionId', '==', electionId)),
    (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          showNotification(`New vote cast!`)
        }
      })
    }
  )
  return unsubscribe
}, [electionId])
```

## Performance Optimization

### 1. Code Splitting
```javascript
// Use lazy loading for pages
import { lazy, Suspense } from 'react'

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

// In App.jsx
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Suspense>
```

### 2. Memoization
```javascript
import { useMemo } from 'react'

// Prevent unnecessary re-renders
const topCandidate = useMemo(() => {
  return sortedCandidates[0]
}, [sortedCandidates])
```

### 3. Firestore Query Optimization
```javascript
// Bad: Fetches all documents
const allVotes = await getDocs(collection(db, 'votes'))

// Good: Use specific queries
const q = query(
  collection(db, 'votes'),
  where('electionId', '==', electionId),
  limit(100)
)
const specificVotes = await getDocs(q)
```

## Testing

### Unit Testing
```bash
npm install --save-dev vitest @testing-library/react
```

```javascript
// Example test
import { render, screen } from '@testing-library/react'
import Login from './pages/Login'

test('renders login form', () => {
  render(<Login />)
  expect(screen.getByText('🔐 Login')).toBeInTheDocument()
})
```

### Integration Testing
```javascript
// Test full flow: Register → Create Election → Vote
test('complete voting flow', async () => {
  // Register user
  // Create election
  // Cast vote
  // Verify results
})
```

## Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

## Environment Variables

### Development
```
.env.local  (Git ignored, never commit)
```

### Production
```
Set in Firebase Console or hosting platform
```

## Monitoring & Analytics

### Firebase Monitoring
- Go to Firebase Console → Firestore Database → Rules
- Monitor read/write operations

### Error Tracking
```javascript
// Use Firebase Crash Reporting
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('reCAPTCHA_public_key'),
  isTokenAutoRefreshEnabled: true
})
```

## Best Practices

### Component Organization
✅ One component per file
✅ Use meaningful names
✅ Keep components small and focused
✅ Extract shared logic to utils

### State Management
✅ Use React hooks (useState, useEffect)
✅ Keep state close to where it's used
✅ Use Firebase for shared state across components
✅ Consider Context API for global state

### Security
✅ Never expose Firebase keys in code
✅ Use environment variables
✅ Validate user inputs
✅ Use Firestore security rules

### Code Quality
✅ Use consistent formatting
✅ Add comments for complex logic
✅ Remove console.logs before production
✅ Handle errors gracefully

## Troubleshooting Development

### Hot Module Replacement (HMR) not working
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Firestore rules not updating
- Click "Publish" in Rules editor
- Wait 5-10 seconds
- Clear browser cache (Ctrl+Shift+Delete)

### Changes not reflecting
- Check `.env.local` has correct Firebase project
- Verify Firestore database is selected
- Check browser DevTools Network tab

## Next Steps

1. ✅ Complete basic features
2. ➡️ Add real-time notifications
3. ➡️ Implement advanced analytics
4. ➡️ Add face recognition (AWS Rekognition)
5. ➡️ Deploy to production

---

**Happy Coding! 🎉**
