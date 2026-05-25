/**
 * admin-upload.js — drop-in upload/storage logic for admin.html
 * Requires db.js loaded first.
 *
 * Replaces the old readAndStore() that used localStorage.
 * Keys written:
 *   portfolio_profile-main
 *   portfolio_proj-{projIdx}-img-{imgIdx}
 */

/**
 * Read a File and save it to IndexedDB, then broadcast to portfolio tab.
 * @param {File}   file
 * @param {string} key   e.g. 'profile-main' | 'proj-0-img-2'
 * @returns {Promise<string>} the data URL
 */
async function readAndStore(file, key) {
  const fullKey = 'portfolio_' + key;
  const dataUrl = await _fileToDataURL(file);
  await dbSet(fullKey, dataUrl);
  broadcastUpdate(fullKey);
  return dataUrl;
}

function _fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = ()  => reject(new Error('FileReader failed'));
    r.readAsDataURL(file);
  });
}

/**
 * Remove an image from IndexedDB and optionally clear a preview <img>.
 */
async function removeImage(key, imgEl) {
  await dbDelete('portfolio_' + key);
  broadcastUpdate('portfolio_' + key);
  if (imgEl) {
    imgEl.src = '';
    imgEl.closest?.('.upload-zone')?.classList.remove('has-image');
  }
}

/**
 * Re-populate all admin preview zones from IndexedDB on page load.
 * Call this after your admin UI is fully built.
 */
async function restoreAdminPreviews() {
  // Profile photo
  const profileSrc = await dbGet('portfolio_profile-main');
  if (profileSrc) {
    // Try the same IDs the admin panel uses
    const preview = document.getElementById('profile-preview')
                 || document.getElementById('profilePhoto')
                 || document.querySelector('[data-preview="profile"]');
    if (preview && preview.tagName === 'IMG') {
      preview.src = profileSrc;
      preview.style.display = 'block';
      preview.closest?.('.upload-zone')?.classList.add('has-image');
    }
  }

  // Project gallery images
  const keys = await dbKeys('portfolio_proj-');
  for (const key of keys) {
    const src = await dbGet(key);
    if (!src) continue;

    // key: portfolio_proj-{pi}-img-{ii}
    const m = key.match(/^portfolio_proj-(\d+)-img-(\d+)$/);
    if (!m) continue;
    const [, pi, ii] = m;

    // Try the ID pattern used in admin.html thumb slots
    const preview = document.getElementById(`gthumb-${pi}-${ii}-preview`)
                 || document.getElementById(`proj-${pi}-img-${ii}-preview`)
                 || document.querySelector(`[data-proj="${pi}"][data-img="${ii}"] img`);
    if (preview && preview.tagName === 'IMG') {
      preview.src = src;
      preview.style.display = 'block';
      preview.closest?.('.upload-zone')?.classList.add('has-image');
    }
  }
}
