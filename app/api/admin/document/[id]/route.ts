import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { PDFDocument } from "pdf-lib";

// DELETE /admin/document/:id (deletes a document)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized, you are not the owner" },
      { status: 403 }
    );
  }

  // Delete file from private storage
  const filePath = path.join(
    process.cwd(),
    "private/documents",
    document.filePath
  );
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove document from database
  await prisma.document.delete({ where: { id: document.id } });

  return NextResponse.json({ message: "Document deleted" });
}

// GET /admin/document/:id?page=1 (returns a single page of the document)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requiredCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;
  const url = new URL(req.url);
  const pageNumber = parseInt(url.searchParams.get("page") || "1", 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return NextResponse.json(
      { message: "Invalid page number" },
      { status: 400 }
    );
  }

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

  const filePath = path.join(
    process.cwd(),
    "private/documents",
    document.filePath
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);

    // Load the full PDF
    const pdfDoc = await PDFDocument.load(fileBuffer);

    if (pageNumber > pdfDoc.getPageCount()) {
      return NextResponse.json(
        { message: "Page number out of range" },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNumber - 1]); // `pageNumber - 1` because index is 0-based
    newPdf.addPage(copiedPage);

    // Serialize the new PDF to a buffer
    const newPdfBytes = await newPdf.save();

    return new NextResponse(newPdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="page-${pageNumber}-${document.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { message: "Failed to process document" },
      { status: 500 }
    );
  }
}

// PATCH /admin/document/:id (sets document status to "READY")
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requiredCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Missing document ID" },
        { status: 400 }
      );
    }

    // Ensure document exists
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    if (document.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized, you are not the owner" },
        { status: 403 }
      );
    }

    // Update the document status to "ready"
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { status: "READY" },
    });

    return NextResponse.json({
      message: "Document status updated to READY",
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    return NextResponse.json(
      { message: "Failed to update status" },
      { status: 500 }
    );
  }
}
