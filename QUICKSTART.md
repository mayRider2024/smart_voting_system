# 🚀 Quick Start Guide

## 5-Minute Setup

### 1️⃣ Install Dependencies (2 min)
```bash
cd /Users/mayureshloke/Desktop/MyProjects/smart_voting_system
npm install
```

### 2️⃣ Get Firebase Credentials (2 min)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or use existing
3. Create Web App 
4. Copy config parameters

### 3️⃣ Configure Environment (1 min)
Create `.env.local`:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4️⃣ Run Application
```bash
npm run dev
```
Opens at `http://localhost:3000` ✅

## Testing Flow

1. **Register** with test account
2. **Go to Admin** and create election
3. **Cast vote** as different user
4. **View results** in real-time

## Important Files to Know

| File | What to Do |
|------|-----------|
| `src/config/firebase.js` | Update with your Firebase config |
| `.env.local` | Add your Firebase credentials |
| `src/App.jsx` | Main routing setup |
| `README.md` | Full documentation |
| `FIREBASE_SETUP.md` | Detailed Firebase config |

## Troubleshooting

**Problem**: "Cannot read firebase config"
- Check `.env.local` exists in root directory
- Verify Firebase credentials are correct
- Restart dev server

**Problem**: "Permission Denied" errors
- Go to Firebase Console → Firestore → Rules
- Paste security rules from `FIREBASE_SETUP.md`
- Click Publish

**Problem**: "Module not found"
- Run `npm install` again
- Clear cache: `rm -rf node_modules && npm install`

## Next Steps After Setup

1. ✅ Test user registration
2. ✅ Create test election
3. ✅ Cast test votes
4. ✅ Verify results
5. → Read `DEVELOPMENT.md` for extending features
6. → Deploy to Firebase Hosting

## Commands Reference

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Build for production
npm run preview   # Preview production build
```

## Project Features Included

✅ User authentication (register/login)
✅ Create elections (admin)
✅ Cast votes (secure)
✅ View results (real-time)
✅ Prevent duplicate votes
✅ Responsive design
✅ Admin dashboard

## Documentation Map

```
START HERE
   ↓
README.md (overview)
   ↓
FIREBASE_SETUP.md (setup)
   ↓
QUICKSTART.md (this file)
   ↓
DEVELOPMENT.md (advanced)
```

---

**You're All Set! Happy Voting! 🗳️**
