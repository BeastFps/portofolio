/**
 * portfolio-sync.js  — reads images from IndexedDB (written by admin.html)
 * and applies them to portfolio.html using the page's own gallery functions.
 *
 * Requires db.js to be loaded first.
 * Place AFTER the main <script> block so galleryState / galleryRender exist.
 */

// ── IndexedDB helpers (inline so db.js is optional as a separate file) ────
const _DB_NAME    = 'portfolioDB';
const _DB_VERSION = 1;
const _STORE      = 'images';

function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_DB_NAME, _DB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(_STORE);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = e => reject(e.target.error);
  });
}
async function _dbGet(key) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(_STORE, 'readonly').objectStore(_STORE).get(key);
    req.onsuccess = e => resolve(e.target.result ?? null);
    req.onerror   = e => reject(e.target.error);
  });
}
async function _dbKeys(prefix) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(_STORE, 'readonly').objectStore(_STORE).getAllKeys();
    req.onsuccess = e => resolve(e.target.result.filter(k => k.startsWith(prefix)));
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Apply profile photo ───────────────────────────────────────────────────
async function _syncProfilePhoto() {
  try {
    const src = await _dbGet('portfolio_profile-main');
    if (!src) return;

    const img  = document.getElementById('profilePhoto');
    const zone = document.getElementById('photoUploadZone');
    const btn  = document.getElementById('photoChangeBtn');
    if (!img) return;

    img.src = src;
    img.classList.add('loaded');
    if (zone) zone.style.display = 'none';
    if (btn)  btn.classList.add('visible');
  } catch (e) {
    console.warn('[portfolio-sync] profile photo error:', e);
  }
}

// ── Apply gallery images ──────────────────────────────────────────────────
async function _syncGalleries() {
  try {
    const keys = await _dbKeys('portfolio_proj-');
    if (!keys.length) return;

    for (const key of keys) {
      // key format: portfolio_proj-{projIdx}-img-{imgIdx}
      const m = key.match(/^portfolio_proj-(\d+)-img-(\d+)$/);
      if (!m) continue;

      const src = await _dbGet(key);
      if (!src) continue;

      const projIdx = parseInt(m[1], 10);
      const imgIdx  = parseInt(m[2], 10);

      // Mirror exactly what galleryAddImg() does in portfolio.html
      const g = galleryState(projIdx);
      g.images[imgIdx] = src;
      if (g.current === undefined || g.current === null) g.current = imgIdx;

      const thumbEl = document.getElementById(`gthumb-${projIdx}-${imgIdx}`);
      if (thumbEl) {
        thumbEl.className = 'gallery-thumb';
        thumbEl.innerHTML = `<img src="${src}" alt="">`;
        // closure keeps correct indices
        (function(pi, ii) {
          thumbEl.onclick = () => {
            galleryState(pi).current = ii;
            galleryRender(pi);
          };
        })(projIdx, imgIdx);
      }

      galleryRender(projIdx);
    }
  } catch (e) {
    console.warn('[portfolio-sync] gallery error:', e);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────
async function syncPortfolio() {
  await _syncProfilePhoto();
  await _syncGalleries();
}

// Run once the page (and its gallery functions) are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncPortfolio);
} else {
  syncPortfolio();
}

// Live updates from admin tab via BroadcastChannel
if (typeof BroadcastChannel !== 'undefined') {
  new BroadcastChannel('portfolio_updates').addEventListener('message', syncPortfolio);
}