/**
 * db.js — shared IndexedDB wrapper + BroadcastChannel broadcaster
 * Load in admin.html BEFORE admin-upload.js
 *
 * Exposes: dbSet, dbGet, dbDelete, dbKeys, broadcastUpdate
 */

const DB_NAME    = 'portfolioDB';
const DB_VERSION = 1;
const STORE      = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = e => reject(e.target.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = e => resolve(e.target.result ?? null);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  });
}

async function dbKeys(prefix = '') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys();
    req.onsuccess = e => resolve(
      prefix ? e.target.result.filter(k => k.startsWith(prefix)) : e.target.result
    );
    req.onerror = e => reject(e.target.error);
  });
}

const _ch = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('portfolio_updates') : null;

function broadcastUpdate(key) {
  if (_ch) _ch.postMessage({ key });
}