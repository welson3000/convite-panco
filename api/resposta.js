import { neon } from '@neondatabase/serverless';

const clip = (v, n) => String(v ?? '').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Use POST.' });
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.site) return res.status(200).json({ ok: true }); // honeypot

  const nome = clip(b.nome, 120);
  const contato = clip(b.contato, 160);
  const intencao = b.intencao === 'conversar' ? 'conversar' : 'aceita';
  if (!nome || !contato) return res.status(400).json({ erro: 'Nome e contato são obrigatórios.' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO respostas (nome, cargo, contato, intencao, datas, mensagem, user_agent)
      VALUES (${nome}, ${clip(b.cargo, 120)}, ${contato}, ${intencao}, ${clip(b.datas, 300)}, ${clip(b.mensagem, 2000)}, ${clip(req.headers['user-agent'], 300)})`;
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao salvar a resposta.' });
  }
}
