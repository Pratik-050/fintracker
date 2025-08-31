import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Schema for structured output from receipt processing
const receiptDataSchema = z.object({
  amount: z.number().positive().describe("The total amount from the receipt"),
  date: z.string().describe("The date of the transaction in YYYY-MM-DD format"),
  merchant: z.string().describe("The merchant or business name"),
  category: z
    .string()
    .describe(
      "The most appropriate expense category (e.g., Food, Transportation, Shopping, Bills, Healthcare, Entertainment, etc.)",
    ),
  type: z
    .enum(["income", "expense"])
    .describe("Whether this is an income or expense transaction"),
  description: z
    .string()
    .optional()
    .describe("Additional description or notes about the transaction"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score for the extraction accuracy"),
});

type ReceiptData = z.infer<typeof receiptDataSchema>;

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Receipt processing started");

    // Check if GEMINI_API_KEY exists
    if (!env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "API configuration error: Missing GEMINI_API_KEY" },
        { status: 500 },
      );
    }

    // Check authentication
    console.log("🔐 Checking authentication...");
    const session = await auth();
    if (!session?.user) {
      console.log("❌ No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("✅ User authenticated:", session.user.id);

    // Get the uploaded file
    console.log("📁 Processing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ No file found in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📄 File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type
    if (!file.type.includes("pdf") && !file.type.startsWith("image/")) {
      console.log("❌ Invalid file type:", file.type);
      return NextResponse.json(
        { error: "File must be a PDF or image" },
        { status: 400 },
      );
    }

    let extractedText = "";

    // Extract text based on file type
    if (file.type.includes("pdf")) {
      const buffer = await file.arrayBuffer();
      try {
        // Dynamic import to avoid module initialization issues
        const pdfParse = (await import("pdf-parse")).default as (
          buffer: Buffer,
        ) => Promise<{ text: string }>;
        const data = await pdfParse(Buffer.from(buffer));
        extractedText = (data as { text: string }).text ?? "";
        console.log("📄 PDF text extracted, length:", extractedText.length);
      } catch (error) {
        console.error("PDF parsing error:", error);
        throw new Error("Failed to extract text from PDF");
      }
    } else if (file.type.startsWith("image/")) {
      // For images, we'll let Gemini process them directly
      extractedText = ""; // Will use vision capabilities
      console.log("📸 Image file detected, will use Gemini Vision");
    }

    // Initialize Gemini AI with JSON response mode
    console.log("🤖 Initializing Gemini AI...");
    let result: ReceiptData;

    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      console.log("✅ Gemini AI initialized successfully");

      if (file.type.startsWith("image/")) {
        // Process image directly with Gemini Vision
        const imageBuffer = await file.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        const prompt = `
        Analyze this receipt image and extract transaction information with high accuracy.
        
        Instructions:
        - Extract the TOTAL amount (not individual items), convert to number without currency symbols
        - Extract the transaction date and convert to YYYY-MM-DD format
        - Identify the merchant/business name clearly
        - Categorize as one of: Food, Transportation, Shopping, Bills, Healthcare, Entertainment, Travel, Education, Other
        - Determine if this is "income" or "expense" (receipts are typically expenses)
        - Provide a brief description of what was purchased/transaction purpose
        - Rate your confidence in extraction accuracy from 0.0 to 1.0
        
        Focus on accuracy over speed. If information is unclear, indicate lower confidence.
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "amount": number,
          "date": "YYYY-MM-DD",
          "merchant": "string",
          "category": "string", 
          "type": "expense",
          "description": "string",
          "confidence": number
        }
      `;

        console.log("📸 Processing image with Gemini Vision...");
        const response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: file.type,
            },
          },
        ]);

        const responseText = response.response.text();
        console.log("🔍 Gemini response received, parsing JSON...");
        console.log("Raw response:", responseText.substring(0, 200) + "...");

        const parsedData = JSON.parse(responseText) as unknown;
        result = receiptDataSchema.parse(parsedData);
        console.log("✅ Data successfully parsed and validated");
      } else {
        // Process PDF text with Gemini
        const prompt = `
        Analyze this receipt text and extract transaction information with high accuracy.
        
        Instructions:
        - Extract the TOTAL amount (not individual items), convert to number without currency symbols
        - Extract the transaction date and convert to YYYY-MM-DD format  
        - Identify the merchant/business name clearly
        - Categorize as one of: Food, Transportation, Shopping, Bills, Healthcare, Entertainment, Travel, Education, Other
        - Determine if this is "income" or "expense" (receipts are typically expenses)
        - Provide a brief description of what was purchased/transaction purpose
        - Rate your confidence in extraction accuracy from 0.0 to 1.0
        
        Focus on accuracy over speed. If information is unclear, indicate lower confidence.

        Return ONLY a valid JSON object with this exact structure:
        {
          "amount": number,
          "date": "YYYY-MM-DD",
          "merchant": "string",
          "category": "string",
          "type": "expense", 
          "description": "string",
          "confidence": number
        }

        Receipt text:
        ${extractedText}
      `;

        console.log("📄 Processing PDF with Gemini...");
        const response = await model.generateContent(prompt);
        const responseText = response.response.text();
        console.log("🔍 Gemini response received, parsing JSON...");
        console.log("Raw response:", responseText.substring(0, 200) + "...");

        const parsedData = JSON.parse(responseText) as unknown;
        result = receiptDataSchema.parse(parsedData);
        console.log("✅ Data successfully parsed and validated");
      }
    } catch (geminiError) {
      console.error("❌ Gemini API error:", geminiError);
      return NextResponse.json(
        {
          error: "AI processing failed",
          details:
            geminiError instanceof Error
              ? geminiError.message
              : "Unknown AI error",
        },
        { status: 500 },
      );
    }

    // Save transaction to database
    console.log("💾 Saving transaction to database...");
    const transaction = await db.transaction.create({
      data: {
        type: result.type,
        category: result.category,
        amount: result.amount,
        description: result.description,
        date: new Date(result.date),
        userId: session.user.id,
      },
    });
    console.log("✅ Transaction saved with ID:", transaction.id);

    return NextResponse.json({
      success: true,
      data: result,
      transaction: {
        id: transaction.id,
        message: "Transaction saved successfully!",
      },
    });
  } catch (error) {
    console.error("❌ Receipt processing error:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to process receipt",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
