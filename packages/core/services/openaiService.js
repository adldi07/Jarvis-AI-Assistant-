const https = require('https');
const { openaiApiKey, MAX_RETRIES } = require('../config/config');
const { log } = require('../utils/logger');

async function callOpenAIAPI(prompt, retries = 0) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'gpt-4-turbo',
            max_tokens: 4096,
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
            temperature: 0.7
        });

        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
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
                        throw new Error(response.error.message || 'OpenAI API Error');
                    }

                    const content = response.choices?.[0]?.message?.content;
                    if (content) {
                        resolve(content);
                    } else {
                        reject(new Error('Empty response from OpenAI'));
                    }
                } catch (err) {
                    if (retries < MAX_RETRIES) {
                        const backoff = Math.pow(2, retries) * 1000;
                        log(`⚠️ OpenAI Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                        setTimeout(() => {
                            callOpenAIAPI(prompt, retries + 1).then(resolve).catch(reject);
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
                log(`⚠️ OpenAI Connection Error (retry ${retries + 1}/${MAX_RETRIES}): ${err.message}`, 'yellow');
                setTimeout(() => {
                    callOpenAIAPI(prompt, retries + 1).then(resolve).catch(reject);
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
    callOpenAIAPI
};
