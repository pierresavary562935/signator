import { auth } from "@/auth";
import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  params: { documentId: string; userId: string; email: string }
) {
  const session = await auth();
  // if (!session || !session.user || session.user.role !== 'admin') {
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const { documentIds, userId, email } = body;

    if (!documentIds || documentIds.length === 0 || (!userId && !email)) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }

    // Create multiple signing requests
    const signingRequests = await prisma.signingRequest.createMany({
      data: documentIds.map((docId: string) => ({
        documentId: docId,
        userId: userId || null,
        email: email || null,
        status: "PENDING",
      })),
    });

    return NextResponse.json(
      { message: "Signing requests created", signingRequests },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating signing request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get query parameters from the request URL
    const url = new URL(req.url);
    const documentId = url.searchParams.get("documentId");

    const signingRequests = await prisma.signingRequest.findMany({
      where: {
        ...(documentId ? { documentId } : {}), // Optional filtering by documentId
      },
      include: {
        document: true, // Include document details
        user: true, // Include user details
      },
      orderBy: { createdAt: "desc" }, // Sort by latest
    });

    return NextResponse.json(signingRequests);
  } catch (error) {
    console.error("Error fetching signing requests:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
