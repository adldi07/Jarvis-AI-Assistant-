const https = require('https');
const { perplexityApiKey, MAX_RETRIES } = require('../config/config');
const { log } = require('../utils/logger');

async function callPerplexityAPI(prompt, retries = 0) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'llama-3-sonar-large-32k-chat', // High-performance model
            messages: [
                {
                    role: 'system',
                    content: 'You are Jarvis, a world-class software engineer. You provide high-quality code and detailed project plans in JSON format when requested.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            top_p: 0.9
        });

        const options = {
            hostname: 'api.perplexity.ai',
            port: 443,
            path: '/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
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
                        throw new Error(response.error.message || 'Perplexity API Error');
                    }

                    const content = response.choices?.[0]?.message?.content;
                    if (content) {
                        resolve(content);
                    } else {
                        reject(new Error('Empty response from Perplexity'));
                    }
                } catch (err) {
                    if (retries < MAX_RETRIES) {
                        const backoff = Math.pow(2, retries) * 1000;
                        log(`⚠️ Perplexity Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                        setTimeout(() => {
                            callPerplexityAPI(prompt, retries + 1).then(resolve).catch(reject);
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
                    callPerplexityAPI(prompt, retries + 1).then(resolve).catch(reject);
                }, backoff);
                return;
            }
            reject(err);
        });

        req.setTimeout(60000); // 60 seconds
        req.write(data);
        req.end();
    });
}

module.exports = {
    callPerplexityAPI
};
