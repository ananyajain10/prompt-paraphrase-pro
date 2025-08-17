import { GoogleGenerativeAI } from "@google/generative-ai";

const systemInstructions = `
Act as an expert data understanding assistant.
- Summarize only based on the provided text.
- Do not add extra information.
- If insufficient data is provided, say "insufficient data".
`;

export async function analyzePitchDeckWithGemini(
  text: string,
  prompt: string
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_DEMO_KEY as string;
    if (!apiKey) {
      throw new Error("Missing Gemini API key in VITE_GEMINI_DEMO_KEY");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: systemInstructions,
      generationConfig: {
        temperature: 0.4,
      },
    });

    const result = await model.generateContent(`${prompt}\n\n${text}`);
    
    return result.response.text();
  } catch (error) {
    console.error("Gemini summarization error:", error);
    throw new Error("Failed to generate summary with Gemini.");
  }
}
