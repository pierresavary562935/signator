import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/signup
// Signup a new user
export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        return NextResponse.json(newUser);
    } catch (error) {
        return NextResponse.json({ message: "Signup failed" }, { status: 500 });
    }
}