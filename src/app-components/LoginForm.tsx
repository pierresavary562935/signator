"use client";

import { PenTool } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginCredentials, loginGitHub, loginGoogle } from "@/lib/actions/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link";
import axios from "axios";

export function LoginForm({ className, ...props }: { className?: string }) {
    const router = useRouter();

    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState(""); // Only for signup
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isSignup) {
            // Signup logic
            try {
                const response = await axios.post("/api/auth/signup", { name, email, password });

                if (response.status === 201) {
                    // Auto-login after signup
                    await loginCredentials(email, password);
                    router.push("/home"); // Redirect user to home
                } else {
                    setError(response.data.error || "Signup failed");
                }
            } catch (err: any) {
                setError(err.response?.data?.error || "Something went wrong. Please try again.");
            }
        } else {
            // Login logic
            try {
                await loginCredentials(email, password);
                router.push("/home");
            } catch (err: any) {
                setError(err.response?.data?.error || "Invalid email or password.");
            }
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md">
                                <PenTool className="size-6" />
                            </div>
                            <span className="sr-only">Signator</span>
                        </Link>
                        <h1 className="text-xl font-bold">
                            {isSignup ? "Create a Signator account" : "Login to the Signator"}
                        </h1>
                        <div className="text-center text-sm">
                            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                            <button
                                type="button"
                                onClick={() => setIsSignup(!isSignup)}
                                className="underline underline-offset-4"
                            >
                                {isSignup ? "Login" : "Sign up"}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        {isSignup && (
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            {isSignup ? "Sign Up" : "Login"}
                        </Button>
                    </div>
                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                            Or
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Button variant="outline" className="w-full" onClick={loginGitHub}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path
                                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                                    fill="currentColor"
                                />
                            </svg>
                            Continue with Github
                        </Button>
                        <Button variant="outline" className="w-full" onClick={loginGoogle}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path
                                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                    fill="currentColor"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
