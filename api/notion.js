export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const notionPath = req.query.path;
  if (!notionPath) return res.status(400).json({ error: 'Missing path' });
  const body = req.method !== 'GET' ? JSON.stringify(req.body) : undefined;
  const notionRes = await fetch(`https://api.notion.com${notionPath}`, {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body,
  });
  const data = await notionRes.json();
  return res.status(notionRes.status).json(data);
}
