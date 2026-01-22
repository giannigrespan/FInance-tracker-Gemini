import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, TransactionType, SplitType } from "../types";

// Helper to get initialized client safely
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Parses a receipt image using Gemini 2.5 Flash Image Model.
 */
export const parseReceiptImage = async (base64Image: string): Promise<Partial<Transaction>> => {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("API Key is missing. Please configure your API_KEY.");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity
            },
          },
          {
            text: `Analyze this receipt image. Extract the merchant name, the total date (YYYY-MM-DD), and the total amount. 
                   Also infer the best category from this list: Food & Dining, Transportation, Utilities, Entertainment, Shopping, Health, Housing, Other.
                   Return JSON.`
          },
        ],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // Clean potential Markdown code blocks
    const cleanedText = text.replace(/```(?:json)?|```/g, '').trim();
    const data = JSON.parse(cleanedText);

    // Map string category to Enum
    let category = Category.OTHER;
    const catStr = data.category as string;
    
    // Simple matching logic
    if (Object.values(Category).includes(catStr as Category)) {
        category = catStr as Category;
    }

    return {
      merchant: data.merchant,
      date: data.date || new Date().toISOString().split('T')[0],
      amount: data.amount,
      category: category,
      type: TransactionType.EXPENSE,
      payer: 'ME', 
      splitType: SplitType.SHARED
    };

  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw error;
  }
};

/**
 * Generates financial advice based on transaction history using Gemini 3 Flash.
 */
export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  try {
    const ai = getAIClient();
    if (!ai) return "AI Configuration missing. Please set your API Key.";

    const summary = JSON.stringify(transactions.slice(0, 50)); // Limit context size

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a financial advisor for a couple. Here is a JSON list of recent family transactions: ${summary}.
                 Analyze the spending habits and who pays for what.
                 Provide 3 short, punchy, and actionable bullet points of advice to improve savings or split equity.
                 Format the output as Markdown.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster advice
      }
    });

    return response.text || "Could not generate advice at this time.";
  } catch (error) {
    console.error("Error generating advice:", error);
    return "Unable to generate advice currently. Please try again later.";
  }
};