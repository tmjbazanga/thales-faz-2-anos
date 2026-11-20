/* Tema personalizado "Fundo do Mar" (o primeiro, nascido na festa do Thales).
   Só carrega quando o festa.json tem "tema": "fundo-do-mar". Usa as imagens desta pasta e as do mar da pescaria. */
(function () {
  const PAL_MAR = {
    nome: 'Fundo do Mar', c: ['#6fb3dc', '#f6c443', '#1f8fa3', '#bfdff0', '#f07a4a'], chao: '#fbf8f1', painel: '#ffffff',
    textoPainel: '#133f6b', textoPainelSuave: '#587895', brilho: false, numero: '#8ec6e4', botao: '#133f6b', estrela: '#f6c443', lua: false,
    nuvem: '#bfdff0', linha: '#1f8fa3', texto: '#1b4470', marinho: '#133f6b', suave: '#587895', agua1: '#dcedf6', agua2: '#bfdff0', agua3: '#8ec6e4', borda: '#d7e7f0', sombra: '19,63,107'
  };
  const titulo = (cls = 'topo') => `
    <div class="ola">Bem-vindo ao álbum ${/a$/i.test(N()) ? 'da' : 'do'}</div>
    <h1>${esc(N())}<button class="bicho estrela" data-bicho="estrela" aria-label="Estrela-do-mar"><span style="display:block"><img src="${IMG.estrela}" alt=""></span></button></h1>
    ${ONDINHA}
    ${FESTA.idade ? `<div class="pincel">${esc(plural(+FESTA.idade, 'ano', 'anos'))}</div>` : ''}`;

  TEMAS['fundo-do-mar'] = {
    classeTelao: '',
    paleta: PAL_MAR,
    aplicar() { aplicarVars(PAL_MAR); },
    fundo(grande = false) { return fundoOceano(grande); },
    cabecalho() {
      return `<header class="topo">
        <button class="bicho peixeA" data-bicho="peixe" aria-label="Peixinho"><span class="nada" style="display:block"><img src="${IMG.peixes[0]}" alt=""></span></button>
        ${baleiaBotao('baleia')}
        <button class="bicho peixeB" data-bicho="peixe" aria-label="Peixinho"><span class="nada" style="display:block;animation-delay:-1s"><img src="${IMG.peixes[1]}" alt=""></span></button>
        ${titulo()}
        ${FESTA.personagem ? conversaPersonagem() : FESTA.boasVindas ? `<p class="boasvindas" style="max-width:340px;margin:12px auto 0;color:var(--suave)">${esc(FESTA.boasVindas)}</p>` : ''}
      </header>`;
    },
    telao() {
      return `<div class="titulo"><div class="ola">Álbum de fotos ${/a$/i.test(N()) ? 'da' : 'do'}</div><h1>${esc(N())}</h1>
        <div class="pincel">${esc(quandoTxt() || 'Mande sua foto!')}</div></div>${baleiaBotao('baleiaTl')}`;
    },
    cartao() {
      return `${aquarela('#cfe6f3', 'left:-80px;top:-60px;width:240px')}${aquarela('#bfdff0', 'right:-90px;top:-40px;width:250px', 1)}
        <img class="decor" src="${IMG.baleia}" alt="" style="right:10px;top:10px;width:78px">
        <img class="decor" src="${IMG.peixes[0]}" alt="" style="left:14px;top:14px;width:46px">
        <img class="decor" src="${IMG.alga1}" alt="" style="left:-10px;bottom:0;height:150px">
        <img class="decor" src="${IMG.coral}" alt="" style="left:58px;bottom:0;height:64px">
        <img class="decor" src="${IMG.alga2}" alt="" style="right:-6px;bottom:0;height:160px">
        <img class="decor" src="${IMG.estrela}" alt="" style="right:58px;bottom:12px;width:46px">
        <div class="ola">Álbum de fotos ${/a$/i.test(N()) ? 'da' : 'do'}</div><h2>${esc(N())}</h2>${ONDINHA}
        ${FESTA.idade ? `<div class="pincel">${esc(plural(+FESTA.idade, 'ano', 'anos'))}</div>` : ''}`;
    },
    login() { return `<img src="${IMG.baleia}" alt="" style="width:110px;display:block;margin:0 auto">`; },
    vazioIcone() { return `<button class="bicho" data-bicho="estrela" aria-label="Estrela-do-mar" style="position:relative;display:block;margin:0 auto 8px;width:70px"><span style="display:block"><img src="${IMG.estrela}" alt=""></span></button>`; },
    toque(x, y, n) {
      Fx.bolhas(x, y, 6);
      if (n % 4 === 0) Fx.peixe({ y: y - 20, x0: x - 25, paraDireita: x < innerWidth / 2, tam: 46, dur: 2200 });
    },
    festa() {
      Fx.vibrar([12, 40, 12]); Fx.cardume(7);
      const b = $('.acao .btn'); if (b) { const r = b.getBoundingClientRect(); Fx.bolhas(r.left + r.width / 2, r.top, 14, 1.6); }
      Fx.esguicho($('[data-bicho=baleia]'));
    },
    novaFoto() { Fx.cardume(6); setTimeout(() => Fx.esguicho($('.baleiaTl')), 400); },
    ambiente(grande) {
      if (grande) return [
        setInterval(() => Fx.esguicho($('.baleiaTl')), 16000),
        setInterval(() => Fx.tartaruga(innerHeight * sorteio(.55, .8)), 32000),
        setInterval(() => Math.random() > .4 && Fx.cardume(4), 21000),
        setTimeout(() => Fx.tartaruga(innerHeight * .7), 3000)];
      return [
        setInterval(() => !document.hidden && Fx.esguicho($('[data-bicho=baleia]')), 14000),
        setInterval(() => !document.hidden && Fx.tartaruga(innerHeight * sorteio(.35, .7)), 26000),
        setTimeout(() => Fx.tartaruga(innerHeight * .55), 4000)];
    },
    falas: ['Oi! Tira uma foto da festa pra mim?', 'Glub glub! Que festa boa!', 'Tira uma foto com o bolo!', 'Que bom que você veio!',
      'Faz uma careta e tira foto!', 'Já viu a baleia? Toca nela!', 'Obrigado por vir na minha festa!'],
    momentos: {
      boasvindas: { botao: 'Boas-vindas', frase: 'Oi, gente! Bem-vindos ao meu fundo do mar!', audios: [] },
      fotos: { botao: 'Peça fotos', frase: 'Ei! Tira foto e manda pro meu álbum! Aponta o celular pro código!', audios: [] },
      parabens: { botao: 'Parabéns', frase: 'É hora do parabéns! Todo mundo cantando bem alto!', audios: [] },
      pescaria: { botao: 'Pescaria aberta', frase: 'A pescaria abriu! Vem pescar o seu tesouro!', audios: [] },
      obrigado: { botao: 'Obrigado por virem', frase: 'Obrigado por virem na minha festa!', audios: [] }
    }
  };
})();
