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
      reject(errData);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      // Extract text from all pages
      const extractedText = pdfData.Pages.map((page) =>
        page.Texts.map((textObj) => decodeURIComponent(textObj.R[0].T)) // Decode URI encoded text
          .join(" ")
      ).join("\n\n"); // Join pages with spacing

      resolve(extractedText);
    });

    pdfParser.parseBuffer(fileBuffer);
  });
};

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing document ID" },
        { status: 400 }
      );
    }

    // Fetch document details from DB
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.summary) {
      return NextResponse.json({ summary: document.summary });
    }

    // Ensure the path is correctly prefixed
    const filePath = path.join(
      process.cwd(),
      "private/documents",
      document.filePath
    ); // Secure path

    if (!fs.existsSync(filePath)) {
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

    // Summarize with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Summarize the following document:\n\n${extractedText}`,
        },
      ],
      max_tokens: 300,
    });

    const summary =
      completion.choices[0].message.content || "Summary unavailable.";

    // save the summary to the database
    await prisma.document.update({
      where: { id: documentId },
      data: { summary },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating document summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
