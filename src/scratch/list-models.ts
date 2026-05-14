import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

async function listModels() {
  // Đọc file .env thủ công
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  const apiKey = match ? match[1].trim() : null;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    console.log("Available models:");
    if (data.models) {
      data.models.forEach((m: any) => {
        console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(", ")})`);
      });
    } else {
      console.log("No models found. Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
