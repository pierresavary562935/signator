import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { prisma } from "@/prisma";
import PDFParser from "pdf2json";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// PDF parsing function
const pdfParse = async (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) => {
      console.error("PDF parsing error:", errData);
      reject(errData);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      // Extract text from all pages
      const extractedText = pdfData.Pages.map((page) =>
        page.Texts.map((textObj) => decodeURIComponent(textObj.R[0].T)).join(
          " "
        )
      ).join("\n\n");

      resolve(extractedText);
    });

    pdfParser.parseBuffer(fileBuffer);
  });
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    // Parse request body to get AI options
    const options = await req.json();

    // Set defaults if not provided
    const {
      model = "gpt-4",
      maxTokens = 300,
      customPrompt = false,
      promptText = "Summarize the following document:",
      outputType = "summary",
      bulletPoints = false,
      highlightKeyPoints = false,
    } = options;

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing document ID" },
        { status: 400 }
      );
    }

    // Fetch document from DB
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Secure document storage path
    const filePath = path.join(
      process.cwd(),
      "private/documents",
      document.filePath
    );

    if (!fs.existsSync(filePath)) {
      console.error(`File not found at: ${filePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Extract text from PDF
    const fileBuffer = fs.readFileSync(filePath);
    const extractedText = await pdfParse(fileBuffer);

    if (!extractedText) {
      return NextResponse.json(
        { error: "Unable to extract text" },
        { status: 500 }
      );
    }

    // Build the system prompt based on options
    let systemPrompt = customPrompt
      ? promptText
      : "Summarize the following document:";

    // Add formatting instructions based on options
    if (outputType === "executive") {
      systemPrompt =
        "Create an executive summary of the following document for busy professionals:";
    } else if (outputType === "technical") {
      systemPrompt =
        "Create a technical summary of the following document, focusing on technical details, specifications and methodology:";
    } else if (outputType === "key-points") {
      systemPrompt =
        "Extract the most important key points from the following document:";
    }

    // Add formatting options
    if (bulletPoints) {
      systemPrompt += " Format the output as bullet points.";
    }

    if (highlightKeyPoints) {
      systemPrompt +=
        " Highlight key terms or important concepts by adding bold formatting using markdown.";
    }

    // Generate new AI summary with OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: extractedText,
        },
      ],
      max_tokens: maxTokens,
    });

    const newSummary =
      completion.choices[0].message.content || "Summary unavailable.";

    // Save new summary in the database
    await prisma.document.update({
      where: { id: documentId },
      data: { summary: newSummary },
    });

    return NextResponse.json({ summary: newSummary });
  } catch (error) {
    console.error("Error regenerating document summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
