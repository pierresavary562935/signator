import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { requiredCurrentUser } from "@/lib/current-user";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

// GET /admin/document/:id/metadata (returns total page of the document and positions)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requiredCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: id as string },
    include: { fieldPositions: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Load existing PDF
  const filePath = path.join(
    process.cwd(),
    "private/documents",
    document.filePath
  );
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const existingPdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();

  return NextResponse.json({
    totalPage: pages.length,
    positions: document.fieldPositions,
  });
}
