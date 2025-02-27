"use client";

import { Button } from "@/components/ui/button";
import { loginCredentials, loginGitHub } from "@/lib/actions/auth";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>
            <Button className="mb-2" onClick={() => loginGitHub()}>
                Sign in with Github
            </Button>
            <Button variant="secondary" onClick={() => loginCredentials("test@example.com", "password123")}>
                Sign in with Credentials
            </Button>
        </div>
    );
}