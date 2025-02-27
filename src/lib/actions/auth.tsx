import { signIn, signOut } from "next-auth/react";

export const loginGitHub = async () => {
    await signIn("github", { callbackUrl: "/" });
}

export const loginCredentials = async (email: string, password: string) => {
    await signIn("credentials", { email, password, redirectTo: "/" });
}

export const logout = async () => {
    await signOut({ redirectTo: "/" });
}

