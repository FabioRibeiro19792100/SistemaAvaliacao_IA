const crypto = require('crypto');

const ENVIRONMENT = process.env.WORKSHOP_ENVIRONMENT || 'producao';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ACTIVITIES = ['checkin', 'fase1', 'fase2'];
const LABELS = {
  checkin: 'Check-in',
  fase1: 'Fase 1 · Concepção',
  fase2: 'Fase 2 · Prototipação',
};

const FORM_DEFINITIONS = {
  checkin: {
    title: 'Check-in',
    intro: 'Responda com calma. Suas respostas serão registradas individualmente.',
    fields: [
      { id:'nome', label:'Nome completo', type:'text', required:true },
      { id:'email', label:'E-mail utilizado na inscrição', type:'email', required:true },
      { id:'q1', label:'1. Conte sobre uma experiência em que você se envolveu de forma intensa para alcançar um objetivo em equipe. O que te motivou a se dedicar além do esperado, como foi sua colaboração com o time e qual foi o principal resultado ou aprendizado?', type:'textarea', required:true, max:750 },
    ],
  },
  fase1: {
    title: 'Fase 1 · Concepção',
    intro: 'Registre a ideia em formato de roteiro, storyboard, slides estáticos ou outra solução capaz de comunicá-la. Não é necessário produzir o teaser nesta etapa.',
    fields: [
      { id:'nome', label:'Nome completo', type:'text', required:true },
      { id:'email', label:'E-mail utilizado na inscrição', type:'email', required:true },
      { id:'q1', label:'1. Título provisório do teaser da Maratona de IA 2027.', type:'text', required:true, max:100 },
      { id:'q3', label:'2. Qual mascote oficial da Maratona de IA deste ano você utilizará?', type:'radio', required:true, options:['Cacatuá roxa','Tartaruga com ventilador nas costas','Ambos os mascotes'] },
      { id:'q2', label:'3. Qual personagem autoral você criou? Descreva características físicas e emocionais, função na narrativa e a sua relação com o(s) mascote(s) escolhido(s).', type:'textarea', required:true, max:750 },
      { id:'q4', label:'4. Descreva a sua ideia de teaser para a Maratona de IA 2027 em um roteiro audiovisual que contenha abertura, mensagem central e chamada.', type:'textarea', required:true, max:750 },
      { id:'q5', label:'5. O que você gostaria que o público levasse do teaser sobre a Maratona de IA 2027?', type:'textarea', required:true, max:750 },
      { id:'q6', label:'6. Como você imagina a estrutura visual do teaser da campanha da Maratona de IA 2027? Descreva três cenas-chave.', type:'textarea', required:true, max:750 },
    ],
  },
  fase2: {
    title: 'Fase 2 · Prototipação',
    intro: 'O protótipo não precisa estar finalizado. Esta etapa avalia criatividade, autoria, escolhas e uso perspicaz dos recursos disponíveis.',
    fields: [
      { id:'nome', label:'Nome completo', type:'text', required:true },
      { id:'email', label:'E-mail utilizado na inscrição', type:'email', required:true },
      { id:'q1', label:'1. O protótipo do seu teaser está em qual dos formatos abaixo?', type:'radio', required:true, options:['Vídeo de até 30 segundos','Sequência de imagens / storyboard','Slide(s) estático(s) acompanhado de explicação por escrito'] },
      { id:'link', label:'Link para o arquivo ou protótipo', type:'url', required:true, help:'Garanta que a banca avaliadora tenha permissão para acessar seu conteúdo.' },
      { id:'q2', label:'2. Quais ferramentas de IA e/ou programas de edição você utilizou para criar o seu teaser?', type:'checkbox', required:true, options:['ChatGPT','Gemini','Claude','Microsoft Copilot','Midjourney','Adobe Firefly','Runway','Google Veo / Flow','Sora','Kling AI','Pika','CapCut','Canva','ElevenLabs','Adobe Premiere Pro','Outra ferramenta'], other:{ option:'Outra ferramenta', field:'q2_other', error:'Informe qual é a outra ferramenta utilizada.' } },
      { id:'q3', label:'3. Conte como você utilizou a(s) ferramenta(s) assinalada(s) na criação do seu protótipo.', type:'textarea', required:true, max:750, help:'Para cada ferramenta, informe acesso gratuito, pago, teste, estudantil ou institucional e sua finalidade.' },
      { id:'q4', label:'4. Como foi a supervisão humana do seu processo de criação com uma ou mais ferramentas de IA?', type:'textarea', required:true, max:750, help:'Descreva prompts, testes, ajustes, intervenções e o papel das ferramentas, sem dados sensíveis.' },
      { id:'q5', label:'5. Quais limitações você encontrou durante a criação do seu protótipo?', type:'checkbox', required:true, options:['Limite de créditos ou tokens','Limitações da versão gratuita','Tempo insuficiente para concluir a proposta','Erros ou inconsistências geradas pela IA','Dificuldade para manter a consistência visual dos personagens','Dificuldade com prompts ou configurações','Problemas técnicos ou de conexão','Não encontrei limitações relevantes','Outro'], other:{ option:'Outro', field:'q5_other', error:'Informe qual foi a outra limitação encontrada.' } },
      { id:'q6', label:'6. Compare seu protótipo com a ideia registrada na atividade anterior. O que você manteve e o que mudou?', type:'textarea', required:true, max:750 },
      { id:'q7', label:'7. Como você trabalhou com os assets do ou dos mascotes oficiais utilizados?', type:'textarea', required:true, max:750 },
      { id:'q8', label:'8. Quais seriam os próximos passos para transformar seu protótipo no teaser oficial da Maratona de IA 2027?', type:'textarea', required:true, max:750 },
    ],
  },
};

function json(res, status, body) { res.status(status).json(body); }
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function queryValue(value) { return encodeURIComponent(String(value || '')); }
function isTestParticipant(value) { return String(value?.inscricao_id_externo || '').toUpperCase().startsWith('TESTE-'); }
function sign(payload) { return crypto.createHmac('sha256', process.env.WORKSHOP_SESSION_SECRET || '').update(payload).digest('base64url'); }
function createToken(participantId, activity) { const payload = Buffer.from(JSON.stringify({ p:participantId, f:activity, e:Date.now() + 1000 * 60 * 60 * 8 })).toString('base64url'); return `${payload}.${sign(payload)}`; }
function createAdminToken() { const payload = Buffer.from(JSON.stringify({ a:1, e:Date.now() + 1000 * 60 * 60 * 8 })).toString('base64url'); return `${payload}.${sign(payload)}`; }
function readToken(value) { try { const [payload, signature] = String(value || '').split('.'); if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(signature))) return null; const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return data?.p && data.e > Date.now() ? data : null; } catch { return null; } }
function readAdminToken(value) { try { const [payload, signature] = String(value || '').split('.'); if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(signature))) return null; const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return data?.a === 1 && data.e > Date.now() ? data : null; } catch { return null; } }
function serviceHeaders() {
  const headers = { apikey:SUPABASE_SERVER_KEY, 'Content-Type':'application/json' };
  if (SUPABASE_SERVER_KEY && !SUPABASE_SERVER_KEY.startsWith('sb_secret_')) headers.Authorization = `Bearer ${SUPABASE_SERVER_KEY}`;
  return headers;
}
async function db(path, options = {}) { const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:{ ...serviceHeaders(), ...(options.headers || {}) } }); const text = await response.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; } if (!response.ok) throw new Error(data?.message || data?.hint || 'Falha na base do workshop.'); return data; }
function hasServerConfig() { return !!(SUPABASE_URL && SUPABASE_SERVER_KEY && process.env.WORKSHOP_SESSION_SECRET); }
function participantView(p, config, answers) { return { participant:{ name:p.nome, email:p.email || '' }, activity:config?.atividade_ativa || 'fechada', activityLabel:LABELS[config?.atividade_ativa] || '', completed:(answers || []).map(a => a.atividade), form:FORM_DEFINITIONS[config?.atividade_ativa] || null }; }
function workshopEvaluationView(participant, rows) {
  const byActivity = new Map((rows || []).map(row => [row.atividade, row]));
  return {
    participant:{ name:participant.nome, email:participant.email || '', externalId:participant.inscricao_id_externo },
    responses:ACTIVITIES.map(activity => {
      const row = byActivity.get(activity);
      const form = FORM_DEFINITIONS[activity];
      return {
        activity,
        label:LABELS[activity] || activity,
        submitted:!!row,
        submittedAt:row?.enviado_at || null,
        fields:(form?.fields || [])
          .filter(field => !['nome','email'].includes(field.id))
          .map(field => ({
            id:field.id,
            label:field.label,
            type:field.type,
            help:field.help || '',
            options:field.options || [],
            value:row?.respostas?.[field.id] ?? '',
            otherValue:field.other ? (row?.respostas?.[field.other.field] || '') : '',
          })),
      };
    }),
  };
}
function validateAnswers(activity, answers) {
  const form = FORM_DEFINITIONS[activity];
  if (!form || !answers || typeof answers !== 'object') throw new Error('Atividade inválida.');
  const normalized = {};
  for (const field of form.fields) {
    const raw = answers[field.id];
    const value = Array.isArray(raw) ? raw.map(item => String(item).trim()).filter(Boolean) : String(raw || '').trim();
    const present = Array.isArray(value) ? value.length > 0 : value.length > 0;
    if (field.required && !present) throw new Error(`Preencha: ${field.label}`);
    if (field.max && String(value || '').length > field.max) throw new Error(`O campo “${field.label}” aceita até ${field.max} caracteres.`);
    if (field.options && present) {
      const selected = Array.isArray(value) ? value : [value];
      if (selected.some(item => !field.options.includes(item))) throw new Error(`Confira a resposta de “${field.label}”.`);
    }
    if (field.type === 'email' && present && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) throw new Error('Informe um e-mail válido.');
    if (field.type === 'url' && present) { try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) throw 0; } catch { throw new Error('Informe um link válido, começando com http:// ou https://.'); } }
    normalized[field.id] = value;
    if (field.other && Array.isArray(value) && value.includes(field.other.option)) {
      const otherValue = String(answers[field.other.field] || '').trim();
      if (!otherValue) throw new Error(field.other.error);
      normalized[field.other.field] = otherValue;
    }
  }
  return normalized;
}

module.exports = async function workshop(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return json(res, 405, { error:'Método não permitido.' });
  if (!hasServerConfig()) return json(res, 503, { error:'Workshop ainda não foi configurado no servidor.' });
  const { action, email, birthYear, token, answers, activity, durationSeconds, adminKey, adminToken, participants, reviewerId, participantExternalId } = req.body || {};
  try {
    if (action === 'birth-options') {
      const normalizedEmail = normalizeEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) return json(res, 400, { error:'Informe o e-mail usado na inscrição.' });
      const participant = (await db(`workshop_participantes?environment=eq.${ENVIRONMENT}&email=eq.${queryValue(normalizedEmail)}&ativo=eq.true&select=ano_nascimento`))?.[0];
      if (!participant) return json(res, 401, { error:'Não encontramos uma inscrição ativa com esses dados.' });
      const correct = Number(participant.ano_nascimento);
      const years = new Set([correct]);
      [2, -3, 5, -6, 8, -9].forEach(offset => { if (years.size < 5 && correct + offset >= 1900 && correct + offset <= 2100) years.add(correct + offset); });
      return json(res, 200, { years:[...years].sort(() => Math.random() - .5) });
    }
    if (action === 'login') {
      const normalizedEmail = normalizeEmail(email); const year = Number(birthYear);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail) || !Number.isInteger(year)) return json(res, 400, { error:'Confira o e-mail e o ano de nascimento.' });
      const rows = await db(`workshop_participantes?environment=eq.${ENVIRONMENT}&email=eq.${queryValue(normalizedEmail)}&ativo=eq.true&select=*`);
      const participant = rows?.[0];
      if (!participant || participant.ano_nascimento !== year) return json(res, 401, { error:'Não encontramos uma inscrição ativa com esses dados.' });
      const cfg = (await db(`workshop_configuracoes?environment=eq.${ENVIRONMENT}&select=*`))?.[0];
      if (!cfg || cfg.atividade_ativa === 'fechada' || (activity && activity !== cfg.atividade_ativa)) return json(res, 409, { error:'Esta atividade não está disponível neste momento.' });
      const submitted = await db(`workshop_respostas?participant_id=eq.${participant.id}&select=atividade`);
      return json(res, 200, { token:createToken(participant.id, cfg.atividade_ativa), ...participantView(participant, cfg, submitted) });
    }
    if (action === 'banca-participant') {
      const externalId = String(participantExternalId || '').trim().split('-').pop();
      const adminAuthenticated = !!readAdminToken(adminToken) || (!!process.env.WORKSHOP_ADMIN_KEY && adminKey === process.env.WORKSHOP_ADMIN_KEY);
      let reviewerAuthenticated = false;
      if (reviewerId) {
        const reviewers = await db(`banca_pareceristas?id_externo=eq.${queryValue(reviewerId)}&ativo=eq.true&select=id`);
        reviewerAuthenticated = !!reviewers?.length;
      }
      if (!adminAuthenticated && !reviewerAuthenticated) return json(res, 401, { error:'Acesso à banca inválido.' });
      if (!externalId) return json(res, 400, { error:'Participante inválido.' });
      const participant = (await db(`workshop_participantes?environment=eq.${ENVIRONMENT}&inscricao_id_externo=eq.${queryValue(externalId)}&ativo=eq.true&select=*`))?.[0];
      if (!participant) return json(res, 404, { error:'Participante não encontrado na base do workshop.' });
      const rows = await db(`workshop_respostas?participant_id=eq.${participant.id}&select=atividade,enviado_at,respostas&order=enviado_at.asc`);
      return json(res, 200, workshopEvaluationView(participant, rows));
    }
    if (action === 'admin-login') {
      if (!process.env.WORKSHOP_ADMIN_KEY || adminKey !== process.env.WORKSHOP_ADMIN_KEY) return json(res, 401, { error:'Senha administrativa inválida.' });
      return json(res, 200, { adminToken:createAdminToken() });
    }
    if (['admin-status', 'set-activity', 'provision'].includes(action)) {
      const authenticated = !!readAdminToken(adminToken) || (!!process.env.WORKSHOP_ADMIN_KEY && adminKey === process.env.WORKSHOP_ADMIN_KEY);
      if (!authenticated) return json(res, 401, { error:'Acesso administrativo inválido.' });
      if (action === 'admin-status') {
        const [cfg, people, answersRows] = await Promise.all([db(`workshop_configuracoes?environment=eq.${ENVIRONMENT}&select=*`), db(`workshop_participantes?environment=eq.${ENVIRONMENT}&ativo=eq.true&select=id,nome,email,inscricao_id_externo&order=nome.asc`), db(`workshop_respostas?environment=eq.${ENVIRONMENT}&select=atividade,enviado_at,respostas,workshop_participantes(id,nome,email,inscricao_id_externo)&order=enviado_at.desc`)]);
        const officialPeople = (people || []).filter(person => !isTestParticipant(person));
        const testPeople = (people || []).filter(isTestParticipant);
        const officialAnswers = (answersRows || []).filter(row => !isTestParticipant(row.workshop_participantes));
        const testAnswers = (answersRows || []).filter(row => isTestParticipant(row.workshop_participantes));
        const counts = Object.fromEntries(ACTIVITIES.map(key => [key, officialAnswers.filter(row => row.atividade === key).length]));
        return json(res, 200, { activity:cfg?.[0]?.atividade_ativa || 'fechada', participants:officialPeople.length, participantsList:officialPeople, counts, responses:officialAnswers, testParticipants:testPeople.length, testParticipantsList:testPeople, testResponses:testAnswers });
      }
      if (action === 'set-activity') {
        const next = ['fechada', ...ACTIVITIES].includes(activity) ? activity : null; if (!next) return json(res, 400, { error:'Atividade inválida.' });
        await db('workshop_configuracoes?on_conflict=environment', { method:'POST', headers:{ Prefer:'resolution=merge-duplicates,return=minimal' }, body:JSON.stringify({ environment:ENVIRONMENT, atividade_ativa:next, updated_at:new Date().toISOString() }) });
        return json(res, 200, { ok:true, activity:next });
      }
      if (action === 'provision') {
        if (!Array.isArray(participants) || !participants.length) return json(res, 400, { error:'Nenhum participante para preparar.' });
        const rows = participants.map(item => {
          const participantEmail = normalizeEmail(item.email);
          return { environment:ENVIRONMENT, inscricao_id_externo:String(item.inscricaoId || ''), nome:String(item.nome || '').trim(), email:participantEmail, ano_nascimento:Number(item.birthYear), ativo:true, valid:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(participantEmail) };
        }).filter(row => row.inscricao_id_externo && row.nome && row.valid && Number.isInteger(row.ano_nascimento)).map(({ valid, ...row }) => row);
        if (!rows.length) return json(res, 400, { error:'Os dados enviados não contêm e-mail e ano de nascimento válidos.' });
        await db('workshop_participantes?on_conflict=environment,inscricao_id_externo', { method:'POST', headers:{ Prefer:'resolution=merge-duplicates,return=minimal' }, body:JSON.stringify(rows) });
        return json(res, 200, { ok:true, prepared:rows.length });
      }
    }
    const session = readToken(token); if (!session) return json(res, 401, { error:'Sua sessão expirou. Entre novamente.' });
    if (action === 'session' || action === 'submit') {
      const participant = (await db(`workshop_participantes?id=eq.${session.p}&environment=eq.${ENVIRONMENT}&ativo=eq.true&select=*`))?.[0];
      if (!participant) return json(res, 401, { error:'Participante não encontrado.' });
      const cfg = (await db(`workshop_configuracoes?environment=eq.${ENVIRONMENT}&select=*`))?.[0];
      if (!cfg || session.f !== cfg.atividade_ativa) return json(res, 401, { error:'Uma nova atividade foi liberada. Entre novamente para continuar.' });
      const submitted = await db(`workshop_respostas?participant_id=eq.${participant.id}&select=atividade`);
      if (action === 'session') return json(res, 200, participantView(participant, cfg, submitted));
      if (cfg?.atividade_ativa !== activity || !ACTIVITIES.includes(activity)) return json(res, 409, { error:'Esta atividade não está disponível neste momento.' });
      if ((submitted || []).some(r => r.atividade === activity)) return json(res, 409, { error:'Esta atividade já foi enviada.' });
      const normalizedAnswers = validateAnswers(activity, answers);
      normalizedAnswers.nome = participant.nome;
      normalizedAnswers.email = participant.email || normalizedAnswers.email;
      const elapsed = Number(durationSeconds);
      if (Number.isFinite(elapsed) && elapsed >= 1 && elapsed <= 86400) normalizedAnswers._meta = { duration_seconds:Math.round(elapsed) };
      await db('workshop_respostas', { method:'POST', headers:{ Prefer:'return=minimal' }, body:JSON.stringify({ participant_id:participant.id, environment:ENVIRONMENT, atividade:activity, respostas:normalizedAnswers }) });
      return json(res, 200, { ok:true, message:'Resposta registrada. Aguarde as próximas orientações em sala.' });
    }
    return json(res, 400, { error:'Ação inválida.' });
  } catch (error) { return json(res, 500, { error:error.message || 'Não foi possível concluir a operação.' }); }
};
