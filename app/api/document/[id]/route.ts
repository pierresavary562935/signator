import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { requiredCurrentUser } from "@/lib/current-user";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const filePath = path.join(
    process.cwd(),
    "private/documents",
    document.filePath
  ); // Secure path

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      // "Content-Disposition": `attachment; filename="${document.filename}"`,
      "Content-Disposition": `inline; filename="${document.filename}"`,
    },
  });
}
