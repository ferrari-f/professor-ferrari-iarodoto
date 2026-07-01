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

  const { fileBase64, mimeType, adminPassword } = req.body || {};

  if (process.env.ADMIN_PASSWORD && adminPassword !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Senha de administrador incorreta." });
    return;
  }

  if (!fileBase64) {
    res.status(400).json({ error: "Nenhum arquivo enviado." });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Transcreva TODO o texto deste documento, na íntegra, preservando títulos, " +
                "parágrafos e listas. Não resuma, não comente, não adicione nada além do " +
                "texto transcrito.",
            },
            { inlineData: { mimeType: mimeType || "application/pdf", data: fileBase64 } },
          ],
        },
      ],
    });
    res.status(200).json({ text: response.text });
  } catch (err) {
    console.error("Erro extract:", err);
    res.status(500).json({ error: "Erro ao ler o arquivo. Se for muito grande, tente dividir em partes menores." });
  }
}
