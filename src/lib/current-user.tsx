import { auth } from "@/auth";
import { User } from "@prisma/client";

export async function requiredCurrentUser() {
    const session = await auth();

    return session?.user as User;
}
