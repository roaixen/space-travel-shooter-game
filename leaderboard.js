/* Chrono Rocket leaderboard: Firebase Auth (Google, Facebook) + Firestore top scores.
   Fill in firebase-config.js (see SETUP.md). Until then the game still works; the panel says "not configured". */
(function () {
  "use strict";
  const cfg = window.FIREBASE_CONFIG;
  const configured = cfg && cfg.apiKey && !/^YOUR_/.test(cfg.apiKey) && window.firebase;

  // ---------- UI ----------
  const css = document.createElement('style');
  css.textContent = `
  #lb-bar{position:fixed;top:8px;right:8px;z-index:10;display:flex;gap:6px;align-items:center;font:13px system-ui,sans-serif;color:#dfe6ff}
  #lb-bar button,#lb-modal button{background:#1a2250;color:#fff;border:1px solid #3a5cff;border-radius:6px;padding:6px 10px;cursor:pointer;font:inherit}
  #lb-bar button:hover,#lb-modal button:hover{background:#2a3680}
  #lb-bar img{width:24px;height:24px;border-radius:50%}
  #lb-modal{position:fixed;inset:0;background:#000a;z-index:20;display:none;align-items:center;justify-content:center;font:14px system-ui,sans-serif;color:#eef}
  #lb-box{background:#0b0f26;border:1px solid #3a5cff;border-radius:10px;padding:16px;width:min(560px,94vw);max-height:86vh;overflow:auto}
  #lb-box h2{margin:0 0 10px;color:#ffd24a}
  #lb-box table{width:100%;border-collapse:collapse}
  #lb-box td{padding:6px 4px;border-bottom:1px solid #223}
  #lb-box td img{width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px}
  .lb-badge{font-size:11px;padding:1px 6px;border-radius:8px;background:#223;color:#9cf}
  `;
  document.head.appendChild(css);

  const bar = document.createElement('div');
  bar.id = 'lb-bar';
  document.body.appendChild(bar);
  const modal = document.createElement('div');
  modal.id = 'lb-modal';
  modal.innerHTML = '<div id="lb-box"><h2>Top Pilots</h2><div id="lb-body">Loading…</div><p><button id="lb-close">Close</button></p></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal || e.target.id === 'lb-close') modal.style.display = 'none'; });
  // keep game controls from firing while the modal is open
  modal.addEventListener('keydown', e => e.stopPropagation());

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https:\/\//.test(u || '') ? esc(u) : '');

  function btn(label, fn) { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; return b; }

  if (!configured) {
    bar.appendChild(btn('Leaderboard', () => {
      document.getElementById('lb-body').textContent = 'Leaderboard is not configured yet (see SETUP.md).';
      modal.style.display = 'flex';
    }));
    window.lbSubmit = function () {};
    return;
  }

  // ---------- Firebase ----------
  firebase.initializeApp(cfg);
  const auth = firebase.auth(), db = firebase.firestore();
  let user = null;

  function render() {
    bar.innerHTML = '';
    if (user) {
      if (user.photoURL && /^https:\/\//.test(user.photoURL)) { const i = document.createElement('img'); i.src = user.photoURL; i.referrerPolicy = 'no-referrer'; bar.appendChild(i); }
      const n = document.createElement('span'); n.textContent = user.displayName || 'Pilot'; bar.appendChild(n);
      bar.appendChild(btn('Sign out', () => auth.signOut()));
    } else {
      bar.appendChild(btn('Sign in with Google', () => signIn(new firebase.auth.GoogleAuthProvider())));
      bar.appendChild(btn('Sign in with Facebook', () => signIn(new firebase.auth.FacebookAuthProvider())));
    }
    bar.appendChild(btn('Leaderboard', showBoard));
  }
  function signIn(p) { auth.signInWithPopup(p).catch(e => alert('Sign-in failed: ' + e.message)); }
  auth.onAuthStateChanged(u => { user = u; render(); });

  function providerName(u) {
    const id = u.providerData && u.providerData[0] && u.providerData[0].providerId;
    return id === 'facebook.com' ? 'Facebook' : id === 'google.com' ? 'Google' : 'Other';
  }

  // Called by the game when a run ends. Only keeps the personal best.
  window.lbSubmit = async function (score, era) {
    if (!user || !Number.isInteger(score) || score <= 0) return;
    const ref = db.collection('scores').doc(user.uid);
    try {
      const snap = await ref.get();
      if (snap.exists && snap.data().score >= score) return;
      await ref.set({
        name: (user.displayName || 'Pilot').slice(0, 40),
        photo: user.photoURL || '',
        provider: providerName(user),
        score, era,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) { console.warn('score submit failed', e); }
  };

  async function showBoard() {
    const body = document.getElementById('lb-body');
    body.textContent = 'Loading…';
    modal.style.display = 'flex';
    try {
      const qs = await db.collection('scores').orderBy('score', 'desc').limit(25).get();
      if (qs.empty) { body.textContent = 'No scores yet. Be the first!'; return; }
      let rows = '', rank = 0;
      qs.forEach(d => {
        const s = d.data(); rank++;
        const photo = safeUrl(s.photo);
        rows += `<tr><td>${rank}</td><td>${photo ? `<img src="${photo}" referrerpolicy="no-referrer" alt="">` : ''}${esc(s.name)}</td>` +
                `<td><span class="lb-badge">${esc(s.provider)}</span></td><td style="text-align:right"><b>${esc(s.score)}</b></td></tr>`;
      });
      body.innerHTML = `<table>${rows}</table>`;
    } catch (e) { body.textContent = 'Could not load leaderboard.'; }
  }
})();
