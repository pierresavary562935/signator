import { auth } from "@/auth";

// return the current user
export async function requiredCurrentUser() {
    const session = await auth();

    return session?.user;
}
// return the current user