export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const notionKey = process.env.NOTION_TOKEN;
  if (!notionKey) return res.status(500).json({ error: 'NOTION_TOKEN non configurata' });

  const { notionPath, notionMethod = 'GET', notionBody } = req.body;
  if (!notionPath) return res.status(400).json({ error: 'notionPath mancante' });

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
