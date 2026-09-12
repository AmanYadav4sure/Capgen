# Firebase Setup & Configuration Guide

This guide details the Firebase setup for **VideoCaptions.ai**, including Authentication, Cloud Firestore for caption projects, and the required environment variables.

---

## 1. What You Need to Provide (.env.local)

Create or update the `.env.local` file in your project root with your Firebase Web App credentials:

```env
# Groq Whisper API (for Audio Transcription)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Firebase Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **Note:** VideoCaptions.ai includes an offline local fallback. If Firebase keys are not yet provided, the app will continue to work seamlessly using browser `localStorage` for projects and local auth simulation so you are never blocked.

---

## 2. Step-by-Step: Where to Find Your Firebase Keys

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (or select an existing one).
3. On the Project Overview page, click the **Web icon (`</>`)** to add a Web App.
4. Give it a nickname (e.g. `VideoCaptions Studio`) and click **Register app**.
5. You will see a `const firebaseConfig = { ... }` block:
   - Copy each value into the matching `NEXT_PUBLIC_FIREBASE_*` variable in `.env.local`.

---

## 3. Enable Firebase Authentication

1. In the left navigation of the Firebase Console, go to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Click **Email/Password**.
   - Enable **Email/Password** and click **Save**.
4. (Optional) Under **Settings > Authorized domains**, ensure `localhost` is present (it is enabled by default).

---

## 4. Enable Cloud Firestore Database

1. In the left navigation, go to **Build > Firestore Database**.
2. Click **Create database**.
3. Select your preferred Cloud Firestore location (e.g., `nam5 (us-central)` or closest to your users).
4. Choose **Start in production mode** (or test mode).
5. Go to the **Rules** tab and paste the following security rules to protect user projects:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Projects collection: Users can only read, write, and delete their own projects
    match /projects/{projectId} {
      // Allow read/write if user owns the document or if user is creating an unassigned project
      allow read, write: if request.auth != null && (
        resource == null || resource.data.userId == request.auth.uid
      );
      
      // Allow creation when authenticated
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Allow deletion by owner
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

6. Click **Publish**.

---

## 5. Enable Firebase Storage (Optional for Video Hosting)

If you wish to store raw video files in the cloud:

1. In the left navigation, go to **Build > Storage**.
2. Click **Get Started**.
3. Under the **Rules** tab, apply:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **Publish**.

---

## 6. How the App Integrates with Firebase

- **Authentication**: [`lib/firebase/auth.ts`](file:///c:/Users/hajur/Documents/codes/captionstd/lib/firebase/auth.ts) handles `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, password resets, and session subscriptions.
- **Database (Firestore)**: [`lib/firebase/db.ts`](file:///c:/Users/hajur/Documents/codes/captionstd/lib/firebase/db.ts) saves project records with title, video reference, full transcript, word timings, and chosen style preset.
- **Sign In & Sign Up Pages**: [`app/sign-in/page.tsx`](file:///c:/Users/hajur/Documents/codes/captionstd/app/sign-in/page.tsx) and [`app/sign-up/page.tsx`](file:///c:/Users/hajur/Documents/codes/captionstd/app/sign-up/page.tsx) connect directly to Firebase Auth.
- **Studio Editor**: [`app/editor/page.tsx`](file:///c:/Users/hajur/Documents/codes/captionstd/app/editor/page.tsx) syncs live project edits to Cloud Firestore.
