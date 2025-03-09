import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  // Check if user is authenticated
  const user = (await requiredCurrentUser()) as User;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const requests = await prisma.signingRequest.findMany({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
      select: {
        id: true, // Signing Request Fields
        status: true,
        signedAt: true,
        createdAt: true,
        document: {
          select: {
            id: true,
            title: true,
            filename: true,
            filePath: true,
          },
        },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch signing requests" },
      { status: 500 }
    );
  }
}
