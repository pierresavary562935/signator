import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { requiredCurrentUser } from "@/lib/current-user";

// Type for the positions object coming from client
interface PositionsData {
  [page: string]: {
    [fieldName: string]: { x: number; y: number };
  };
}

// POST /admin/document/:id/fields (saves field positions for a document)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requiredCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;

  // Get positions, pdfWidth and pdfHeight
  const {
    positions,
    pdfWidth,
    pdfHeight,
  }: { positions: PositionsData; pdfWidth: number; pdfHeight: number } =
    await req.json();

  // Ensure the document exists
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 }
    );
  }

  // Delete existing positions before inserting new ones
  await prisma.documentFieldPosition.deleteMany({
    where: { documentId: id },
  });

  // Only proceed if we have valid positions data
  if (!positions || typeof positions !== "object") {
    return NextResponse.json(
      { message: "Invalid positions data provided" },
      { status: 400 }
    );
  }

  // Create entries for database
  const entries = Object.entries(positions).flatMap(([page, fields]) => {
    if (!fields || typeof fields !== "object") return [];

    return Object.entries(fields).map(([fieldName, position]) => ({
      documentId: id,
      pageNumber: parseInt(page, 10),
      fieldName,
      pdfWidth,
      pdfHeight,
      x: position.x,
      y: position.y,
    }));
  });

  if (entries.length > 0) {
    await prisma.documentFieldPosition.createMany({ data: entries });
  }

  return NextResponse.json({
    message: "Field positions saved successfully",
    count: entries.length,
  });
}
