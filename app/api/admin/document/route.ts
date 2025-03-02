import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// get documents from db
export async function GET() {
  // check if user is authenticated and admin
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const documents = await prisma.document.findMany();
  return NextResponse.json(documents);
}

// create new document
export async function POST(req: NextRequest) {
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const file = formData.get("file") as File;

  if (!title || !file) {
    return NextResponse.json(
      { error: "Missing title or file" },
      { status: 400 }
    );
  }

  // 🔒 Secure private storage directory
  const uploadDir = path.join(process.cwd(), "private/documents");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 🛡️ Generate a secure filename
  const fileExtension = file.name.split(".").pop();
  const secureFilename = `${randomUUID()}.${fileExtension}`;
  const filePath = path.join(uploadDir, secureFilename);

  // Save file securely
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  // Store document metadata in the database
  const document = await prisma.document.create({
    data: {
      title,
      filename: file.name,
      filePath: secureFilename,
      ownerId: user.id,
      status: "DRAFT",
    },
  });

  return NextResponse.json(document, { status: 201 });
}
