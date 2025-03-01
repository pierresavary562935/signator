"use client"; // Ensures it runs in client components

import { signIn, signOut } from "next-auth/react";

/**
 * Login with GitHub OAuth
 */
export const loginGitHub = async () => {
    try {
        await signIn("github", { callbackUrl: "/home" });
    } catch (error) {
        console.error("GitHub login failed:", error);
    }
};

/**
 * Login with Google OAuth
 */
export const loginGoogle = async () => {
    try {
        await signIn("google", { callbackUrl: "/home" });
    } catch (error) {
        console.error("Google login failed:", error);
    }
};

/**
 * Login with credentials (email & password)
 */
export const loginCredentials = async (email: string, password: string) => {
    try {
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            throw new Error(res.error);
        }
    } catch (error) {
        console.error("Credentials login failed:", error);
        throw error;
    }
};

/**
 * Logout function
 */
export const logout = async () => {
    try {
        await signOut({ callbackUrl: "/" });
    } catch (error) {
        console.error("Logout failed:", error);
    }
};