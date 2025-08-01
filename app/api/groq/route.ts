// /app/api/groq/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Check if environment variables are set
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not set");
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { message, type = "reply" } = await req.json();

    const prompt =
      type === "summary"
        ? `
You are a compassionate mental health assistant.
Analyze the following conversation history and summarize the user's emotional state and behavior in 3-4 sentences.
Use clear, non-technical, and supportive language.
Here is the message history:
${message}
`
        : `
Act as a compassionate mental health assistant. Given a user's message, provide:
- A thoughtful response
- A brief emotional analysis of the user's state

Respond in this JSON format:
{
  "response": "<your reply>",
  "emotional_analysis": "<your brief analysis>"
}
`;

    const messages = [
      { role: "system", content: prompt },
      ...(type === "reply" ? [{ role: "user", content: message }] : []),
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
        messages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Groq API error:", data);
      return NextResponse.json({ error: `Groq API error: ${data.error?.message || 'Unknown error'}` }, { status: res.status });
    }

    if (type === "summary") {
      const summary = data.choices?.[0]?.message?.content;
      return NextResponse.json({ summary });
    }

    const rawContent = data.choices?.[0]?.message?.content ?? "";
    
    // Try to parse as JSON first
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // If JSON parsing fails, treat as plain text response
      console.log("Groq response is not JSON, treating as plain text:", rawContent);
      return NextResponse.json({
        response: rawContent,
        emotional_analysis: "Unable to analyze emotions from this response format.",
      });
    }
    
    // Validate the parsed response has required fields
    if (!parsed.response) {
      console.error("Groq response missing 'response' field:", parsed);
      return NextResponse.json({ error: "Invalid response format from Groq - missing response field" }, { status: 500 });
    }
    
    return NextResponse.json({
      response: parsed.response,
      emotional_analysis: parsed.emotional_analysis || "No emotional analysis available.",
    });
  } catch (err) {
    console.error("Groq error:", err);
    return NextResponse.json({ error: "Groq request failed" }, { status: 500 });
  }
}
