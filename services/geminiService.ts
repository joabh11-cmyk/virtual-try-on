
import { GoogleGenAI } from "@google/genai";
import { UploadedImage } from "../types";

// Helper to remove the data URL prefix (e.g., "data:image/png;base64,")
const stripBase64Prefix = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

export const generateTryOnImage = async (
  userPhoto: UploadedImage,
  clothingPhoto: UploadedImage,
  userPrompt: string,
  apiKey?: string
): Promise<string> => {
  const activeKey = apiKey?.trim() || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    throw new Error("Chave de API não encontrada. Por favor, insira sua chave do Gemini.");
  }

  // Create a new instance right before the call to ensure the latest key is used
  const ai = new GoogleGenAI({ apiKey: activeKey });

  // Refined prompt for high-quality virtual try-on
  const systemInstruction = `
    TASK: High-Fidelity Virtual Try-On.
    INPUT 1 (User): A photo of a person.
    INPUT 2 (Clothing): A photo of a garment.
    
    INSTRUCTIONS:
    1. Generate a new photo of the EXACT SAME PERSON from Input 1.
    2. The person must be wearing the EXACT garment shown in Input 2.
    3. Maintain the person's pose, facial features, body shape, skin tone, and hair.
    4. Seamlessly integrate the garment onto the person's body with realistic folds, shadows, and lighting.
    5. Keep the background from Input 1 consistent.
    6. Ensure the result is fotorrealistic and looks like a professional fashion shoot.
  `;

  const finalPrompt = userPrompt 
    ? `${systemInstruction}\nADDITIONAL USER REQUESTS: ${userPrompt}`
    : systemInstruction;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: finalPrompt },
          {
            inlineData: {
              mimeType: userPhoto.mimeType,
              data: stripBase64Prefix(userPhoto.base64)
            }
          },
          {
            inlineData: {
              mimeType: clothingPhoto.mimeType,
              data: stripBase64Prefix(clothingPhoto.base64)
            }
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Ideal for fashion/portraits
          imageSize: "1K"
        }
      }
    });

    let generatedImageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break; 
        }
      }
    }

    if (!generatedImageUrl) {
      const textOutput = response.text || "The model could not generate the image. It might be due to safety filters or lack of clear subjects.";
      throw new Error(textOutput);
    }

    return generatedImageUrl;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Standard error for missing/invalid key in some contexts
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error(error.message || "Failed to generate image.");
  }
};
