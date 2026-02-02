const https = require('https');
const { geminiApiKey, API_DELAY, MAX_RETRIES, GEMINI_DEBOUNCE_MS } = require('../config/config');
const { log, delay } = require('../utils/logger');

// In-memory cache for API responses to avoid duplicate calls
const geminiCache = {};
// Debounce tracker to prevent rapid repeated calls
const geminiDebounce = {};

async function callGeminiAPI(prompt, options = {}) {
  let retries = 0;
  let apiKey = geminiApiKey;
  let accessToken = null;

  if (typeof options === 'number') {
    retries = options;
  } else {
    retries = options.retries || 0;
    apiKey = options.apiKey || geminiApiKey;
    accessToken = options.accessToken || null;
  }

  // Check cache first (cache key needs to handle auth context? For now, global cache is risky if user-specific logic differs. But prompt is prompt. We assume same prompt + same model = same result regardless of user)
  if (geminiCache[prompt]) {
    return Promise.resolve(geminiCache[prompt]);
  }

  // Debounce
  if (geminiDebounce[prompt]) {
    return geminiDebounce[prompt];
  }

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

    // Construct Path and Headers based on Auth Type
    let pathParam = '/v1beta/models/gemini-2.5-flash:generateContent';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      headers['x-goog-user-project'] = process.env.GOOGLE_PROJECT_ID; // Recommended for OAuth
    } else {
      pathParam += `?key=${apiKey}`;
    }

    const requestOptions = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: pathParam,
      method: 'POST',
      headers: headers
    };

    const req = https.request(requestOptions, (res) => {
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
              log(`⚠️ API Error (retry ${retries + 1}/${MAX_RETRIES}): ${response.error.message}`, 'yellow');
              setTimeout(() => {
                callGeminiAPI(prompt, { retries: retries + 1, apiKey, accessToken }).then(resolve).catch(reject);
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
            console.error('Unexpected response:', responseData);
            reject(new Error('Unexpected response format or empty candidate'));
          }
        } catch (err) {
          if (retries < MAX_RETRIES) {
            const backoff = Math.pow(2, retries) * 1000;
            setTimeout(() => {
              callGeminiAPI(prompt, { retries: retries + 1, apiKey, accessToken }).then(resolve).catch(reject);
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
          callGeminiAPI(prompt, { retries: retries + 1, apiKey, accessToken }).then(resolve).catch(reject);
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