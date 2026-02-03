const https = require('https');
const { geminiApiKey, API_DELAY, MAX_RETRIES, GEMINI_DEBOUNCE_MS } = require('../config/config');
const { log, delay } = require('../utils/logger');

// In-memory cache for API responses to avoid duplicate calls
const geminiCache = {};
// Debounce tracker to prevent rapid repeated calls
const geminiDebounce = {};

async function callGeminiAPI(prompt, retries = 0) {
  // Check cache first
  if (geminiCache[prompt]) {
    return Promise.resolve(geminiCache[prompt]);
  }

  // Debounce: if a call for this prompt is in progress, return the same promise
  if (geminiDebounce[prompt]) {
    return geminiDebounce[prompt];
  }

  // Wrap the actual API call in a promise and store it in debounce tracker
  const apiPromise = new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: '/v1beta/models/gemini-2.5-flash:generateContent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
<<<<<<< HEAD:services/geminiService.js
        'Content-Length': Buffer.byteLength(data),
        'x-goog-api-key': geminiApiKey
=======
        'Content-Length': Buffer.byteLength(data)
>>>>>>> upgrade:packages/core/services/geminiService.js
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.error) {
            if (retries < MAX_RETRIES) {
              const backoff = Math.pow(2, retries) * 1000;
              log(`⚠️ API Error (retry ${retries + 1}/${MAX_RETRIES}, waiting ${backoff / 1000}s): ${response.error.message}`, 'yellow');
              setTimeout(() => {
                callGeminiAPI(prompt, retries + 1).then(resolve).catch(reject);
              }, backoff);
              return;
            }
            reject(new Error(response.error.message));
            return;
          }
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            geminiCache[prompt] = text;
            resolve(text);
          } else {
            console.error('Unexpected Response Structure:', responseData);
            reject(new Error('Unexpected response format'));
          }
        } catch (err) {
          if (retries < MAX_RETRIES) {
            const backoff = Math.pow(2, retries) * 1000;
            setTimeout(() => {
              callGeminiAPI(prompt, retries + 1).then(resolve).catch(reject);
            }, backoff);
            return;
          }
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      if (retries < MAX_RETRIES) {
        const backoff = Math.pow(2, retries) * 1000;
        setTimeout(() => {
          callGeminiAPI(prompt, retries + 1).then(resolve).catch(reject);
        }, backoff);
        return;
      }
      reject(err);
    });

    req.setTimeout(30000);
    req.write(data);
    req.end();
  });

  geminiDebounce[prompt] = apiPromise;
  setTimeout(() => { delete geminiDebounce[prompt]; }, GEMINI_DEBOUNCE_MS);

  return apiPromise;
}

module.exports = {
  callGeminiAPI
};