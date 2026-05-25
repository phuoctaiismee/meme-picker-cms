import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing or invalid file upload." }, { status: 400 });
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only image and video uploads are supported for analysis." }, { status: 400 });
    }

    console.log(`[API Analyze] Uploaded file name: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // If it's a video, we currently can't easily analyze raw frames in a simple serverless call without complex transcoding.
    // In a real system, we'd extract a frame. For now, we'll let Gemini handle the image directly.
    if (file.type.startsWith("video/")) {
      return NextResponse.json({
        title: file.name.substring(0, file.name.lastIndexOf(".")) || "Uploaded Video",
        ocr_content: "",
        tags: [{ name: "Video", slug: "video" }]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for fast and cheap multimodal analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Read file as ArrayBuffer and convert to Base64
    const fileBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString("base64");

    const prompt = `
      You are an expert meme metadata extractor and tagger.
      Analyze the provided meme image and output a JSON object containing:
      1. "title": A descriptive, catchy Vietnamese title, optionally suffixing a clean English translation after a hyphen (e.g., "Con mèo giận dữ - Angry Cat"). Keep it under 60 characters.
      2. "ocr_content": Extract any text printed inside the meme image accurately. If there is NO text inside the image (e.g., it is a blank meme template), write a detailed, highly searchable Vietnamese description of the visual scene, actions, characters, or expressions in the image (e.g. "Một người đàn ông đang ngước nhìn lên trời với vẻ mặt ngạc nhiên hoặc hoảng hốt"). This ensures the meme template remains fully searchable by its visual content.
      3. "tags": An array of 3-5 tags. Each tag should be an object with "name" (capitalized, e.g., "Mèo") and "slug" (slugified English, lowercase, e.g., "cat").

      Format the output strictly as a JSON object, with no markdown formatting tags like \`\`\`json or similar.
      Example output:
      {
        "title": "Mèo tức giận - Angry Cat",
        "ocr_content": "Shut up",
        "tags": [
          {"name": "Mèo", "slug": "cat"},
          {"name": "Giận dữ", "slug": "angry"},
          {"name": "Hài hước", "slug": "funny"}
        ]
      }
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type
      }
    };

    console.log("[API Analyze] Dispatching multimodal request to Gemini 2.5 Flash...");
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("[API Analyze] Raw response from Gemini:", responseText);

    // Clean JSON format in case Gemini wrapped it in markdown code blocks
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const metadata = JSON.parse(cleanedText);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("[API Analyze] Analysis error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze meme image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
