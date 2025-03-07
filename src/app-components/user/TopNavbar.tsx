"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@prisma/client";
import { Home, FileText, LogOut, Star } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNavbar({ user }: { user: User }) {
    const pathname = usePathname();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <header className="w-full bg-background border-b">
            <div className="container mx-auto flex items-center justify-between h-16 px-4">
                {/* Logo on the left */}
                <div className="flex items-center">
                    <h1 className="text-xl font-bold">Signator</h1>
                </div>

                {/* Navigation links in the middle */}
                <nav className="flex items-center space-x-1">
                    {user && user.role === "ADMIN" && (
                        <>
                            <Button
                                variant={pathname === "/admin" ? "secondary" : "ghost"}
                                size="sm"
                                asChild
                            >
                                <Link href="/admin">
                                    <Star className="mr-2 h-4 w-4" />
                                    Administration Panel
                                </Link>
                            </Button>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                        </>
                    )}

                    <Button
                        variant={pathname === "/home" ? "secondary" : "ghost"}
                        size="sm"
                        asChild
                    >
                        <Link href="/home">
                            <Home className="mr-2 h-4 w-4" />
                            Requests
                        </Link>
                    </Button>

                    <Button
                        variant={pathname === "/documents" ? "secondary" : "ghost"}
                        size="sm"
                        asChild
                    >
                        <Link href="/documents">
                            <FileText className="mr-2 h-4 w-4" />
                            Documents
                        </Link>
                    </Button>
                </nav>

                {/* User profile and dropdown on the right */}
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 p-1">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                                    <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
                                </Avatar>
                                <span className="hidden md:inline text-sm font-medium">{user.name || "User"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <p className="font-medium">{user.name || "User"}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-52">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-500 cursor-pointer"
                                onClick={() => signOut()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}