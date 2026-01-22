import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, TransactionType, SplitType } from "../types";

// Initialize Gemini Client
// NOTE: API Key must be provided in the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses a receipt image using Gemini 2.5 Flash Image Model.
 */
export const parseReceiptImage = async (base64Image: string): Promise<Partial<Transaction>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity, can be dynamic
            },
          },
          {
            text: `Analyze this receipt image. Extract the merchant name, the total date (YYYY-MM-DD), and the total amount. 
                   Also infer the best category from this list: Food & Dining, Transportation, Utilities, Entertainment, Shopping, Health, Housing, Other.
                   Return JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

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
      type: TransactionType.EXPENSE, // Receipts are usually expenses
      payer: 'ME', // Default assumption
      splitType: SplitType.SHARED // Default assumption
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
    return "AI Advisor is currently unavailable. Please check your API Key.";
  }
};