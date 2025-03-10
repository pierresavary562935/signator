import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { requiredCurrentUser } from "@/lib/current-user";
import fs from "fs";
import path from "path";

// GET /document/:id (returns a document)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requiredCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch document from the database
  const document = await prisma.document.findUnique({
    where: { id: id },
  });

  if (!document) {
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 }
    );
  }

  if (user.role !== "ADMIN") {
    // check if the user has access to the document
    const signingRequest = await prisma.signingRequest.findFirst({
      where: {
        documentId: document.id,
        userId: user.id,
      },
    });

    if (!signingRequest) {
      return NextResponse.json(
        { message: "You don't have access to this document" },
        { status: 403 }
      );
    }
  }

  // secure file path
  const sanitizedFileName = path.basename(document.filePath);
  const documentsDirectory = path.join(process.cwd(), "private/documents");

  const filePath = path.join(documentsDirectory, sanitizedFileName);

  // check if the filepath is in the documents directory
  if (!filePath.startsWith(documentsDirectory)) {
    console.error("Security violation: Attempted path traversal", {
      originalPath: document.filePath,
      sanitizedPath: filePath,
    });
    return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${document.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { message: "Error reading file" },
      { status: 500 }
    );
  }
}
