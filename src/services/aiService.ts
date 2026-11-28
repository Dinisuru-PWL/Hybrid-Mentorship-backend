import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are DevCraft AI Mentor, an expert MERN stack (MongoDB, Express.js, React.js, Node.js) coding mentor for university software engineering students.
Keep your answers clear, practical, concise, and beginner-friendly.
Provide step-by-step debugging guidance, explain why an error happens, and include short code snippets when helpful.`;

export async function generateMentorReply(prompt: string): Promise<{
  reply: string;
  provider: 'gemini' | 'fallback';
}> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return {
      provider: 'fallback',
      reply: `Here is a quick breakdown for "${prompt}":\n\n1. Check your component props/state or Express route handler parameters.\n2. Verify your API request URL and JSON payload in the Network tab.\n3. Add GEMINI_API_KEY to devcraft-backend/.env to enable live Gemini AI responses.\n4. If you're still stuck, click "Find Mentors" for a 1:1 session.`,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return {
    provider: 'gemini',
    reply: text || 'No response generated. Please try rephrasing your question.',
  };
}
