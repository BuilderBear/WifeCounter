# The Wife-O-Meter 💍

A shared, cartoon-style counter for every time he says "wife". Anyone signed in with Google can tap **He said it! (+1)** or **Mistake (−1)**, and everyone sees the count update live.

- Static site in `public/` (no build step), hosted on Firebase Hosting
- Firebase Auth (Google sign-in) + Firestore (`counters/wife` document)
- `firestore.rules` only lets signed-in users move the count by exactly ±1, and never below 0

Until `public/firebase-config.js` is filled in, the page runs in a local **demo mode** (nothing saved).

## One-time setup

1. **Create the Firebase project** at https://console.firebase.google.com (or reuse one).
2. **Add a Web app**: Project settings → General → *Your apps* → `</>` icon. Copy the `firebaseConfig` values into `public/firebase-config.js`.
3. **Enable Google sign-in**: Build → Authentication → Get started → Sign-in method → Google → Enable.
4. **Create Firestore**: Build → Firestore Database → Create database (production mode, any region).
5. **Set your brother's name**: edit `BROTHER_NAME` at the top of `public/app.js`.
6. **Install the CLI and link the project**:

   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

## Deploy

```powershell
firebase deploy --only "hosting,firestore:rules"
```

Your app will be at `https://<project-id>.web.app`.

## Custom domain via Cloudflare (optional)

1. Firebase console → Hosting → *Add custom domain* → e.g. `wife.example.com`.
2. In Cloudflare DNS, add the records Firebase shows you. **Set them to "DNS only" (grey cloud)** until Firebase finishes verifying and issues the SSL certificate. After that you can leave them grey (simplest) or turn the proxy on with SSL mode **Full (strict)**.
3. Add the custom domain to Authentication → Settings → **Authorized domains**, or Google sign-in will fail on it.

## Local preview

```powershell
npx serve public -l 5050
```

## Resetting the count

Firestore console → `counters` → `wife` → edit `count`. (The rules block resets from the app, on purpose.)
