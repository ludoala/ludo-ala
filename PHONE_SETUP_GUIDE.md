# 🎲 Ludo Ala — Phone Setup Guide
## Sirf Android Phone se Poora Setup!

---

## 📋 Required Apps (Phone pe install karo)

| App | Link | Use |
|---|---|---|
| GitHub Mobile | Play Store | Files upload, code edit |
| Chrome Browser | Already hai | Firebase setup |
| Any text editor | "Acode" app (free) | Code edit karna |

---

## 🔥 STEP 1 — Firebase Setup (Chrome browser se)

### A) Firebase Project Open karo
1. Chrome mein jaao: **console.firebase.google.com**
2. Google account se login karo
3. Apna project select karo (ya "Add project" → name: `ludo-ala`)

### B) Web App Add karo
1. Project Overview → **</>** icon (Web) click karo
2. App nickname: `Ludo Ala Web`
3. "Also set up Firebase Hosting" ✅ tick karo
4. **Register app** click karo
5. Config code dikhega — **COPY KARO** (screenshot le lo!)

```javascript
// Ye config dikhega — apna wala copy karo
const firebaseConfig = {
  apiKey: "AIzaSy...",           ← ye copy karo
  authDomain: "ludo-ala.firebaseapp.com",
  databaseURL: "https://ludo-ala-default-rtdb...",
  projectId: "ludo-ala",
  ...
};
```

### C) Authentication Enable karo
1. Firebase Console → **Authentication** → **Get Started**
2. **Google** provider → Enable → Support email dalo → Save
3. **Anonymous** provider → Enable → Save (Guest login ke liye)

### D) Realtime Database Banao
1. Firebase Console → **Realtime Database** → **Create Database**
2. Location: **asia-south1 (Mumbai)** — India ke liye best
3. Mode: **Test mode** → Next → Done

### E) Database Rules Set karo
1. Realtime Database → **Rules** tab
2. Sab rules delete karo, ye paste karo:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "leaderboard": {
      ".read": "auth != null",
      "$uid": { ".write": "$uid === auth.uid" }
    }
  }
}
```
3. **Publish** click karo ✅

---

## 🐙 STEP 2 — GitHub Setup (GitHub Mobile app se)

### A) Repository Banao
1. GitHub Mobile app open karo
2. **+** button → **New repository**
3. Name: `ludo-ala`
4. Description: `Ludo Ala Multiplayer Game`
5. **Private** (baad mein public kar sakte ho)
6. **Create repository**

### B) Files Upload karo
1. Repository open karo
2. **Add file** → **Upload files**
3. Ye saari files ek ek karke upload karo:
   - `index.html`
   - `css/style.css`
   - `js/firebase-config.js`
   - `js/auth.js`
   - `js/room.js`
   - `js/board.js`
   - `js/game.js`
   - `js/ai.js`
   - `js/ui.js`
   - `js/app.js`
   - `manifest.json`

### C) Firebase Config Edit karo (IMPORTANT!)
1. GitHub → `js/firebase-config.js` file open karo
2. **Edit (pencil icon)** click karo
3. `YOUR_API_KEY` ki jagah apna actual API key dalo
4. Baaki sab fields bhi fill karo
5. **Commit changes** click karo

---

## 🌐 STEP 3 — GitHub Pages (Free Hosting!)

### Enable karo:
1. GitHub Repository → **Settings** (gear icon)
2. Left side → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** → **/ (root)**
5. **Save** click karo

### URL milega:
```
https://YOUR_USERNAME.github.io/ludo-ala/
```
5-10 minute baad game live hoga! 🚀

---

## 🔒 STEP 4 — Google Login Fix (Authorized Domains)

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. **Add domain** click karo
3. Apna GitHub Pages URL dalo: `YOUR_USERNAME.github.io`
4. **Add** click karo ✅

---

## 📱 STEP 5 — Phone pe Install karo (PWA)

1. Chrome mein apna game URL kholo
2. Address bar ke paas **⋮ menu** → **"Add to Home screen"**
3. **Add** click karo
4. Ab phone mein app ki tarah dikhega! 🎉

---

## ✅ Final Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Google + Anonymous)
- [ ] Realtime Database created
- [ ] Database Rules set
- [ ] GitHub repo created
- [ ] All files uploaded
- [ ] `firebase-config.js` updated with real values
- [ ] GitHub Pages enabled
- [ ] GitHub Pages URL added to Firebase authorized domains
- [ ] Game working on phone browser
- [ ] Game installed as PWA

---

## 🆘 Troubleshooting

**Game nahi khul raha?**
→ `firebase-config.js` mein config sahi hai?
→ GitHub Pages enabled hai?

**Google login kaam nahi kar raha?**
→ Firebase Authorized Domains mein GitHub Pages URL add kiya?
→ Authentication → Google enabled hai?

**Multiplayer kaam nahi kar raha?**
→ Realtime Database URL sahi hai config mein?
→ Database rules set hain?

**Koi bhi problem ho to mujhe batao! 🙏**
