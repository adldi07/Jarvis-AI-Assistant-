const https = require('https');
const { claudeApiKey, MAX_RETRIES } = require('../config/config');
const { log } = require('../utils/logger');

async function callClaudeAPI(prompt, retries = 0) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            system: 'You are Jarvis, a world-class software engineer. You provide high-quality code and detailed project plans in JSON format when requested.'
        });

        const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01',
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
                        throw new Error(response.error.message || 'Claude API Error');
                    }

                    const content = response.content?.[0]?.text;
                    if (content) {
                        resolve(content);
                    } else {
                        reject(new Error('Empty response from Claude'));
                    }
                } catch (err) {
                    if (retries < MAX_RETRIES) {
                        const backoff = Math.pow(2, retries) * 1000;
                        log(`⚠️ Claude Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                        setTimeout(() => {
                            callClaudeAPI(prompt, retries + 1).then(resolve).catch(reject);
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
                log(`⚠️ Claude Connection Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                setTimeout(() => {
                    callClaudeAPI(prompt, retries + 1).then(resolve).catch(reject);
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
    callClaudeAPI
};
