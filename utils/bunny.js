const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Upload a buffer to Bunny.net storage
 * @param {Buffer} buffer - file buffer
 * @param {string} fileName - path/filename inside storage zone (e.g. 'photos/abc.jpg')
 * @param {string} mimeType - file mime type
 * @returns {Promise<string>} - public CDN URL
 */
function uploadToBunny(buffer, fileName, mimeType) {
  return new Promise((resolve, reject) => {
    const endpoint = process.env.BUNNY_STORAGE_ENDPOINT;
    const zone = process.env.BUNNY_STORAGE_ZONE;
    const apiKey = process.env.BUNNY_API_KEY;
    const cdnUrl = process.env.BUNNY_CDN_URL;

    const uploadUrl = `${endpoint}/${zone}/${fileName}`;
    const parsed = new URL(uploadUrl);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
      },
    };

    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(`${cdnUrl}/${fileName}`);
        } else {
          reject(new Error(`Bunny upload failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

/**
 * Delete a file from Bunny.net storage
 * @param {string} fileName - path/filename inside storage zone
 */
function deleteFromBunny(fileName) {
  return new Promise((resolve, reject) => {
    const endpoint = process.env.BUNNY_STORAGE_ENDPOINT;
    const zone = process.env.BUNNY_STORAGE_ZONE;
    const apiKey = process.env.BUNNY_API_KEY;

    const deleteUrl = `${endpoint}/${zone}/${fileName}`;
    const parsed = new URL(deleteUrl);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'DELETE',
      headers: { 'AccessKey': apiKey },
    };

    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve();
        else reject(new Error(`Bunny delete failed: ${res.statusCode} ${data}`));
      });
    });

    req.on('error', reject);
    req.end();
  });
}

module.exports = { uploadToBunny, deleteFromBunny };