const https = require('https');
const { openRouterApiKey, MAX_RETRIES } = require('../config/config');
const { log } = require('../utils/logger');

async function callOpenRouterAPI(prompt, retries = 0) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'meta-llama/llama-3.1-70b-instruct', // High-quality open-source model
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
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 4096
        });

        const options = {
            hostname: 'openrouter.ai',
            port: 443,
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'HTTP-Refactor': 'http://localhost:3000'
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
                        throw new Error(response.error.message || 'Open Router API Error');
                    }

                    const content = response.choices?.[0]?.message?.content;
                    if (content) {
                        resolve(content);
                    } else {
                        reject(new Error('Empty response from Open Router'));
                    }
                } catch (err) {
                    if (retries < MAX_RETRIES) {
                        const backoff = Math.pow(2, retries) * 1000;
                        log(`⚠️ Open Router Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                        setTimeout(() => {
                            callOpenRouterAPI(prompt, retries + 1).then(resolve).catch(reject);
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
                log(`⚠️ Open Router Connection Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                setTimeout(() => {
                    callOpenRouterAPI(prompt, retries + 1).then(resolve).catch(reject);
                }, backoff);
                return;
            }
            reject(err);
        });

        req.setTimeout(90000); // 90 seconds timeout
        req.write(data);
        req.end();
    });
}

module.exports = {
    callOpenRouterAPI
};
