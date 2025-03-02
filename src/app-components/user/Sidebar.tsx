"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User } from "@prisma/client";
import { Home, FileText, Settings, LogOut, Star } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";


export default function Sidebar({ user }: { user: User }) {
    const pathname = usePathname();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <aside className="h-screen w-64 bg-background border-r flex flex-col">
            <div className="p-4">
                <h1 className="text-xl font-bold">Signator</h1>
            </div>

            <Separator />

            <ScrollArea className="flex-1 px-3 py-2">
                <nav className="flex flex-col space-y-1">
                    {user && user.role === "ADMIN" && (
                        <>
                            <Button
                                variant={pathname === "/admin" ? "secondary" : "ghost"}
                                className="justify-start w-full"
                                asChild
                            >
                                <Link href="/admin">
                                    <Star className="mr-2 h-4 w-4" />
                                    Administation Panel
                                </Link>
                            </Button>
                            <Separator className="my-1" />
                        </>
                    )}


                    <Button
                        variant={pathname === "/home" ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        asChild
                    >
                        <Link href="/home">
                            <Home className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>

                    <Button
                        variant={pathname === "/documents" ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        asChild
                    >
                        <Link href="/documents">
                            <FileText className="mr-2 h-4 w-4" />
                            Documents
                        </Link>
                    </Button>


                </nav>
            </ScrollArea>

            <Separator />

            <div className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                        <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-32">{user.email}</p>
                    </div>
                </div>
                <Button onClick={() => signOut()} variant="ghost" size="sm" className="mt-3 w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                </Button>
            </div>
        </aside>
    );
}