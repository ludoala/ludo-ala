// ══════════════════════════════════════════
// LUDO ALA — Firebase Configuration
// 
// ⚠️  APNA FIREBASE CONFIG YAHAN DALO!
//
// Steps:
// 1. console.firebase.google.com → apna project
// 2. Project Settings → General → Your Apps
// 3. Web App → "Add App" (agar nahi hai)
// 4. "Firebase SDK snippet" → Config copy karo
// 5. Neeche paste karo
// ══════════════════════════════════════════

const firebaseConfig = {
  apiKey:            "AIzaSyCWOxSM-yX5OERHqWvadTBbA85wadNf-8E",
  authDomain:        "ludo-ala.firebaseapp.com",
  databaseURL:       "https://ludo-ala-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "ludo-ala",
  storageBucket:     "ludo-ala.firebasestorage.app",
  messagingSenderId: "348994138084",
  appId:             "1:348994138084:web:5dfaff1f119bac34b361f1"
};

// Firebase initialize
try {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase connected!");
} catch (e) {
  console.error("❌ Firebase config error — check firebase-config.js!", e);
}

// Global DB reference
const db   = firebase.database();
const auth = firebase.auth();
