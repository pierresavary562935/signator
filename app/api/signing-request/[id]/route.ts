import { auth } from "@/auth";
import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  console.log("req", req);
  console.log("params", params);

  const { id } = params;

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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = (await requiredCurrentUser()) as User;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  if (!params.id) {
    return NextResponse.json(
      { message: "Invalid request ID" },
      { status: 400 }
    );
  }
  try {
    // check if not already signed
    const request = await prisma.signingRequest.findUnique({
      where: { id: String(params.id) },
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
      where: { id: String(params.id) },
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
