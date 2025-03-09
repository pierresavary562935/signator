import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextResponse } from "next/server";

// GET /signing-request/:id (returns a signing request)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { message: "Invalid request ID" },
      { status: 400 }
    );
  }

  const request = await prisma.signingRequest.findUnique({
    where: { id: id },
    include: { document: true },
  });

  if (!request) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(request);
}

// PATCH /signing-request/:id (updates a signing request status to SIGNED)
// body: { signedDocumentId: string }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { signedDocumentId } = await req.json();

  if (!id) {
    return NextResponse.json(
      { message: "Invalid request ID" },
      { status: 400 }
    );
  }
  try {
    // check if not already signed
    const request = await prisma.signingRequest.findUnique({
      where: { id: String(id) },
    });

    if (!request) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (request.status === "SIGNED") {
      return NextResponse.json(
        { message: "Request already signed" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.signingRequest.update({
      where: { id: String(id) },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        documentId: signedDocumentId,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 }
    );
  }
}
