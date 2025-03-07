import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

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
