# Professor Ferrari IA — guia de publicação (passo a passo)

Este pacote tem um site de chat onde os alunos podem digitar perguntas e
enviar fotos de exercícios/textos para o "Professor Ferrari" (IA) responder.
Tudo roda de graça nos limites descritos na conversa.

Você **não precisa usar terminal/linha de comando**. Tudo é feito clicando,
pelo navegador.

---

## Passo 1 — Pegar a chave da API do Gemini (gratuito)

1. Acesse https://aistudio.google.com/apikey
2. Faça login com uma conta Google.
3. Clique em **"Create API key"**.
4. Copie a chave gerada (uma sequência de letras/números) e guarde num
   bloco de notas por enquanto. Você vai usá-la no Passo 4.

Não compartilhe essa chave publicamente (não cole em grupos, etc.) — quem
tiver acesso a ela pode gerar custo na sua conta.

---

## Passo 2 — Criar uma conta no GitHub (gratuito)

O GitHub é só o lugar onde os arquivos do site ficam guardados, para a
Vercel (próximo passo) conseguir publicá-los.

1. Acesse https://github.com e crie uma conta gratuita.
2. Clique no **"+"** no canto superior direito → **"New repository"**.
3. Dê o nome `professor-ferrari-ia`, marque como **Public** ou **Private**
   (tanto faz), e clique em **"Create repository"**.

---

## Passo 3 — Subir os arquivos do projeto

Na página do repositório recém-criado:

1. Clique em **"Add file" → "Upload files"**.
2. Arraste a pasta `professor-ferrari-ia` inteira (com os arquivos que te
   enviei: `index.html`, `package.json`, `.gitignore` e a subpasta `api`
   com `chat.js` e `materiais.js`) para a área de upload.
   - O GitHub preserva a estrutura de pastas ao arrastar.
3. Role para baixo e clique em **"Commit changes"**.

Confira se, no repositório, existe uma pasta `api` contendo `chat.js` e
`materiais.js` — isso é importante para o próximo passo funcionar.

---

## Passo 4 — Publicar com a Vercel (gratuito)

1. Acesse https://vercel.com e crie uma conta gratuita usando **"Continue
   with GitHub"** (mais simples — conecta direto).
2. No painel da Vercel, clique em **"Add New" → "Project"**.
3. Selecione o repositório `professor-ferrari-ia` e clique em **"Import"**.
4. Antes de clicar em "Deploy", abra a seção **"Environment Variables"**:
   - Name: `GEMINI_API_KEY`
   - Value: cole a chave que você copiou no Passo 1.
   - Clique em **"Add"**.
5. Clique em **"Deploy"**.
6. Espere ~1 minuto. A Vercel te dá um link tipo
   `https://professor-ferrari-ia.vercel.app` — esse já é o site no ar.

---

## Passo 5 — Testar

Abra o link gerado, digite uma pergunta de História e veja se responde.
Teste também enviar uma foto (ícone 📷) de um texto ou exercício.

Se aparecer erro "Chave da API não configurada" — volte ao Passo 4 e
confira se a variável `GEMINI_API_KEY` foi salva corretamente (às vezes é
preciso fazer "Redeploy" depois de adicionar a variável: vá em
**Deployments → ⋯ → Redeploy**).

---

## Como adicionar seus materiais (resumos, edital, autores)

Edite o arquivo `api/materiais.js` direto pelo GitHub:

1. No repositório, abra `api/materiais.js`.
2. Clique no ícone de lápis (editar).
3. Substitua o conteúdo de exemplo pelos seus resumos/tópicos reais.
4. Commit changes.

A Vercel publica a atualização automaticamente em ~1 minuto, sem precisar
repetir o Passo 4.

---

## Como dar um domínio próprio (opcional, depois)

Em **Vercel → seu projeto → Settings → Domains**, dá para conectar um
domínio que você já tenha (ex.: `tutor.professorferrari.com.br`). Isso
exige configurar DNS — se quiser, eu te explico esse passo quando chegar
a hora.

---

## Limites do plano gratuito — o que esperar

- O Gemini permite um número limitado de perguntas por dia de graça.
  Com poucas dezenas de alunos usando esporadicamente, deve sobrar.
  Em véspera de prova, com uso concentrado, pode bater no limite e o
  site passa a responder com erro temporariamente até resetar (meia-noite,
  horário da Califórnia).
- Se isso acontecer com frequência, o próximo passo é ativar cobrança na
  conta do Google (o uso do modelo Flash é barato — geralmente poucos
  reais por mês mesmo com uso intenso). Me avise quando chegar nesse
  ponto que eu te explico como habilitar sem susto de fatura.
- O toggle "Buscar na internet" usa a ferramenta de busca do Google — é
  recomendável deixar desligado por padrão e usar só quando necessário,
  porque pode consumir cota mais rápido.

---

## Se algo der errado

Me mande o link do site e, se possível, o que apareceu de erro na tela —
eu ajudo a diagnosticar.
