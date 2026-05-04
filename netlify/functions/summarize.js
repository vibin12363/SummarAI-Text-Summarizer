exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { text, mode } = JSON.parse(event.body);

    if (!text || !mode) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing text or mode" }) };
    }

    if (text.length > 15000) {
      return { statusCode: 400, body: JSON.stringify({ error: "Text too long. Please keep it under 15,000 characters." }) };
    }

    const prompts = {
      concise: `Summarize the following text in 2-3 clear, concise sentences. Capture the most important information only.\n\nText:\n${text}`,
      bullets: `Summarize the following text as a list of bullet points (use • as bullet symbol). Extract the key points, facts, or ideas. Aim for 4-7 bullets.\n\nText:\n${text}`,
      detailed: `Write a detailed summary of the following text in 2-3 paragraphs. Cover all major points, supporting details, and conclusions.\n\nText:\n${text}`,
      eli5: `Explain the following text in very simple language, as if explaining to a 10-year-old. Use simple words, short sentences, and a friendly tone.\n\nText:\n${text}`
    };

    if (!prompts[mode]) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid mode" }) };
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompts[mode] }],
        max_tokens: 1024,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Groq API error");
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ summary })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Something went wrong" })
    };
  }
};