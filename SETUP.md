# Leaderboard setup

1. Go to https://console.firebase.google.com, create a project, and add a **Web app**.
2. Copy the config into `firebase-config.js`.
3. **Authentication > Sign-in method**: enable **Google**. Enable **Facebook** with the App ID/Secret from
   https://developers.facebook.com (create an app, add "Facebook Login"; paste the OAuth redirect URI that Firebase shows into the Facebook app).
4. **Authentication > Settings > Authorized domains**: add `roaixen.github.io` and, later, your custom domain.
5. **Firestore Database**: create a database, then paste `firestore.rules` into the Rules tab and publish.
6. Commit and push; GitHub Pages redeploys automatically.

Notes
- Google Play Games sign-in only works inside an Android app, not on the web.
- Scores come from the browser, so a determined cheater can fake them; the rules only cap the score and prevent lowering it or editing others'.
- Facebook public use needs a privacy policy URL and Meta app review.
