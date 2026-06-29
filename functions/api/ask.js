export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  try {
    const body = await request.json();
    const prompt = body && body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt invalido ou ausente." }), { status: 400, headers });
    }
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "A chave GEMINI_API_KEY nao foi configurada na Cloudflare." }), { status: 500, headers });
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const systemInstruction = `Voce e o Bibliotecario Juridico Virtual do acervo fisico da biblioteca.
Seu papel e responder duvidas de usuarios sobre localizacao de livros com extrema precisao, educacao e clareza tecnica.
Regras rigidas:
1. NUNCA invente livros, codigos, autores ou localizacoes. Use SOMENTE as obras listadas no contexto fornecido. Se a obra pedida nao constar, responda educadamente que ela nao consta no mapeamento atual.
2. Formate suas respostas usando Markdown de forma elegante (use negritos, listas e tabelas se necessario).
3. Sempre que indicar uma localizacao, coloque em destaque visual (ex: "**Estante A, Prateleira 2**").
4. Mantenha respostas diretas, uteis e profissionais.`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.1, maxOutputTokens: 1200 }
      })
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      return new Response(JSON.stringify({ error: "Erro na API Gemini", detail: errorText }), { status: 502, headers });
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Nao foi possivel gerar uma resposta.";
    return new Response(JSON.stringify({ text }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor.", message: e.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
