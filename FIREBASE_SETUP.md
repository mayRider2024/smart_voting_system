# 🔧 Firebase Setup Guide

This guide will walk you through setting up Firebase for the Smart Voting System.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `smart-voting-system`
4. You can disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Create a Web App

1. In Firebase Console, click the **Web icon** (</>) to create a web app
2. App nickname: `smart-voting-web`
3. Check "Also set up Firebase Hosting"
4. Click "Register app"
5. **Important**: Copy your Firebase config and save it locally

Your config will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smart-voting-system.firebaseapp.com",
  projectId: "smart-voting-system",
  storageBucket: "smart-voting-system.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abc123..."
};
```

## Step 3: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose location (closest to your users)
4. Select **"Production mode"** (we'll update rules next)
5. Wait for database to be created (2-3 minutes)

### Important: Create Required Collections

Firestore uses collections like folders. Create these collections:

1. **users** collection
2. **elections** collection  
3. **votes** collection

To create a collection:
1. Click "Start collection"
2. Enter collection ID
3. Click "Auto-generate ID" for first document
4. Add dummy data or click save

## Step 4: Configure Security Rules

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the entire content with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to read/write their own data
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if request.auth != null;
    }

    // Elections - readable by all authenticated users
    match /elections/{electionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.adminId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.adminId == request.auth.uid;
    }

    // Votes - strict rules to prevent manipulation
    match /votes/{voteId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/elections/$(request.resource.data.electionId)).data.adminId == request.auth.uid;
      allow create: if request.auth != null &&
        !exists(/databases/$(database)/documents/votes/$(encodeToString([request.auth.uid, request.resource.data.electionId])))) &&
        get(/databases/$(database)/documents/elections/$(request.resource.data.electionId)).data.status == 'active';
      allow list: if request.auth != null;
      allow delete: if false; // Votes are immutable
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"

## Step 5: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started" or "Sign-in method"
3. Click on **Email/Password**
4. Enable "Email/Password"
5. Click "Save"

## Step 6: Configure Environment Variables

1. In project root, create `.env.local`:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=smart-voting-system.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-voting-system
VITE_FIREBASE_STORAGE_BUCKET=smart-voting-system.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
```

2. Replace values with your actual Firebase config

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Testing the Setup

1. **Register** with test account:
   - Email: `test@example.com`
   - Password: `password123`

2. **Create an election** from Admin Dashboard

3. **Cast a vote** and check if it updates in real-time

4. **Check Firestore** - go to Firebase Console and verify:
   - New user created in `users` collection
   - Election created in `elections` collection
   - Vote recorded in `votes` collection

## Troubleshooting

### Error: "auth/permission-denied"
- Check `.env.local` has correct Firebase credentials
- Verify authentication is enabled in Firebase Console

### Error: "Missing or insufficient permissions"
- Go to Firestore Rules and replace with rules above
- Click "Publish" to save changes
- Wait 5 seconds before testing again

### Error: "Cannot create collection"
- Firestore auto-creates collections when you add documents
- You don't need to manually create them - just let the app do it

### Error: "Module not found"
- Run `npm install` again
- Delete `node_modules` and `.package-lock.json`
- Run `npm install` fresh

## Monitoring in Firebase Console

1. **Firestore** tab: View all data, verify documents created
2. **Authentication** tab: See registered users
3. **Rules** tab: Check your security rules are correct
4. **Storage** tab: For uploading files (if needed)

## Security Best Practices

✅ **Do**:
- Keep `.env.local` out of version control (added to `.gitignore`)
- Regularly review Firestore rules
- Monitor authentication attempts
- Set up billing alerts

❌ **Don't**:
- Commit `.env.local` to git
- Leave rules with `allow read, write: if true`
- Share Firebase API key publicly
- Store sensitive data without encryption

## Scaling Considerations

- Firestore auto-scales with users
- Free tier: 25,000 reads, 10,000 writes, 1 GB storage/day
- Typical voting app uses minimal resources
- Scale automatically as traffic grows

## Next Steps

1. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

2. Add features:
   - Email notifications
   - Advanced analytics
   - Export results to CSV
   - Multi-language support

3. Improve UI/UX:
   - Dark mode
   - Mobile optimization
   - Accessibility improvements

---

**Need Help?**
- [Firebase Docs](https://firebase.google.com/docs)
- [Community Support](https://stackoverflow.com/questions/tagged/firebase)
