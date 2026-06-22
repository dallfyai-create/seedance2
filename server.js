// Seedance Studio — backend proxy
// Keeps your Anthropic API key on the server. The frontend never sees it.
//
// Setup:
//   1. npm install
//   2. copy .env.example to .env and paste your real key in
//   3. npm start
//   4. open http://localhost:3000

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.warn(
    '\n⚠  ANTHROPIC_API_KEY is not set.\n' +
    '   Create a .env file (see .env.example) with your real key before using the Image Analyzer tab.\n'
  );
}

// Accept larger JSON bodies — base64 images (especially two, for transformation mode) are sizeable
app.use(express.json({ limit: '25mb' }));

// Serve the artifact itself (index.html and any other static files in this folder)
app.use(express.static(path.join(__dirname)));

// ---- Proxy endpoint used by the Image Analyzer tab ----
app.post('/api/analyze-image', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in your .env file and restart the server.' });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Request body is missing "messages".' });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1500,
        system,
        messages,
      }),
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      // Forward Anthropic's own error message so it's visible in the browser instead of a blank failure
      const message = (data && data.error && data.error.message) || `Anthropic API returned status ${anthropicResponse.status}`;
      return res.status(anthropicResponse.status).json({ error: message });
    }

    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message || 'Unexpected server error while contacting Anthropic.' });
  }
});

// Health check — useful for confirming the server is actually running on your host
app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasApiKey: !!ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`\nSeedance Studio server running at http://localhost:${PORT}\n`);
});
