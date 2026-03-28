import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAgriAdvice(prompt: string, history: { role: string, parts: { text: string }[] }[] = []) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are an expert agricultural assistant named AgriBot. You help farmers with crop management, pest control, irrigation, and weather-related advice. Keep your answers practical, concise, and helpful. Use a friendly and professional tone.",
    },
  });

  const response = await model;
  return response.text;
}

export async function textToSpeech(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/wav;base64,${base64Audio}`;
  }
  return null;
}
