import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing signing request ID" },
      { status: 400 }
    );
  }

  await prisma.signingRequest.delete({
    where: { id: id },
  });

  return NextResponse.json({ message: "Signing request deleted" });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { message: "Invalid request ID" },
      { status: 400 }
    );
  }
  try {
    const updatedRequest = await prisma.signingRequest.update({
      where: { id: String(id) },
      data: { status: "SIGNED", signedAt: new Date() },
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
