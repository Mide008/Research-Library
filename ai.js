// ============================================================
// Vercel / Netlify Serverless Function — Claude API Proxy
// Deployment:
//   Vercel  → place this file at /api/ai.js  (auto-detected)
//   Netlify → place this file at /netlify/functions/ai.js
//             and update the fetch URL in script.js to /.netlify/functions/ai
//
// Environment variable to set in your Vercel/Netlify dashboard:
//   ANTHROPIC_API_KEY = sk-ant-...
// ============================================================

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    try {
        const { prompt, maxTokens = 1000 } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt.' });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                error: err.error?.message || `Anthropic API error ${response.status}`
            });
        }

        const data = await response.json();
        const text = (data.content || []).find(c => c.type === 'text')?.text || '';
        return res.status(200).json({ text });

    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
