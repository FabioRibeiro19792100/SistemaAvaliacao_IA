const SPREADSHEET_ID = '12NzUJ2SotZnZnZMu8nymi_RQpxxLN97KW_Op5cnSaFo';
const SHEET_GID = '140100783';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

function json(res, status, body) {
  res.status(status).json(body);
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const text = String(source || '').replace(/^\uFEFF/, '');

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function normalizedHeader(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR');
}

function extractSheetData(csvText) {
  const rows = parseCsv(csvText);
  const headerIndex = rows.findIndex(row => {
    const headers = row.map(normalizedHeader);
    return headers.includes('id') && headers.includes('marca empregadora');
  });
  if (headerIndex < 0) throw new Error('Cabeçalhos ID e Marca Empregadora não foram encontrados.');

  const headers = rows[headerIndex].map(normalizedHeader);
  const idIndex = headers.indexOf('id');
  const scoreIndex = headers.indexOf('marca empregadora');
  const observationIndex = headers.indexOf('observação');
  const scores = [];
  const checkinParticipantIds = [];
  const seenParticipants = new Set();
  const seenScores = new Set();

  for (const row of rows.slice(headerIndex + 1)) {
    const id = String(row[idIndex] || '').trim();
    if (id && !seenParticipants.has(id)) {
      seenParticipants.add(id);
      checkinParticipantIds.push(id);
    }
    const rawScore = String(row[scoreIndex] || '').trim().replace(',', '.');
    const score = Number(rawScore);
    if (!id || !Number.isFinite(score) || score < 1 || score > 4 || seenScores.has(id)) continue;
    seenScores.add(id);
    scores.push({
      id,
      score,
      observation: observationIndex >= 0 ? String(row[observationIndex] || '').trim() : '',
    });
  }
  return { scores, checkinParticipantIds };
}

function extractScores(csvText) {
  return extractSheetData(csvText).scores;
}

module.exports = async function employerBrandScores(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error:'Método não permitido.' });
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(SHEET_CSV_URL, { signal:controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`A planilha respondeu com HTTP ${response.status}.`);
    const { scores, checkinParticipantIds } = extractSheetData(await response.text());
    return json(res, 200, {
      source:'google-sheets',
      spreadsheetId:SPREADSHEET_ID,
      sheetGid:SHEET_GID,
      count:scores.length,
      participantCount:checkinParticipantIds.length,
      checkinParticipantIds,
      scores,
    });
  } catch (error) {
    return json(res, 502, { error:`Não foi possível ler as notas de Marca Empregadora: ${error.message || error}` });
  }
};

module.exports.parseCsv = parseCsv;
module.exports.extractScores = extractScores;
module.exports.extractSheetData = extractSheetData;
