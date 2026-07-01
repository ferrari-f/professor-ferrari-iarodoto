// Salva novos trechos direto no arquivo api/knowledge.json do GitHub,
// somando ao que já existe (busca a versão atual antes de gravar, então
// sempre funciona mesmo que outra pessoa tenha atualizado nesse meio tempo).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  const { adminPassword, chunks } = req.body || {};

  if (process.env.ADMIN_PASSWORD && adminPassword !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Senha de administrador incorreta." });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // formato: "usuario/repositorio"
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    res.status(500).json({
      error: "Variáveis GITHUB_TOKEN e/ou GITHUB_REPO não configuradas no servidor.",
    });
    return;
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    res.status(400).json({ error: "Nenhum trecho para salvar." });
    return;
  }

  const path = "api/knowledge.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  try {
    // 1. Busca a versão atual do arquivo no GitHub
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (!getRes.ok) {
      const errText = await getRes.text();
      throw new Error(`Não consegui ler o arquivo atual no GitHub (${getRes.status}): ${errText}`);
    }
    const getData = await getRes.json();
    const currentContent = Buffer.from(getData.content, "base64").toString("utf-8");
    let current = [];
    try {
      current = JSON.parse(currentContent);
      if (!Array.isArray(current)) current = [];
    } catch (e) {
      current = [];
    }

    // 2. Soma os trechos novos, renumerando os IDs para não colidir
    const merged = current.concat(
      chunks.map((c, idx) => ({
        id: `chunk_${current.length + idx}`,
        source: c.source,
        text: c.text,
        embedding: c.embedding,
      }))
    );

    // 3. Grava a nova versão no GitHub (isso cria um commit e publica sozinho)
    const newContentB64 = Buffer.from(JSON.stringify(merged)).toString("base64");
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Atualiza base de conhecimento (+${chunks.length} trechos, total ${merged.length})`,
        content: newContentB64,
        sha: getData.sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`Não consegui salvar no GitHub (${putRes.status}): ${errText}`);
    }

    res.status(200).json({ success: true, totalChunks: merged.length, newChunks: chunks.length });
  } catch (err) {
    console.error("Erro save-knowledge:", err);
    res.status(500).json({ error: err.message || "Erro ao salvar no GitHub." });
  }
}
