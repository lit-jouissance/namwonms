// api/chat.js  (Vercel Serverless Function)
// "개념 도우미 톡" 서버 프록시 — API 키는 서버(환경변수)에만 두고, 브라우저엔 노출하지 않아요.
// Vercel 프로젝트 설정 > Settings > Environment Variables 에 ANTHROPIC_API_KEY 를 넣어주세요.

export default async function handler(req, res) {
  // CORS (같은 도메인이면 없어도 되지만, 안전하게 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 허용돼요.' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았어요.' });

  try {
    // Vercel은 보통 req.body를 자동 파싱해요. 혹시 문자열로 오면 대비.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { system, messages, max_tokens, model } = body;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 1024,
        system: system || '',
        messages: Array.isArray(messages) ? messages : [],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = (data && data.error && data.error.message) || ('API 오류 ' + resp.status);
      return res.status(resp.status).json({ error: msg });
    }

    const text = (data.content || []).map((b) => b.text || '').join('\n').trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
