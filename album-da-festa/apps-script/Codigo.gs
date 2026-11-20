/**
 * Álbum da Festa — back-end central (um script atende todas as festas)
 *
 * Cole em script.google.com, numa conta Google SÓ do produto.
 * Publicar: Implantar > Nova implantação > App da Web
 *   - Executar como: Eu
 *   - Quem pode acessar: Qualquer pessoa
 *
 * Funções para rodar pelo editor (botão ▶ Executar):
 *   configurar()          uma vez: cria a pasta raiz, a chave de administrador e o gatilho diário
 *   gerarCodigo()         cria um código de ativação (edite DEGRAU_DO_CODIGO e EXTRAS_DO_CODIGO antes)
 *   listarFestas()        mostra as festas, prazos e uso de espaço
 *   liberarExtra()        liga um módulo extra numa festa (edite as constantes antes)
 *   renovarAcesso()       estende o prazo de uma festa (assinatura ou extensão vendida)
 *
 * Cada festa tem identificador, pasta, PIN e arquivos próprios. Nenhuma rota devolve dados de outra festa.
 */

const CFG = {
  NOME_RAIZ: 'Álbum da Festa — festas',
  FUSO: 'America/Sao_Paulo',
  LIMITE_BYTES: 15 * 1024 * 1024,     // por foto
  LIMITE_VIDEO: 30 * 1024 * 1024,     // por vídeo (até 30 s, preparado no celular)
  ZIP_PARTE_BYTES: 40 * 1024 * 1024,  // tamanho de cada parte do ZIP
  AVISO_DIAS: 7,                      // aviso à família antes de apagar
  // prazos em dias, contados a partir da data da festa (benchmark Fotify)
  PRAZOS: {
    diy:     { envio: 30,  acesso: 90 },
    fpv:     { envio: 90,  acesso: 365 },
    familia: { envio: 90,  acesso: 365 },   // por festa (2 festas por ano)
    pro:     { envio: 365, acesso: 365 }    // renovado com renovarAcesso() enquanto a licença estiver ativa
  },
  MODULOS_PADRAO: { album: true, telao: true, videos: true, video: false, playlist: false, pescaria: false },
  EXTRAS: ['video', 'playlist', 'pescaria'],
  // pelos termos, Feito pra Você, Assinatura da família e Licença Profissional já incluem vídeo e playlist; a pescaria é sempre extra pago
  EXTRAS_INCLUSOS: { diy: [], fpv: ['video', 'playlist'], familia: ['video', 'playlist'], pro: ['video', 'playlist'] }
};

/* ===================== rotas ===================== */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.acao === 'ping') return json_({ ok: true });
    const rec = festa_(p.f);
    if (p.acao === 'festa') return json_({ ok: true, festa: publico_(rec) });
    if (p.acao === 'pesca') return json_(Object.assign({ ok: true, momento: estado_(rec).momento || null }, pescaStatus_(estado_(rec).pesca)));
    // lista de fotos (convidados, telão) ou visão dos pais (com PIN)
    const pais = !!p.token;
    if (pais) sessaoOuErro_(rec, p.token);
    let fotos = indice_(rec);
    if (!pais) fotos = fotos.filter(function (f) { return !f.oculta; });
    const est = estado_(rec);
    const resp = { ok: true, total: fotos.length, fotos: fotos, pesca: pescaStatus_(est.pesca), momento: est.momento || null, festa: publico_(rec) };
    if (pais) {
      resp.pastaUrl = pasta_(rec).getUrl();
      resp.pesca.sorteados = est.pesca.sorteados.map(function (s) { return { n: s.n, nome: s.nome, t: s.t }; });
      resp.zip = rec.zip || [];
      resp.zipPronto = !!rec.zipPronto;
    }
    return json_(resp);
  } catch (err) {
    return json_(erro_(err));
  }
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.acao === 'criar') return json_(criar_(b));
    const rec = festa_(b.f);
    switch (b.acao) {
      case 'enviar': return json_(enviar_(rec, b));
      case 'pescar': return json_(pescar_(rec, b));
      case 'entrar': return json_(entrar_(rec, b));
    }
    // daqui para baixo, só os pais (com a sessão que o servidor deu depois de conferir o PIN)
    sessaoOuErro_(rec, b.token);
    switch (b.acao) {
      case 'ocultar': return json_(ocultar_(rec, b));
      case 'momento': return json_(momento_(rec, b));
      case 'pesca-config': return json_(pescaConfig_(rec, b));
      case 'pesca-devolver': return json_(pescaDevolver_(rec, b));
      case 'pesca-zerar': return json_(pescaZerar_(rec));
      case 'festa-config': return json_(festaConfig_(rec, b));
      case 'zip': return json_(zip_(rec, 240));
    }
    return json_({ ok: false, erro: 'Ação desconhecida' });
  } catch (err) {
    return json_(erro_(err));
  }
}

/* ===================== criar festa ===================== */

function criar_(b) {
  const f = b.festa || {};
  const props = PropertiesService.getScriptProperties();
  const admin = b.codigo && b.codigo === props.getProperty('ADMIN_KEY');
  const codigos = JSON.parse(props.getProperty('CODIGOS') || '{}');
  const cod = admin ? null : codigos[String(b.codigo || '').trim().toUpperCase()];
  if (!admin && !cod) return { ok: false, erro: 'Código de ativação inválido' };
  if (cod && cod.usado) return { ok: false, erro: 'Este código já foi usado' };

  const nome = limpar_(f.aniversariante, 30);
  if (!nome) return { ok: false, erro: 'Falta o nome do aniversariante' };
  const pin = String(f.pin || '').replace(/\D/g, '');
  if (pin.length < 6 || pin.length > 8) return { ok: false, erro: 'O PIN precisa ter de 6 a 8 números' };
  const data = /^\d{4}-\d{2}-\d{2}$/.test(f.data || '') ? f.data : Utilities.formatDate(new Date(), CFG.FUSO, 'yyyy-MM-dd');
  const degrau = admin ? (CFG.PRAZOS[f.degrau] ? f.degrau : 'fpv') : cod.degrau;

  return comTrava_(function () {
    const reg = registro_();
    let id;
    do { id = slug_(nome) + (f.idade ? '-' + Number(f.idade) : '') + '-' + Utilities.getUuid().slice(0, 4); } while (reg[id]);

    const pasta = raiz_().createFolder(data + ' · ' + nome + ' (' + id + ')');
    const sal = Utilities.getUuid();
    const modulos = Object.assign({}, CFG.MODULOS_PADRAO);
    const extras = (CFG.EXTRAS_INCLUSOS[degrau] || []).concat(admin ? CFG.EXTRAS.filter(function (x) { return f.modulos && f.modulos[x]; }) : (cod.extras || []));
    extras.forEach(function (x) { if (CFG.EXTRAS.indexOf(x) >= 0) modulos[x] = true; });

    let personagem = '';
    if (f.personagemDados) {
      const bytes = Utilities.base64Decode(f.personagemDados);
      if (bytes.length < 3 * 1024 * 1024) {
        const arq = pasta.createFile(Utilities.newBlob(bytes, 'image/png', '_personagem.png'));
        try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
        personagem = 'drive:' + arq.getId();
      }
    }

    const prazo = CFG.PRAZOS[degrau];
    const rec = {
      id: id, pastaId: pasta.getId(), criado: Date.now(), status: 'ativa', degrau: degrau,
      sal: sal, pinHash: hash_(sal + pin), contato: limpar_(f.contato, 120),
      envioAte: somarDias_(data, prazo.envio), acessoAte: somarDias_(data, prazo.acesso),
      publico: {
        versao: 1, id: id, aniversariante: nome, idade: f.idade ? Math.max(0, Math.min(120, Number(f.idade))) : null,
        data: data, horario: limpar_(f.horario, 5), local: limpar_(f.local, 80),
        tema: limpar_(f.tema, 30) || 'baloes', paleta: f.paleta === 'pastel' ? 'pastel' : 'colorida',
        cores: Array.isArray(f.cores) ? f.cores.slice(0, 3).map(function (c) { return limpar_(c, 9); }) : null,
        personagem: personagem, boasVindas: limpar_(f.boasVindas, 160),
        modulos: modulos, baus: Math.max(1, Math.min(200, Number(f.baus) || 30)), assinatura: f.assinatura !== false
      }
    };
    reg[id] = rec;
    salvarRegistro_(reg);
    if (cod) { cod.usado = true; cod.festa = id; cod.em = Date.now(); props.setProperty('CODIGOS', JSON.stringify(codigos)); }
    return { ok: true, id: id, festa: publico_(rec) };
  });
}

/* ===================== fotos ===================== */

function enviar_(rec, b) {
  ativaOuErro_(rec);
  if (hoje_() > rec.envioAte) return { ok: false, erro: 'O prazo de envio de fotos desta festa terminou' };
  if (!b.dados) throw new Error('Foto vazia');
  // consentimento: toda foto guarda quem aceitou (aparelho), qual versão dos termos e quando
  const aceite = b.aceite || {};
  if (!aceite.v || !aceite.t) return { ok: false, erro: 'Aceite dos termos ausente' };
  const bytes = Utilities.base64Decode(b.dados);
  const ehVideo = /^video\/(mp4|webm|quicktime)$/.test(b.mime || '');
  if (ehVideo && rec.publico.modulos.videos === false) return { ok: false, erro: 'Esta festa recebe só fotos' };
  if (bytes.length > (ehVideo ? CFG.LIMITE_VIDEO : CFG.LIMITE_BYTES)) throw new Error(ehVideo ? 'Vídeo grande demais' : 'Foto grande demais');
  const chave = String(b.chave || '').slice(0, 60);
  // reenvio da mesma foto depois de uma falha de rede: devolve a que já existe
  if (chave) { const ja = indice_(rec).filter(function (x) { return x.chave === chave; })[0]; if (ja) return { ok: true, foto: ja, repetida: true }; }

  const mime = ehVideo || /^image\//.test(b.mime || '') ? b.mime : 'image/jpeg';
  const ext = { 'image/png': 'png', 'image/heic': 'heic', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }[mime] || 'jpg';
  const nome = limpar_(b.nome, 40) || 'Convidado';
  const recado = limpar_(b.recado, 140);
  const t = Date.now();
  const carimbo = Utilities.formatDate(new Date(t), CFG.FUSO, 'HH-mm-ss');
  const base = carimbo + ' - ' + nome.replace(/[\\/:*?"<>|]/g, '');
  const pasta = pasta_(rec);

  // cria os arquivos fora da trava (é a parte demorada) e só trava para atualizar o índice
  const arq = pasta.createFile(Utilities.newBlob(bytes, mime, base + '.' + ext));
  arq.setDescription((ehVideo ? 'Vídeo de ' : 'Foto de ') + nome + (recado ? ' — "' + recado + '"' : ''));
  try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
  let mini = null;
  if (b.mini) {
    try {
      const m = subpasta_(pasta, 'miniaturas').createFile(Utilities.newBlob(Utilities.base64Decode(b.mini), 'image/jpeg', base + ' (640).jpg'));
      try { m.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
      mini = m;
    } catch (x) {}
  }
  const foto = { id: arq.getId(), mini: mini ? mini.getId() : '', nome: nome, recado: recado, t: t,
    w: Number(b.w) || 0, h: Number(b.h) || 0, bytes: bytes.length, chave: chave,
    tipo: ehVideo ? 'video' : 'foto', dur: ehVideo ? Math.min(31, Number(b.dur) || 0) : 0, mime: mime,
    aceite: { d: limpar_(b.dispositivo, 60), v: limpar_(aceite.v, 20), t: Number(aceite.t) || t, recebido: t } };

  return comTrava_(function () {
    const idx = indice_(rec, true);
    const ja = chave && idx.filter(function (x) { return x.chave === chave; })[0];
    if (ja) { arq.setTrashed(true); if (mini) mini.setTrashed(true); return { ok: true, foto: ja, repetida: true }; }
    idx.push(foto);
    salvarIndice_(rec, idx);
    return { ok: true, foto: foto };
  });
}

function ocultar_(rec, b) {
  return comTrava_(function () {
    const idx = indice_(rec, true);
    const f = idx.filter(function (x) { return x.id === b.id; })[0];
    if (!f) return { ok: false, erro: 'Foto não encontrada' };
    f.oculta = !!b.oculta;
    salvarIndice_(rec, idx);
    return { ok: true };
  });
}

/* ===================== momentos, pescaria, ajustes ===================== */

function momento_(rec, b) {
  return comTrava_(function () {
    const est = estado_(rec, true);
    est.momento = { tipo: limpar_(b.tipo, 30), t: Date.now() };
    salvarEstado_(rec, est);
    return { ok: true, momento: est.momento };
  });
}

function pescaStatus_(o) {
  const usados = o.sorteados.filter(function (s) { return s.n <= o.total; }).length;
  return { aberta: o.aberta, total: o.total, pescados: o.sorteados.length, restantes: Math.max(0, o.total - usados) };
}

function pescar_(rec, b) {
  ativaOuErro_(rec);
  if (!rec.publico.modulos.pescaria) return { ok: false, erro: 'Pescaria não incluída nesta festa' };
  const disp = String(b.dispositivo || '').slice(0, 60);
  if (!disp) return { ok: false, erro: 'Aparelho não identificado' };
  return comTrava_(function () {
    const est = estado_(rec, true), o = est.pesca;
    const ja = o.sorteados.filter(function (s) { return s.d === disp; })[0];
    if (ja) return { ok: true, numero: ja.n, repetido: true };
    if (!o.aberta) return { ok: false, erro: 'Pescaria fechada' };
    const usados = {}; o.sorteados.forEach(function (s) { usados[s.n] = 1; });
    const livres = []; for (let n = 1; n <= o.total; n++) if (!usados[n]) livres.push(n);
    if (!livres.length) return { ok: false, erro: 'Acabaram os baús' };
    const n = livres[Math.floor(Math.random() * livres.length)];
    o.sorteados.push({ n: n, nome: limpar_(b.nome, 40) || 'Convidado', d: disp, t: Date.now() });
    salvarEstado_(rec, est);
    return { ok: true, numero: n, restantes: livres.length - 1 };
  });
}

function pescaConfig_(rec, b) {
  return comTrava_(function () {
    const est = estado_(rec, true), o = est.pesca;
    if (b.total != null) o.total = Math.max(1, Math.min(200, Math.round(Number(b.total)) || o.total));
    if (b.aberta != null) o.aberta = !!b.aberta;
    salvarEstado_(rec, est);
    return Object.assign({ ok: true }, pescaStatus_(o));
  });
}
function pescaDevolver_(rec, b) {
  return comTrava_(function () {
    const est = estado_(rec, true);
    est.pesca.sorteados = est.pesca.sorteados.filter(function (s) { return s.n !== Number(b.n); });
    salvarEstado_(rec, est);
    return Object.assign({ ok: true }, pescaStatus_(est.pesca));
  });
}
function pescaZerar_(rec) {
  return comTrava_(function () {
    const est = estado_(rec, true);
    est.pesca.sorteados = [];
    salvarEstado_(rec, est);
    return Object.assign({ ok: true }, pescaStatus_(est.pesca));
  });
}

// o que os pais podem mudar sozinhos: nome e idade, paleta, assinatura no telão e textos
function festaConfig_(rec, b) {
  return comTrava_(function () {
    const reg = registro_(), r = reg[rec.id];
    if (b.assinatura != null) r.publico.assinatura = !!b.assinatura;
    if (b.paleta === 'colorida' || b.paleta === 'pastel') r.publico.paleta = b.paleta;
    if (b.aniversariante != null && limpar_(b.aniversariante, 30)) r.publico.aniversariante = limpar_(b.aniversariante, 30);
    if (b.idade != null) r.publico.idade = Number(b.idade) >= 1 ? Math.min(120, Math.round(Number(b.idade))) : null;
    if (b.boasVindas != null) r.publico.boasVindas = limpar_(b.boasVindas, 160);
    if (b.contato != null) r.contato = limpar_(b.contato, 120);
    salvarRegistro_(reg);
    return { ok: true, festa: publico_(r) };
  });
}

/* ===================== ZIP, avisos e limpeza ===================== */

// Monta o ZIP em partes, continuando de onde parou (cada chamada trabalha por até "segundos").
function zip_(rec, segundos) {
  const t0 = Date.now();
  const idx = indice_(rec);
  let feitos = rec.zipFeitos || 0;
  const zips = rec.zip || [];
  const pasta = pasta_(rec), destino = subpasta_(pasta, '_download');
  while (feitos < idx.length && Date.now() - t0 < segundos * 1000) {
    const blobs = []; let soma = 0;
    while (feitos < idx.length && soma < CFG.ZIP_PARTE_BYTES) {
      try {
        const b = DriveApp.getFileById(idx[feitos].id).getBlob();
        const extZ = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'image/png': 'png', 'image/heic': 'heic' }[idx[feitos].mime] || 'jpg';
        b.setName(Utilities.formatDate(new Date(idx[feitos].t), CFG.FUSO, 'HH-mm-ss') + ' - ' + idx[feitos].nome.replace(/[\\/:*?"<>|]/g, '') + ' ' + (feitos + 1) + '.' + extZ);
        blobs.push(b); soma += b.getBytes().length;
      } catch (x) {}
      feitos++;
    }
    if (!blobs.length) continue;
    const nomeZip = rec.publico.aniversariante + ' - fotos da festa - parte ' + (zips.length + 1) + '.zip';
    const arq = destino.createFile(Utilities.zip(blobs, nomeZip));
    try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
    zips.push({ id: arq.getId(), nome: nomeZip, url: 'https://drive.google.com/uc?export=download&id=' + arq.getId(), bytes: soma });
  }
  return comTrava_(function () {
    const reg = registro_(), r = reg[rec.id];
    r.zip = zips; r.zipFeitos = feitos; r.zipPronto = feitos >= idx.length; r.zipEm = Date.now();
    salvarRegistro_(reg);
    return { ok: true, zip: zips, zipPronto: r.zipPronto, feitos: feitos, total: idx.length };
  });
}

// Gatilho diário: monta o ZIP quando o envio fecha, avisa a família antes de apagar e apaga depois do prazo.
function rotinaDiaria() {
  const reg = registro_(), hoje = hoje_();
  Object.keys(reg).forEach(function (id) {
    const rec = reg[id];
    if (rec.status !== 'ativa') return;
    try {
      if (hoje > rec.envioAte && !rec.zipPronto) zip_(rec, 120);
      const r = registro_()[id];   // recarrega (o zip pode ter mudado o registro)
      const faltam = diasEntre_(hoje, r.acessoAte);
      if (faltam <= CFG.AVISO_DIAS && !r.avisoEm) avisar_(r, faltam);
      else if (hoje > r.acessoAte && r.avisoEm && diasEntre_(Utilities.formatDate(new Date(r.avisoEm), CFG.FUSO, 'yyyy-MM-dd'), hoje) >= CFG.AVISO_DIAS) encerrar_(r);
    } catch (err) { Logger.log(id + ': ' + err); }
  });
}

function avisar_(rec, faltam) {
  if (rec.contato) {
    const links = (rec.zip || []).map(function (z) { return '• ' + z.nome + ': ' + z.url; }).join('\n') || '• Abra a área dos pais e toque em "Baixar todas as fotos".';
    MailApp.sendEmail(rec.contato, 'O álbum da festa de ' + rec.publico.aniversariante + ' sai do ar em ' + Math.max(0, faltam) + ' dias',
      'Oi! O álbum da festa de ' + rec.publico.aniversariante + ' fica disponível até ' + dataBR_(rec.acessoAte) + '.\n\n' +
      'Depois dessa data as fotos são apagadas. Baixe tudo antes:\n' + links + '\n\n' +
      'Quer manter o álbum por mais tempo? Responda este e-mail.\n');
  }
  comTrava_(function () { const reg = registro_(); reg[rec.id].avisoEm = Date.now(); salvarRegistro_(reg); });
}

function encerrar_(rec) {
  comTrava_(function () {
    const reg = registro_(), r = reg[rec.id];
    try { DriveApp.getFolderById(r.pastaId).setTrashed(true); } catch (x) {}   // fica 30 dias na lixeira do Drive
    r.status = 'encerrada'; r.encerradaEm = Date.now();
    salvarRegistro_(reg);
  });
}

/* ===================== registro, índice e estado ===================== */

function raiz_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('RAIZ_ID');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (x) {} }
  const it = DriveApp.getFoldersByName(CFG.NOME_RAIZ);
  const raiz = it.hasNext() ? it.next() : DriveApp.createFolder(CFG.NOME_RAIZ);
  props.setProperty('RAIZ_ID', raiz.getId());
  return raiz;
}
function arquivo_(pasta, nome, inicial, chaveProp) {
  const props = PropertiesService.getScriptProperties();
  const id = chaveProp && props.getProperty(chaveProp);
  if (id) { try { const f = DriveApp.getFileById(id); if (!f.isTrashed()) return f; } catch (x) {} }
  const it = pasta.getFilesByName(nome);
  const arq = it.hasNext() ? it.next() : pasta.createFile(nome, inicial, 'application/json');
  if (chaveProp) props.setProperty(chaveProp, arq.getId());
  return arq;
}
function lerJson_(chaveCache, arquivoFn, padrao, forcar) {
  const cache = CacheService.getScriptCache();
  if (!forcar) { const c = cache.get(chaveCache); if (c) return JSON.parse(c); }
  let v; try { v = JSON.parse(arquivoFn().getBlob().getDataAsString() || 'null'); } catch (x) { v = null; }
  if (v == null) v = padrao;
  try { cache.put(chaveCache, JSON.stringify(v), 21600); } catch (x) {}
  return v;
}
function gravarJson_(chaveCache, arquivoFn, v) {
  const txt = JSON.stringify(v);
  arquivoFn().setContent(txt);
  const cache = CacheService.getScriptCache();
  try { cache.put(chaveCache, txt, 21600); } catch (x) { cache.remove(chaveCache); }
}

const regArq_ = function () { return arquivo_(raiz_(), '_festas.json', '{}', 'REG_ID'); };
function registro_() { return lerJson_('reg', regArq_, {}, true); }
function salvarRegistro_(reg) {
  gravarJson_('reg', regArq_, reg);
  const cache = CacheService.getScriptCache();
  Object.keys(reg).forEach(function (id) { try { cache.put('f:' + id, JSON.stringify(reg[id]), 21600); } catch (x) {} });
}
function festa_(id) {
  id = String(id || '').trim();
  if (!/^[a-z0-9-]{3,60}$/.test(id)) throw new Error('Festa não encontrada');
  const cache = CacheService.getScriptCache();
  const c = cache.get('f:' + id);
  const rec = c ? JSON.parse(c) : registro_()[id];
  if (!rec) throw new Error('Festa não encontrada');
  if (!c) { try { cache.put('f:' + id, JSON.stringify(rec), 21600); } catch (x) {} }
  return rec;
}
function publico_(rec) {
  return Object.assign({}, rec.publico, {
    status: rec.status, envioAte: rec.envioAte, acessoAte: rec.acessoAte,
    envioAberto: rec.status === 'ativa' && hoje_() <= rec.envioAte
  });
}
function pasta_(rec) { return DriveApp.getFolderById(rec.pastaId); }
function subpasta_(pasta, nome) { const it = pasta.getFoldersByName(nome); return it.hasNext() ? it.next() : pasta.createFolder(nome); }

function indice_(rec, forcar) { return lerJson_('i:' + rec.id, function () { return arquivo_(pasta_(rec), '_indice.json', '[]', 'I:' + rec.id); }, [], forcar); }
function salvarIndice_(rec, v) { gravarJson_('i:' + rec.id, function () { return arquivo_(pasta_(rec), '_indice.json', '[]', 'I:' + rec.id); }, v); }
function estado_(rec, forcar) {
  const e = lerJson_('e:' + rec.id, function () { return arquivo_(pasta_(rec), '_estado.json', '{}', 'E:' + rec.id); }, {}, forcar);
  e.pesca = e.pesca || {}; e.pesca.total = e.pesca.total || rec.publico.baus || 30; e.pesca.aberta = !!e.pesca.aberta; e.pesca.sorteados = e.pesca.sorteados || [];
  return e;
}
function salvarEstado_(rec, v) { gravarJson_('e:' + rec.id, function () { return arquivo_(pasta_(rec), '_estado.json', '{}', 'E:' + rec.id); }, v); }

/* ===================== segurança ===================== */

// Entrada dos pais. Tentativas erradas contam por aparelho (5 em 10 min) e, na festa toda, no máximo 30 em 10 min.
// Quem já entrou continua com a sessão: erros de outras pessoas nunca derrubam os pais que estão logados.
function entrar_(rec, b) {
  const cache = CacheService.getScriptCache();
  const d = limpar_(b.dispositivo, 60) || 'sem-aparelho';
  const kd = 'fd:' + rec.id + ':' + d, kg = 'fg:' + rec.id;
  const fd = Number(cache.get(kd) || 0), fg = Number(cache.get(kg) || 0);
  if (fd >= 5) return { ok: false, erro: 'Muitas tentativas neste aparelho. Espere 10 minutos.' };
  if (fg >= 30) return { ok: false, erro: 'Muitas tentativas erradas nesta festa. Espere alguns minutos.' };
  Utilities.sleep(Math.min(3000, fd * 600));   // cada erro deixa a próxima tentativa mais lenta
  if (hash_(rec.sal + String(b.pin || '')) !== rec.pinHash) {
    cache.put(kd, String(fd + 1), 600); cache.put(kg, String(fg + 1), 600);
    return { ok: false, erro: 'PIN incorreto' };
  }
  cache.remove(kd);
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('tk:' + rec.id + ':' + token, d, 21600);   // sessão de 6 horas (cobre a festa)
  return { ok: true, token: token, horas: 6 };
}
function sessaoOuErro_(rec, token) {
  if (!token || !CacheService.getScriptCache().get('tk:' + rec.id + ':' + String(token))) throw new Error('Sessão expirada');
}
function ativaOuErro_(rec) { if (rec.status !== 'ativa') throw new Error('Este álbum foi encerrado'); }
function hash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function comTrava_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('ocupado');   // o celular tenta de novo sozinho
  try { return fn(); } finally { lock.releaseLock(); }
}
function erro_(err) {
  const m = String((err && err.message) || err);
  const ocupado = /ocupado|too many|simultaneous|Limite|Service invoked|Lock/i.test(m);
  return { ok: false, erro: ocupado ? 'ocupado' : m, tentarDeNovo: ocupado };
}

/* ===================== utilidades ===================== */

function limpar_(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function slug_(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'festa'; }
function hoje_() { return Utilities.formatDate(new Date(), CFG.FUSO, 'yyyy-MM-dd'); }
function somarDias_(iso, dias) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10); }
function diasEntre_(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }
function dataBR_(iso) { const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

/* ===================== funções do administrador (rodar pelo editor) ===================== */

function configurar() {
  const props = PropertiesService.getScriptProperties();
  raiz_(); regArq_();
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', 'ADM-' + Utilities.getUuid().slice(0, 13).toUpperCase());
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'rotinaDiaria') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('rotinaDiaria').timeBased().everyDays(1).atHour(4).create();
  Logger.log('Pasta raiz: ' + raiz_().getUrl());
  Logger.log('Chave de administrador (use no campo "Código" do assistente para criar festas sem código): ' + props.getProperty('ADMIN_KEY'));
}

// >>> edite antes de rodar gerarCodigo()
const DEGRAU_DO_CODIGO = 'diy';        // diy | fpv | familia | pro
const EXTRAS_DO_CODIGO = [];           // ex.: ['pescaria', 'video', 'playlist']
function gerarCodigo() {
  const props = PropertiesService.getScriptProperties();
  const codigos = JSON.parse(props.getProperty('CODIGOS') || '{}');
  let c; do { c = 'ALB-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); } while (codigos[c]);
  codigos[c] = { degrau: DEGRAU_DO_CODIGO, extras: EXTRAS_DO_CODIGO, usado: false, criado: Date.now() };
  props.setProperty('CODIGOS', JSON.stringify(codigos));
  Logger.log('Código: ' + c + ' (' + DEGRAU_DO_CODIGO + (EXTRAS_DO_CODIGO.length ? ' + ' + EXTRAS_DO_CODIGO.join(', ') : '') + ')');
}

function listarFestas() {
  const reg = registro_();
  Object.keys(reg).forEach(function (id) {
    const r = reg[id], idx = indice_(r);
    const mb = idx.reduce(function (s, f) { return s + (f.bytes || 0); }, 0) / 1048576;
    Logger.log([id, r.status, r.degrau, 'envio até ' + r.envioAte, 'acesso até ' + r.acessoAte, idx.length + ' fotos', mb.toFixed(1) + ' MB'].join(' · '));
  });
  Logger.log('Espaço usado na conta: ' + (DriveApp.getStorageUsed() / 1073741824).toFixed(2) + ' GB de ' + (DriveApp.getStorageLimit() / 1073741824).toFixed(0) + ' GB');
}

// >>> edite antes de rodar liberarExtra() ou renovarAcesso()
const FESTA_ALVO = '';          // id da festa (veja em listarFestas)
const MODULO_ALVO = 'pescaria'; // video | playlist | pescaria
const DIAS_A_MAIS = 365;
function liberarExtra() { ligarExtra_(true); }
function desligarExtra() { ligarExtra_(false); }
function ligarExtra_(ligar) {
  comTrava_(function () { const reg = registro_(); reg[FESTA_ALVO].publico.modulos[MODULO_ALVO] = ligar; salvarRegistro_(reg); });
  Logger.log(MODULO_ALVO + (ligar ? ' ligado' : ' desligado') + ' em ' + FESTA_ALVO);
}
// troca o tema de uma festa (ex.: 'fundo-do-mar' quando o tema personalizado é vendido; 'baloes' volta ao neutro)
const TEMA_ALVO = 'baloes';
function trocarTema() {
  comTrava_(function () { const reg = registro_(); reg[FESTA_ALVO].publico.tema = TEMA_ALVO; salvarRegistro_(reg); });
  Logger.log(FESTA_ALVO + ': tema ' + TEMA_ALVO);
}
function renovarAcesso() {
  comTrava_(function () {
    const reg = registro_(), r = reg[FESTA_ALVO];
    r.acessoAte = somarDias_(r.acessoAte > hoje_() ? r.acessoAte : hoje_(), DIAS_A_MAIS);
    if (r.degrau === 'familia') r.envioAte = r.acessoAte;
    r.avisoEm = null;
    salvarRegistro_(reg);
    Logger.log(FESTA_ALVO + ': acesso até ' + r.acessoAte);
  });
}
