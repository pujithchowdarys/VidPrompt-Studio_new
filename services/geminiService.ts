
import { GoogleGenAI, Type } from "@google/genai";
import { Scene, Language } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const sceneSchema = {
    type: Type.OBJECT,
    properties: {
        startTime: {
            type: Type.STRING,
            description: "The start time of the scene in HH:MM:SS format.",
        },
        endTime: {
            type: Type.STRING,
            description: "The end time of the scene in HH:MM:SS format.",
        },
        narration: {
            type: Type.STRING,
            description: "The generated narration script for this scene.",
        },
    },
    required: ["startTime", "endTime", "narration"],
};

const responseSchema = {
    type: Type.ARRAY,
    items: sceneSchema,
};

export const generateScriptAndTimestamps = async (
  prompt: string,
  language: Language,
  fileName: string,
): Promise<Scene[]> => {
  try {
    const fullPrompt = `
      You are an expert video editor and scriptwriter.
      Your task is to analyze the user's request for the video file titled "${fileName}" and generate a sequence of scenes with narration.
      The user's request is: "${prompt}".
      The narration should be in the following language(s): ${language}.
      
      Based on the prompt, identify the key moments and create a compelling narrative.
      For each scene you identify, provide a start time, an end time, and a script for narration.
      The output must be a valid JSON array of scene objects, adhering to the provided schema.
      Ensure the timestamps are in HH:MM:SS format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const scenes = JSON.parse(jsonString);
    
    // Basic validation
    if (!Array.isArray(scenes)) {
        throw new Error("API did not return an array.");
    }
    scenes.forEach(scene => {
        if (!scene.startTime || !scene.endTime || !scene.narration) {
            throw new Error("Invalid scene object received from API.");
        }
    });

    return scenes as Scene[];
  } catch (error) {
    console.error("Error generating script from Gemini:", error);
    throw new Error("Failed to generate script. Please check your prompt and try again.");
  }
};
