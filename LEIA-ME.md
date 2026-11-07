# Álbum do Thales — como colocar no ar

São 3 partes: o **script do Google** (recebe as fotos e salva no seu Drive), o **site** (GitHub Pages) e o **teste**. Leva uns 20 minutos. Tudo grátis.

## 1. Script do Google (guarda as fotos no seu Drive)
1. Entre em **script.google.com** com a conta Google onde quer guardar as fotos → **Novo projeto**.
2. Apague o que estiver no editor e cole todo o conteúdo de `apps-script/Codigo.gs`.
3. Na linha `const PIN_PAIS = '0711';` troque pelo PIN que quiser (é a senha da área dos pais).
4. Salve (💾). No menu de funções escolha **configurar** e clique **▶ Executar**. O Google vai pedir autorização: escolha sua conta → *Avançado* → *Acessar (não seguro)* → *Permitir*. (O aviso aparece porque o script é seu e não foi revisado pelo Google — é normal.)
   - Isso cria no seu Drive a pasta **"Álbum do Thales - 2 anos"**.
5. **Implantar → Nova implantação** → engrenagem ⚙️ → **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - **Implantar** → copie a **URL do app da Web** (termina em `/exec`).
6. Abra o `index.html` num editor de texto e cole essa URL em `SCRIPT_URL: '...'`.

> Se mudar o código do script depois: **Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar** (assim a URL continua a mesma).

## 2. Site no GitHub Pages
1. Crie uma conta em github.com → **New repository** → nome `album-thales` → **Public** → Create.
2. **Add file → Upload files** → arraste: `index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `thales.png` **e a pasta `img`** (com os bichinhos) → **Commit**.
3. **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → Save.
4. Em 1–2 minutos o app fica em `https://SEU-USUARIO.github.io/album-thales/`.

## 3. Testar antes da festa
- Abra o link no celular, coloque seu nome e mande 2–3 fotos.
- Abra `.../album-thales/#pais` → digite o PIN → veja as fotos e o botão da pasta.
- No computador/TV, abra `.../album-thales/#telao` → **Iniciar telão**.
- Depois do teste, oculte ou apague as fotos de teste (pela área dos pais ou direto na pasta do Drive).

## Telas do app
| Endereço | Para quem | O que faz |
|---|---|---|
| `/` | Convidados | Nome, tirar foto / escolher da galeria, recado, "Minhas fotos" e "Álbum da festa" |
| `/#telao` | Telão (notebook ligado na TV, Chrome em tela cheia) | Slideshow com as fotos, mostra primeiro as que acabaram de chegar, QR code no canto |
| `/#pais` | Vocês (com PIN) | Contadores, ocultar foto do telão, baixar, abrir a pasta do Drive, link e QR |
| `/#qr` | Imprimir | Cartão com o QR code para colocar nas mesas |
| `/#pescar` | Convidados | Pescaria de lembrancinhas (mini game) |
| `/#baus` | Imprimir | Etiquetas numeradas para colar nos baús |

## Dicas para o dia
- **Telão:** use um notebook com o Chrome, ligado na TV pelo HDMI, na tomada. Toque em *Iniciar telão* (entra em tela cheia e impede a tela de apagar).
- **QR nas mesas:** imprima pela área dos pais → *QR para as mesas*.
- **Internet ruim no salão:** as fotos ficam guardadas no celular do convidado e são enviadas sozinhas quando a conexão voltar (desde que ele abra o app de novo).
- **Depois da festa:** abra a pasta no Drive → selecione tudo → *Fazer download* (vem num .zip). As fotos ficam com o nome de quem tirou e o recado na descrição.

## Bom saber
- Ninguém precisa fazer login nem instalar nada: o convidado só abre o link. (Instalar na tela inicial também funciona.)
- As fotos são enviadas reduzidas para no máximo 2560 px (ótimas para tela e impressão até 20×30), para não travar a internet da festa.
- Para aparecer no telão, cada foto fica acessível a quem tiver o link dela (um código longo e impossível de adivinhar). A lista de fotos só é vista por quem tem o link do app.
- Ocultar uma foto tira ela do telão e do álbum dos convidados, mas ela continua na pasta.
- Limites do Google (conta gratuita): tranquilo para uma festa — centenas de fotos e dezenas de pessoas ao mesmo tempo.

## Pescaria de lembrancinhas
- **Atualize o script do Google:** cole o novo `apps-script/Codigo.gs` por cima do antigo e salve. Depois vá em **Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar**. A URL continua a mesma.
- **Antes da festa** (área dos pais): ajuste o **Nº de baús**, toque em **Imprimir números** e cole uma etiqueta em cada baú.
- **Teste:** abra a pescaria, pesque com o seu celular e depois toque em **Zerar pescaria**.
- **Na hora:** toque em **Abrir pescaria**. O telão mostra um aviso e os convidados pescam pelo app.
- Cada número sai uma vez só e cada celular pesca uma vez. Se alguém pescar por engano, use **Devolver** na lista: o baú volta para o mar.
- Quem limpa os dados do navegador ou usa outro celular consegue pescar de novo. A lista na área dos pais mostra quem pegou cada baú.

## Thales fala no telão
- Toda foto nova faz o Thales aparecer no telão com um balão de fala. A frase depende do nome de quem mandou: Janete, Graciane ou "vó"/"vovó" → vovó; Adilson ou "vovô" → vovô; o resto → "tio"/"tia" + nome (nome terminado em "a" vira "tia").
- Na área dos pais, os botões de **Thales fala no telão** disparam os momentos: Boas-vindas, Peça fotos, Parabéns, Pescaria aberta, Obrigado por virem. Aparecem no telão em até 5 segundos.
- **Voz (balbucio):** o Thales "fala" como personagem de jogo: o texto é dividido em pedaços (até cada vírgula ou "!") e cada pedaço ganha uma frase real dele, do jeitinho que ele falou, com quantidade parecida de sílabas. As letras aparecem no ritmo do áudio. São 21 frases (`voz/frases.wav` + `voz/frases.json`), tiradas do áudio dele.
- **Áudio gravado (opcional):** se quiser uma fala gravada no lugar do balbucio, salve na pasta `voz/` com o nome indicado no `index.html` (ex.: `vovo.mp3`, `parabens.mp3`). Se o arquivo não existir, ele usa o balbucio.
- **Para editar nomes e frases:** abra o `index.html`, procure `const VOZ = {` e altere as listas.
- O som só toca depois de tocar em **Iniciar telão** (regra dos navegadores). Deixe o volume do notebook/TV alto.
