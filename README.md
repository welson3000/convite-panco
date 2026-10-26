# Um convite para a Panco

Livreto digital da Escola Profissionalizante Paulo de Tarso convidando a Panco para ser paraninfa das turmas com conclusão prevista para dezembro de 2026.

- Site estático (`index.html`, `styles.css`, `app.js`, `img/`, `fonts/`), hospedado na Vercel.
- `api/resposta.js`: grava as respostas do formulário no Neon (tabela `respostas`).
- `api/respostas.js`: lista as respostas em `/api/respostas?chave=...`.

## Variáveis de ambiente (Vercel)
- `DATABASE_URL`: string de conexão do Neon (projeto `convite-panco`).
- `ADMIN_KEY`: chave para ver as respostas.
