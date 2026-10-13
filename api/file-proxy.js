const ALLOWED_HOST = 'inscricoes.led.globo';
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function isAllowedUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname === ALLOWED_HOST;
  } catch {
    return false;
  }
}

async function fetchAllowedFile(url) {
  let currentUrl = url;
  for (let redirects = 0; redirects < 4; redirects += 1) {
    if (!isAllowedUrl(currentUrl)) throw new Error('URL não permitida.');
    const response = await fetch(currentUrl, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirecionamento inválido.');
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return response;
  }
  throw new Error('Muitos redirecionamentos.');
}

module.exports = async function fileProxy(req, res) {
  const sourceUrl = typeof req.query.url === 'string' ? req.query.url : '';
  if (!isAllowedUrl(sourceUrl)) {
    return res.status(400).json({ error: 'Arquivo não permitido.' });
  }

  try {
    const upstream = await fetchAllowedFile(sourceUrl);
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Não foi possível buscar o arquivo.' });

    const declaredSize = Number(upstream.headers.get('content-length') || 0);
    if (declaredSize > MAX_FILE_BYTES) return res.status(413).json({ error: 'Arquivo maior que o limite de visualização.' });

    const body = Buffer.from(await upstream.arrayBuffer());
    if (body.byteLength > MAX_FILE_BYTES) return res.status(413).json({ error: 'Arquivo maior que o limite de visualização.' });

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Length', String(body.byteLength));
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(body);
  } catch (error) {
    return res.status(502).json({ error: 'Falha ao carregar o comprovante.' });
  }
};
