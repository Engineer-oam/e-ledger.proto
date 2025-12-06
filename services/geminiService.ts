import { GoogleGenAI } from "@google/genai";
import { LedgerService } from "./ledgerService";

// Helper to get the AI instance safely across different build environments
const getAI = () => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  analyzeLedger: async (userQuery: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "AI services are currently unavailable. Please check your API key configuration.";

    const ledgerData = LedgerService.getAllDataAsJson();

    const systemPrompt = `
      You are an expert State Excise Audit AI for the "ExciseLedger" blockchain system.
      Your goal is to assist Excise Officers, Distilleries, and Retailers by analyzing the liquor supply chain ledger.
      
      Here is the current Ledger Data (JSON):
      ${ledgerData}

      Rules:
      1. Answer the user's question based strictly on the provided JSON data.
      2. If asked about "Duty", check the 'dutyPaid' boolean field. Identify illicit/bonded stock.
      3. If asked about Volume, sum up quantity * unit.
      4. Highlight any "QUARANTINED" or "SEIZED" batches immediately.
      5. Keep answers professional, concise, and helpful for enforcement or compliance.
      6. Do not invent data not present in the JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + "\n\nUser Question: " + userQuery }]
          }
        ]
      });

      return response.text || "I could not generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I encountered an error analyzing the ledger. Please try again later.";
    }
  }
};