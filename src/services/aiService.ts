import { GoogleGenAI } from "@google/genai";
import type { Employee } from "../types/types";

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your environment variables (e.g. .env file) before starting the app."
    );
  }
  return apiKey;
}

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const aiService = {
  async queryEmployees(query: string, employees: Employee[]) {
    try {
      // Prepare context from employees
      const employeeContext = employees.map(e => ({
        id: e.id,
        name: `${e.firstName} ${e.middleName ? e.middleName + ' ' : ''}${e.surname}`,
        department: e.department,
        position: e.position,
        sex: e.sex,
        dob: e.dateOfBirth,
        hireDate: e.employmentDate
      }));

      const systemInstruction = `
        You are the NMC-HR AI Assistant. You have access to the following employee database:
        ${JSON.stringify(employeeContext, null, 2)}
        
        Rules:
        1. Answer the user's query clearly and concisely based ONLY on the provided data.
        2. If asking for a list, use a markdown table.
        3. For retirement eligibility, assume retirement age is 60.
        4. If the information is not in the database, say you don't have that record.
        5. Provide a summary if appropriate.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // Low temperature for factual consistency
        },
      });

      return response.text || "No response generated.";
    } catch (error) {
      console.error("AI Query Error:", error);
      return "I'm sorry, I encountered an error while processing your request. Please check your API key or try again later.";
    }
  }
};
