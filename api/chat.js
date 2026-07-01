import { GoogleGenAI } from "@google/genai";
import { MATERIAIS } from "./materiais.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let knowledgeBase = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, "knowledge.json"), "utf-8");
  knowledgeBase = JSON.parse(raw);
} catch (e) {
  knowledgeBase = [];
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function retrieveRelevantChunks(queryEmbedding, topK = 5) {
  if (!knowledgeBase.length) return [];
  const scored = knowledgeBase.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

const SYSTEM_INSTRUCTION = `
Você é o "Professor Ferrari", professor de História, Filosofia e Sociologia,
especializado em preparar alunos (17-25 anos) para o vestibular da UFPR e o ENEM.

REGRAS DE ESTILO — sem exceção:
- Rigor acadêmico acima de simpatia. Corrija erros conceituais de forma direta, sem suavizar.
- Diferencie sempre fonte primária de interpretação historiográfica.
- Cite autores e obras específicas quando pertinente (ex.: "conforme Hobsbawm, em A Era dos Extremos...").
- Estilo factual, simpático, conciso e conceitualmente denso.
- PROIBIDO usar: "fascinante", "incrível", "revolucionário" (fora de contexto histórico técnico),
  "jornada", "mergulho profundo", perguntas retóricas, exclamações, introduções prolixas.
- Demonstre a relevância de um tema com dados, consequências demográficas, tratados ou mudanças
  estruturais — nunca com adjetivos qualitativos.
- Se o aluno enviar uma foto de texto ou exercício, transcreva o conteúdo relevante antes de comentar.
- Use a ferramenta de busca apenas quando a pergunta exigir dado atual, estatística específica
  ou verificação factual que vá além do conhecimento histórico consolidado.

MATERIAL DE REFERÊNCIA DO PROFESSOR (priorize isso sobre conhecimento genérico quando houver conflito):
${MATERIAIS}
`;

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

  const { message, imageBase64, imageMimeType, history = [], useSearch = false } = req.body || {};

  if (!message && !imageBase64) {
    res.status(400).json({ error: "Mensagem vazia." });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let retrievedContext = "";
    if (message && knowledgeBase.length > 0) {
      try {
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: message,
          config: { taskType: "RETRIEVAL_QUERY" },
        });
        const queryEmbedding = embedRes.embeddings[0].values;
        const topChunks = retrieveRelevantChunks(queryEmbedding, 5);
        if (topChunks.length) {
          retrievedContext = topChunks
            .map((c) => `[Fonte: ${c.source}]\n${c.text}`)
            .join("\n\n---\n\n");
        }
      } catch (e) {
        console.error("Erro na busca no material:", e);
        // segue sem contexto recuperado — não interrompe a conversa
      }
    }

    const parts = [];
    if (message) parts.push({ text: message });
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: imageBase64,
        },
      });
    }

    // Limita o histórico enviado para conter custo (últimas 10 trocas)
    const trimmedHistory = history.slice(-20);

    const contents = [...trimmedHistory, { role: "user", parts }];

    const config = {
      systemInstruction:
        SYSTEM_INSTRUCTION +
        (retrievedContext
          ? `\n\nTRECHOS RELEVANTES DO MATERIAL DO PROFESSOR PARA ESTA PERGUNTA (priorize isso):\n${retrievedContext}`
          : ""),
    };
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config,
    });

    res.status(200).json({ text: response.text });
  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ error: "Erro ao consultar a IA. Tente novamente em instantes." });
  }
}
