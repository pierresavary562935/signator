import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const user = (await requiredCurrentUser()) as User;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        signingRequests: true,
        documents: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
