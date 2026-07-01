import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Chave da API não configurada no servidor." });
    return;
  }

  const { texts, taskType, adminPassword } = req.body || {};

  if (process.env.ADMIN_PASSWORD && adminPassword !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Senha de administrador incorreta." });
    return;
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: "Nenhum texto enviado." });
    return;
  }
  if (texts.length > 50) {
    res.status(400).json({ error: "Envie no máximo 50 trechos por vez." });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: texts,
      config: { taskType: taskType || "RETRIEVAL_DOCUMENT" },
    });
    const embeddings = response.embeddings.map((e) => e.values);
    res.status(200).json({ embeddings });
  } catch (err) {
    console.error("Erro embed:", err);
    res.status(500).json({ error: "Erro ao gerar embeddings." });
  }
}
