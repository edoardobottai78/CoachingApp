// api/proxy.js — Vercel Serverless Function
// Gestisce due endpoint:
//   POST /api/proxy?target=ai     → chiama Anthropic API
//   POST /api/proxy?target=notion → chiama Notion API direttamente
// Le chiavi restano sul server, mai esposte al browser.

export default async function handler(req, res) {

  // ── CORS (necessario per PWA standalone) ──────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const target = req.query.target;

  // ── TARGET: AI (Anthropic) ────────────────────────────────
  if (target === 'ai') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurata' });
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      return res.status(response.ok ? 200 : response.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Errore AI: ' + err.message });
    }
  }

  // ── TARGET: NOTION ────────────────────────────────────────
  if (target === 'notion') {
    const notionKey = process.env.NOTION_TOKEN;
    if (!notionKey) {
      return res.status(500).json({ error: 'NOTION_TOKEN non configurata' });
    }
    // Il frontend passa { notionPath, notionMethod, notionBody }
    const { notionPath, notionMethod = 'GET', notionBody } = req.body;
    if (!notionPath) {
      return res.status(400).json({ error: 'notionPath mancante' });
    }
    try {
      const fetchOpts = {
        method: notionMethod,
        headers: {
          'Authorization': 'Bearer ' + notionKey,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
      };
      if (notionBody) fetchOpts.body = JSON.stringify(notionBody);

      const response = await fetch('https://api.notion.com/v1' + notionPath, fetchOpts);
      const data = await response.json();
      return res.status(response.ok ? 200 : response.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Errore Notion: ' + err.message });
    }
  }

  return res.status(400).json({ error: 'target non valido. Usa ?target=ai oppure ?target=notion' });
}
