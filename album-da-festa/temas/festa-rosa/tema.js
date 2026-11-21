/* Tema personalizado "Festa Rosa": rosa, verde-menta e amarelo, com corações e confete.
   Mesma estrutura do tema Balões, com paleta própria. Só carrega quando o festa.json tem "tema": "festa-rosa". */
(function () {
  const PAL_ROSA = {
    nome: 'Festa Rosa', c: ['#F48FB8', '#7BC8A4', '#F4C542', '#FBC6DA', '#E8508A'], chao: '#FFF4F8', painel: '#FFFFFF',
    textoPainel: '#D63F7A', textoPainelSuave: '#B07090', brilho: false, numero: '#F48FB8', botao: '#D63F7A', estrela: '#F4C542', lua: false,
    nuvem: '#FBD3E3', linha: '#E8508A', texto: '#5A2A40', marinho: '#7A1F4B', suave: '#8A5A70',
    agua1: '#FDEAF2', agua2: '#FAD3E3', agua3: '#F4A9C8', borda: '#F6D9E5', sombra: '150,40,90'
  };
  const coracao = (cor, w) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.8 12 21 12 21z" fill="${cor}"/></svg>`;
  // corações subindo no telão e no toque
  function coracoes(x, y, n) {
    if (Fx.calmo) return;
    const fx = Fx.camada();
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'), w = 14 + Math.random() * 18;
      el.innerHTML = coracao(PAL_ROSA.c[i % PAL_ROSA.c.length], w);
      el.style.cssText = `position:fixed;left:${x - w / 2}px;top:${y - w / 2}px;pointer-events:none;z-index:60;transition:transform 1.6s cubic-bezier(.2,.7,.3,1),opacity 1.6s`;
      fx.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = `translate(${(Math.random() - .5) * 160}px,${-90 - Math.random() * 160}px) rotate(${(Math.random() - .5) * 60}deg)`; el.style.opacity = '0'; });
      setTimeout(() => el.remove(), 1700);
    }
  }
  const estilo = document.createElement('style');
  estilo.textContent = `[data-tema=festa-rosa] .acao::before { display:none; }
    [data-tema=festa-rosa] .acao { background:rgba(255,255,255,.92); border-top:2px solid var(--borda); }
    [data-tema=festa-rosa] .nuvemB { opacity:.75; }`;
  document.head.appendChild(estilo);

  TEMAS['festa-rosa'] = Object.assign({}, TEMAS.baloes, {
    paleta: PAL_ROSA,
    aplicar() { aplicarVars(PAL_ROSA); },
    vazioIcone() { return `<span class="bicho" style="position:relative;display:block;margin:0 auto 8px;width:40px" aria-hidden="true">${coracao(PAL_ROSA.c[0], 40)}</span>`; },
    toque(x, y, n) { Fx.confete(x, y, 8); if (n % 3 === 0) coracoes(x, y, 4); },
    festa() { TEMAS.baloes.festa(); const b = $('.acao .btn'); if (b) { const r = b.getBoundingClientRect(); coracoes(r.left + r.width / 2, r.top, 10); } },
    novaFoto() { TEMAS.baloes.novaFoto(); coracoes(innerWidth / 2, innerHeight * .75, 12); },
    falas: ['Oi! Tira uma foto da festa pra mim?', 'Que bom que você veio!', 'Tira uma foto com o bolo!', 'Faz pose e tira foto!', 'Obrigada por vir na minha festa!']
  });
})();
