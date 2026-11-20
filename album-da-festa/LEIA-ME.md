# Álbum da Festa (versão produto)

Um único site e um único script do Google atendem todas as festas. Cada festa tem um link próprio, `SEU-SITE/?f=<id>`, com pasta, PIN, prazos e dados separados.

## Peças do pacote
| Arquivo ou pasta | O que é |
|---|---|
| `index.html` | O app inteiro: convidado, telão, área dos pais, QR, pescaria e o assistente `#criar` |
| `apps-script/Codigo.gs` | Back-end central, numa conta Google só do produto |
| `temas/baloes/` | Tema neutro padrão (paletas "Festa colorida" e "Sonho pastel") |
| `temas/fundo-do-mar/` | Primeiro tema personalizado. Só carrega quando o festa.json pede |
| `modulos/pescaria/img/` | Imagens do mar da pescaria (extra) |
| `exemplos/festa.exemplo.json` | Modelo do festa.json |

## 1. Back-end (uma vez)
1. Crie uma conta Google só do produto. Para o teste, pode ser uma conta existente; troque antes da primeira venda.
2. Em script.google.com, crie um projeto novo e cole `apps-script/Codigo.gs`.
3. Rode **configurar** (▶ Executar) e autorize. Isso cria:
   - a pasta "Álbum da Festa — festas";
   - a chave de administrador (aparece no registro de execução);
   - o gatilho diário.
4. Publique em **Implantar → Nova implantação → App da Web**, com "Executar como: Eu" e "Quem pode acessar: Qualquer pessoa".
5. Copie a URL que termina em `/exec` para `SCRIPT_URL` no `index.html`. Ajuste também `LINK_VENDA`, `TERMOS` e `PRIVACIDADE`.

## 2. Site
Suba a pasta inteira no GitHub Pages (ou outra hospedagem estática). Não há um site por festa.

## 3. Criar uma festa
- **Com código (Faça Você Mesmo, Assinatura):**
  1. Antes de rodar `gerarCodigo()`, ajuste no código `DEGRAU_DO_CODIGO` e `EXTRAS_DO_CODIGO`.
  2. Rode `gerarCodigo()` e mande o código ao cliente.
  3. O cliente abre `SEU-SITE/#criar`, preenche os passos, confere a prévia, cola o código e cria.
- **Feito pra Você:** com as respostas do formulário de briefing, você mesmo preenche `#criar`. No campo "Código", use a chave de administrador.
- **Ao final**, o assistente mostra 4 links: convidados, telão, área dos pais e QR para imprimir.

## Funções do administrador (editor do Apps Script)
- `listarFestas()`: prazos, número de fotos, MB por festa e uso da conta (limite de 15 GB).
- `liberarExtra()`: liga vídeo, playlist ou pescaria numa festa (ajuste `FESTA_ALVO` e `MODULO_ALVO`).
- `renovarAcesso()`: estende o prazo (assinatura ou extensão vendida).

## Prazos e limpeza (automático)
| Degrau | Envio de fotos | Álbum no ar |
|---|---|---|
| Faça Você Mesmo | 30 dias | 90 dias |
| Feito pra Você | 90 dias | 365 dias |
| Assinatura da família | 90 dias por festa | 365 dias |
| Licença Profissional | enquanto ativa (renovar por `renovarAcesso`) | idem |

Os prazos contam da data da festa. O gatilho diário segue esta ordem:
1. Monta o ZIP quando o envio fecha.
2. Manda e-mail à família 7 dias antes do fim.
3. Só depois de 7 dias do aviso, manda a pasta para a lixeira do Drive. Ela fica lá 30 dias antes de sumir.

## LISTA DE RECURSOS
| Recurso | Versão padrão | Faça Você Mesmo | Feito pra Você | Assinatura da família | Licença Profissional | Extra pago | Como testar |
|---|---|---|---|---|---|---|---|
| Álbum no celular (nome, foto, galeria, recado) | Sim | Sim | Sim | Sim | Sim | — | Abrir o link da festa, salvar nome, mandar 2 fotos |
| Vídeo de até 30 s enviado pelo convidado (capa automática, toca no telão sem som) | Sim | Sim | Sim | Sim | Sim | — | Galeria → escolher um vídeo curto; conferir no álbum e no telão |
| Fila offline (envia quando a internet volta) | Sim | Sim | Sim | Sim | Sim | — | Modo avião, tirar foto, voltar a internet |
| Reenvio quando o Google recusa por excesso de envios | Sim | Sim | Sim | Sim | Sim | — | 5 celulares mandando ao mesmo tempo; nenhuma foto perdida |
| Foto 2048 px + miniatura 640 px | Sim | Sim | Sim | Sim | Sim | — | Ver em `listarFestas()` o MB por foto |
| Telão com QR e "Acabou de chegar" | Sim | Sim | Sim | Sim | Sim | — | `#telao` → Iniciar telão → mandar foto |
| QR para imprimir nas mesas | Sim | Sim | Sim | Sim | Sim | — | `#qr` → Imprimir |
| Área dos pais: trocar nome, idade e paleta | Sim | Sim | Sim | Sim | Sim | — | `#pais` → Dados da festa / Visual da festa |
| Área dos pais (PIN, ocultar, baixar foto) | Sim | Sim | Sim | Sim | Sim | — | `#pais` → PIN → ocultar uma foto e conferir no telão |
| ZIP com todas as fotos | Sim | Sim | Sim | Sim | Sim | — | Área dos pais → Preparar ZIP |
| Aviso por e-mail antes de apagar | Sim | Sim | Sim | Sim | Sim | — | Festa de teste com prazo curto (editar `acessoAte`) |
| Tema neutro Balões (2 paletas) | Sim | Sim | Sim | Sim | Sim | — | `#criar` passo 1 e prévia |
| Foto do aniversariante falando no telão | Sim (se enviar foto) | Sim | Sim | Sim | Sim | — | `#criar` passo 4 com foto → telão → mandar foto |
| Assinatura no telão (desligável) | Sim | Sim | Sim | Sim | Sim | — | Área dos pais → Telão → desmarcar |
| Termos e privacidade no primeiro acesso | Sim | Sim | Sim | Sim | Sim | — | Abrir o link em janela anônima |
| Montagem pelo assistente | — | Cliente monta | Você monta (briefing) | Cliente monta | Cliente monta | — | `#criar` |
| Tema personalizado (ex.: Fundo do Mar) | — | — | Sim | Sim | Sim | Sim | festa.json com `"tema": "fundo-do-mar"` |
| Pescaria de lembrancinhas | — | — | — | — | — | Sim | `liberarExtra()` → `#pescar` |
| Vídeo no telão | — | — | Sim | Sim | Sim | Sim | `liberarExtra()` → telão → escolher vídeo → área dos pais → Tocar vídeo |
| Playlist do Spotify no telão | — | — | Sim | Sim | Sim | Sim | `liberarExtra()` → colar link na tela "Iniciar telão" |
| Papelaria pronta | — | — | Sim | Sim | Sim | Sim | Fora do app (arquivo à parte) |
| Mais tempo de álbum no ar | — | — | — | — | — | Sim | `renovarAcesso()` |

## Segurança e consentimento (revisão ALB-15)
- **PIN:**
  - tem de 6 a 8 números e só existe no servidor, como hash;
  - vai uma vez, no login; o servidor devolve uma sessão de 6 horas, e o aparelho guarda só a sessão;
  - o festa.json baixado pelo assistente não leva o PIN.
- **Tentativas erradas:**
  - 5 por aparelho em 10 minutos, e cada erro deixa a próxima tentativa mais lenta;
  - no máximo 30 por festa em 10 minutos;
  - os pais que já entraram continuam com a sessão, então ninguém tranca a área dos pais.
- **Aceite dos termos:**
  - toda foto enviada leva o aceite, gravado no índice do servidor: aparelho, versão do texto e hora;
  - sem aceite, o servidor recusa a foto;
  - ao mudar `TERMOS_VERSAO`, todos os convidados aceitam de novo.

## Para o consultor revisar
- **Vídeos:** até 30 s; acima disso, o celular regrava só o começo em 720p (pede para manter a tela aberta). Limite de 25 MB depois de preparado. O back-end entrega o vídeo (o Drive não toca vídeo direto no navegador): cada exibição baixa o arquivo inteiro, então muitos vídeos pesam no limite diário do Apps Script.
- **Limites da conta gratuita:**
  - 15 GB de espaço. A ~0,6 MB por foto, mais a miniatura, cabem cerca de 20 mil fotos.
  - 30 execuções simultâneas do Apps Script. O app tenta de novo sozinho quando passa disso.
  - 15 MB por foto.
  - 6 minutos por execução: o ZIP é montado em partes e continua de onde parou.
- **O que fica no Drive:** a foto principal e a miniatura de 640 px ficam visíveis a quem tiver o link do arquivo. A lista de fotos só sai para quem abre o link da festa.
- **Termos e privacidade:** publicados no app (versão 2026-11-20.2, também em `termos-e-privacidade.md`). É o esqueleto sem as marcas [ADV]. Faltam ainda: identificação do fornecedor, cancelamento e reembolso, base legal, canal do titular e encarregado (DPO). Revisão jurídica antes da primeira venda.
- **Licença Profissional:** os termos prometem "marca do profissional no telão" e "painel profissional", e isso ainda não existe no app.
- **`LINK_VENDA`:** a definir.
- **Ícones:** `icon-192.png` e `icon-512.png` ainda são os da festa do Thales. Trocar por um ícone do produto.
- **Economia de espaço:** medir na festa de teste (2048 px contra 2560 px da versão do Thales).
- **Back-end:** não foi testado em conta Google real. Os testes visuais usaram um servidor simulado. O teste real é o GATE 3.
