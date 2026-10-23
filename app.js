(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* confetti on the invitation page, in the colours of the bread bag */
  const confetti = $('.confetti');
  if (confetti) {
    const colours = ['#d6403a', '#2f6db5', '#f2c230', '#ffffff', '#d9b36a'];
    let seed = 11;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 34; i++) {
      const d = document.createElement('i');
      const size = 1 + rnd() * 3.6;           // in cqw
      const edge = rnd() < .5;
      const x = edge ? rnd() * 100 : (rnd() < .5 ? rnd() * 8 : 92 + rnd() * 8);
      const y = edge ? (rnd() < .5 ? rnd() * 12 : 88 + rnd() * 12) : rnd() * 100;
      d.style.cssText = `left:${x}%;top:${y}%;width:${size}cqw;height:${size}cqw;background:${colours[i % colours.length]};opacity:${(.4 + rnd() * .5).toFixed(2)}`;
      confetti.appendChild(d);
    }
  }

  /* reply dialog (works in every mode) */
  const dialog = $('#reply-dialog');
  const openReply = () => { dialog.showModal(); setTimeout(() => $('#f-nome').focus(), 50); };
  $$('[data-open-reply]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openReply(); }));
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  const form = $('#reply');
  const status = $('.reply__status');
  const thanks = $('.thanks');
  const submit = form.querySelector('button[type=submit]');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = ''; status.classList.remove('is-error');
    const data = Object.fromEntries(new FormData(form));
    const missing = ['nome', 'contato'].filter(k => {
      const bad = !String(data[k] || '').trim();
      form.elements[k].closest('.field').classList.toggle('is-invalid', bad);
      return bad;
    });
    if (missing.length) {
      status.classList.add('is-error');
      status.textContent = missing.length === 2 ? 'Preencha seu nome e um e-mail ou telefone para contato.'
        : missing[0] === 'nome' ? 'Preencha seu nome.' : 'Informe um e-mail ou telefone para contato.';
      form.elements[missing[0]].focus();
      return;
    }
    submit.disabled = true; submit.textContent = 'Enviando…';
    try {
      const r = await fetch('/api/resposta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error('falha');
      $('[data-nome]', thanks).textContent = data.nome.trim().split(/\s+/)[0];
      form.hidden = true; thanks.hidden = false; thanks.focus();
    } catch {
      status.classList.add('is-error');
      status.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente de novo.';
    } finally {
      submit.disabled = false; submit.textContent = 'Enviar resposta';
    }
  });

  /* static review mode: ?grade shows every page side by side */
  if (/grade/.test(location.search)) {
    document.documentElement.classList.add('grade');
    $$('.pg--invite').forEach(p => p.classList.add('is-open'));
    return;
  }

  /* ---------- the magazine ---------- */
  const book = $('#book');
  const pages = $$('.page', book);
  const total = pages.length;
  const shelf = $('.shelf');
  // Size the block to the page exactly, so the book always starts at its top edge.
  const fitBook = () => {
    const W = shelf.clientWidth, H = shelf.clientHeight;
    const pw = W < 520 ? W : W / 2;
    book.style.height = `${Math.floor(Math.min(H, pw * 1.375))}px`;
  };
  fitBook();
  addEventListener('resize', fitBook);
  const pf = new St.PageFlip(book, {
    width: 480, height: 660, size: 'stretch',
    minWidth: 260, maxWidth: 1000, minHeight: 357, maxHeight: 1400,
    showCover: true, usePortrait: true, drawShadow: true, maxShadowOpacity: .45,
    flippingTime: reduced ? 350 : 950, mobileScrollSupport: false,
    disableFlipByClick: true, showPageCorners: true, swipeDistance: 25
  });
  pf.loadFromHTML(pages);
  window.__pf = pf;

  const cur = $('[data-cur]');
  const of = $('.count .of');
  const prev = $('[data-prev]');
  const next = $('[data-next]');
  const hint = $('.hint');
  let touched = false, peeking = false;

  const label = () => {
    const i = pf.getCurrentPageIndex();
    const land = pf.getOrientation() === 'landscape';
    prev.disabled = i === 0;
    next.disabled = i >= total - 1;
    if (i === 0) { cur.textContent = 'Capa'; of.textContent = ''; return; }
    if (i === total - 1) { cur.textContent = 'Contracapa'; of.textContent = ''; return; }
    if (land && i + 1 < total - 1) cur.textContent = `Páginas ${i + 1} e ${i + 2}`;
    else cur.textContent = `Página ${i + 1}`;
    of.textContent = `de ${total}`;
    $$('.pg--invite').forEach(p => p.classList.toggle('is-open', Math.abs(i - 15) <= 1));
  };

  pf.on('flip', () => { label(); dismissHint(); });
  pf.on('changeOrientation', label);
  pf.on('changeState', e => { if (!peeking && (e.data === 'user_fold' || e.data === 'flipping')) dismissHint(); });
  label();

  // Programmatic turns: lift the 'corners only' guard for the duration of the call.
  const guarded = fn => { const st = pf.getSettings(); st.disableFlipByClick = false; try { fn(); } finally { st.disableFlipByClick = true; } };
  const goPrev = () => guarded(() => pf.flipPrev('top'));
  const goNext = () => guarded(() => pf.flipNext('top'));
  prev.addEventListener('click', goPrev);
  next.addEventListener('click', goNext);
  $$('[data-goto]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const target = Number(b.dataset.goto) - 1;
    if (target === pf.getCurrentPageIndex()) return;
    guarded(() => pf.flip(target, 'top'));
  }));
  addEventListener('keydown', e => {
    if (dialog.open) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
    if (e.key === 'Home') pf.turnToPage(0);
  });

  /* corner hint + a gentle peek of the top-right corner, as if someone lifted it */
  function placeHint() {
    const r = pf.getBoundsRect();
    const b = book.getBoundingClientRect();
    const s = book.parentElement.getBoundingClientRect();
    hint.style.setProperty('--hint-x', `${b.left - s.left + r.left + r.width - r.pageWidth * .06}px`);
    hint.style.setProperty('--hint-y', `${b.top - s.top + r.top + r.height * .19}px`);
  }
  function dismissHint() {
    if (touched) return;
    touched = true; hint.classList.remove('is-on');
  }
  function peek() {
    if (touched || reduced || pf.getState() !== 'read') return;
    const r = pf.getBoundsRect();
    const start = { x: r.left + r.width - 2, y: r.top + 2 };
    const dx = r.pageWidth * .38, dy = r.height * .13;
    const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    peeking = true;
    pf.startUserTouch(start);
    const t0 = performance.now(), dur = 1000;
    let last = start;
    const step = now => {
      if (touched) { pf.userStop(last); peeking = false; return; }
      const t = Math.min(1, (now - t0) / dur);
      last = { x: start.x - dx * ease(t), y: start.y + dy * ease(t) };
      pf.userMove(last, true);
      if (t < 1) requestAnimationFrame(step);
      else setTimeout(() => { pf.userStop(last); setTimeout(() => { peeking = false; }, 900); }, 380);
    };
    requestAnimationFrame(step);
  }
  addEventListener('resize', () => requestAnimationFrame(placeHint));
  setTimeout(() => {
    placeHint();
    hint.classList.add('is-on');
    peek();
    setTimeout(() => { if (!touched && pf.getCurrentPageIndex() === 0) peek(); }, 5200);
  }, 900);

  // real user input dismisses the hint
  ['mousedown', 'touchstart'].forEach(t => book.addEventListener(t, e => { if (e.isTrusted) dismissHint(); }, { passive: true }));
})();
