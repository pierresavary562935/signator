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

  // Fetch document from the database
  const document = await prisma.document.findUnique({
    where: { id: params.id },
  });

  if (!document) {
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 }
    );
  }

  // Check if the user is the owner or has admin access
  if (document.ownerId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
