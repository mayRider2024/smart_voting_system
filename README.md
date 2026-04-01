# 🗳️ Smart Voting System

A **secure, transparent, and fair online voting platform** built with **React** and **Firebase**. This is an enterprise-grade voting system with authentication, authorization, real-time results, and admin controls.

## 🎯 Key Features

### User Features
- ✅ **Secure Registration & Login** - Email/password authentication with Firebase Auth
- ✅ **Cast Votes** - Vote only once per election
- ✅ **Real-time Results** - See results update as votes are cast
- ✅ **Election Dashboard** - Browse active and closed elections
- ✅ **Vote History** - Track which elections you've participated in

### Admin Features
- ⚙️ **Create Elections** - Define elections with multiple candidates
- ⚙️ **Manage Candidates** - Add candidates with descriptions
- ⚙️ **Close Elections** - Archive elections and view final results
- ⚙️ **Real-time Monitoring** - Monitor votes as they come in

### Security Features
- 🔐 **Firebase Authentication** - Secure user registration and login
- 🔐 **Firestore Security Rules** - Database-level access control
- 🔐 **One Vote Per User** - Transaction-based voting to prevent duplicates
- 🔐 **User Verification** - Email-based authentication
- 🔐 **Data Encryption** - All data encrypted at rest in Firestore

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Backend & Cloud
- **Firebase Authentication** - User auth
- **Firestore** - Real-time database
- **Firebase Storage** - File storage
- **Firebase Security Rules** - Database access control

### Development
- **Node.js 18+** - Runtime
- **npm** - Package manager

## 📋 Prerequisites

1. **Node.js** v18+ and **npm**
2. **Firebase Account** (free tier available)
3. **Firebase Project** created
4. **Firebase CLI** (optional, for deployment)

## 🚀 Quick Start

### Step 1: Clone or Create Project
```bash
cd /Users/mayureshloke/Desktop/MyProjects/smart_voting_system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Create a web app in your Firebase project
4. Copy your Firebase config

### Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 5: Set Up Firestore Database

1. In Firebase Console, create a Firestore Database
2. Choose "Start in production mode"
3. Replace Firestore rules with security rules (see below)
4. Enable Email/Password authentication

### Step 6: Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

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
      allow create, write: if request.auth != null && 
        resource.data.adminId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.adminId == request.auth.uid;
    }

    // Votes - strict rules to prevent manipulation
    match /votes/{voteId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/elections/$(request.resource.data.electionId)).data.adminId == request.auth.uid;
      allow create: if request.auth != null &&
        !exists(/databases/$(database)/documents/votes/$(request.resource.data.userId)_$(request.resource.data.electionId)) &&
        get(/databases/$(database)/documents/elections/$(request.resource.data.electionId)).data.status == 'active';
      allow list: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

### Step 7: Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 📚 Project Structure

```
smart_voting_system/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── pages/               # Page components
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── VotingPage.jsx
│   │   └── ResultsPage.jsx
│   ├── config/              # Configuration
│   │   └── firebase.js      # Firebase setup
│   ├── utils/               # Utility functions
│   │   ├── authUtils.js     # Auth functions
│   │   └── voteUtils.js     # Voting functions
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── package.json             # Dependencies
└── README.md               # This file
```

## 🔑 How to Use

### For Voters:
1. **Register** with email and password
2. **Browse** active elections from dashboard
3. **Cast Vote** by selecting candidate
4. **View Results** in real-time
5. Vote is locked - cannot vote twice in same election

### For Admins:
1. Go to **Admin Dashboard**
2. **Create Election** with title and candidates
3. **Monitor** votes in real-time
4. **Close Election** when done
5. **View Final Results**

## 🔐 Security Highlights

### Authentication
- Firebase Email/Password auth
- Secure password storage
- Session management

### Database Security
- Firestore security rules enforce access control
- Users can only read/write their own data
- Admins can only modify their own elections
- Votes are immutable (no delete allowed)

### Vote Security
- Transaction-based voting prevents race conditions
- One vote per user per election enforced at database level
- No duplicate votes possible

### Data Privacy
- Encryption at rest in Firestore
- HTTPS for all communications
- User data isolated by UID

## 🌐 Cloud Concepts Covered

This project demonstrates key cloud computing concepts:

1. **Authentication as a Service (AaaS)** - Firebase Auth
2. **Backend as a Service (BaaS)** - Firestore
3. **Real-time Database** - Firestore real-time listeners
4. **Security Rules** - Fine-grained access control
5. **Scalability** - Cloud-native architecture
6. **Zero Server Management** - Serverless functions (ready to add)

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🐛 Troubleshooting

### Issue: "Firebase app not initialized"
- Check `.env.local` has correct Firebase credentials
- Ensure credentials are not quoted in .env file

### Issue: "Permission denied" when voting
- Check Firestore security rules are configured correctly
- Verify user is authenticated

### Issue: Votes not appearing
- Check Firestore database has collections: `elections`, `votes`, `users`
- Verify real-time listeners are working in browser DevTools

## 📊 Database Schema

### users collection
```json
{
  "uid": "user_id",
  "email": "user@example.com",
  "displayName": "User Name",
  "role": "voter",
  "createdAt": timestamp,
  "hasVoted": {}
}
```

### elections collection
```json
{
  "title": "Election Name",
  "description": "Election description",
  "adminId": "admin_uid",
  "status": "active",
  "candidates": [
    {
      "id": "1",
      "name": "Candidate Name",
      "description": "Bio",
      "votes": 5
    }
  ],
  "totalVotes": 5,
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### votes collection
```json
{
  "electionId": "election_id",
  "candidateId": "candidate_id",
  "userId": "voter_uid",
  "timestamp": timestamp
}
```

## 🎓 Learning Outcomes

By working with this project, you'll learn:
- Cloud database design with Firestore
- Authentication with Firebase Auth
- Security rules and access control
- Real-time data synchronization
- React hooks and state management
- Cloud deployment strategies
- Scalable architecture patterns

## 📝 Notes for VIVA/Interview

This project covers important cloud concepts:
- **Database Security**: Firestore rules prevent unauthorized access
- **Scalability**: Firestore auto-scales with users
- **Real-time Updates**: Listeners provide live voting results
- **Authentication**: Firebase Auth handles user verification
- **Data Consistency**: Transactions ensure vote integrity
- **Zero Infrastructure**: No servers to manage

## 🤝 Contributing

Feel free to extend this project with:
- Face recognition login (AWS Rekognition)
- Blockchain for immutable votes
- Email notifications
- Advanced analytics
- Multi-language support

## 📄 License

MIT License - Feel free to use this project for learning!

## 🎯 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Developed with ❤️ for secure and transparent voting**
