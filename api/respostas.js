import { neon } from '@neondatabase/serverless';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Lista as respostas recebidas. Acesso: /api/respostas?chave=SUA_CHAVE (variável ADMIN_KEY na Vercel)
export default async function handler(req, res) {
  if (!process.env.ADMIN_KEY || req.query.chave !== process.env.ADMIN_KEY) {
    return res.status(401).send('Acesso restrito.');
  }
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT * FROM respostas ORDER BY criado_em DESC`;
  const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Respostas ao convite</title>
<style>body{font:16px/1.5 Georgia,serif;margin:2rem;color:#18233a;background:#fbfbf9}h1{font-weight:400}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.6rem;border-bottom:1px solid #ddd;vertical-align:top}th{font-weight:600}.vazio{font-style:italic}</style>
<h1>Respostas ao convite (${rows.length})</h1>
${rows.length ? `<table><tr><th>Quando</th><th>Resposta</th><th>Nome</th><th>Cargo</th><th>Contato</th><th>Datas</th><th>Mensagem</th></tr>
${rows.map(r => `<tr><td>${fmt(r.criado_em)}</td><td>${r.intencao === 'aceita' ? 'Aceita, quer marcar reunião' : 'Quer conversar antes'}</td><td>${esc(r.nome)}</td><td>${esc(r.cargo)}</td><td>${esc(r.contato)}</td><td>${esc(r.datas)}</td><td>${esc(r.mensagem)}</td></tr>`).join('')}</table>` : '<p class="vazio">Nenhuma resposta ainda.</p>'}
</html>`);
}
