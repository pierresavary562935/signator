"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User } from "@prisma/client";
import { Star, Home, FileText, Users, Layout, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar({ user }: { user: User }) {
    const pathname = usePathname();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <aside className="h-screen w-64 bg-blue-100 border-r flex flex-col">
            <div className="p-4 flex items-center space-x-2">
                <Star className="w-6 h-6 text-blue-500" />
                <h1 className="text-lg font-bold">Signator</h1>
            </div>

            <ScrollArea className="flex-1 px-3 py-2">
                <nav className="flex flex-col space-y-1">
                    <Button
                        variant={pathname === "/home" ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        asChild
                    >
                        <Link href="/home">
                            <Home className="mr-2 h-4 w-4" />
                            User Home
                        </Link>
                    </Button>

                    <Separator className="my-2 bg-white" />

                    <Button
                        variant={pathname === "/admin/dashboard" ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        asChild
                    >
                        <Link href="/admin">
                            <Layout className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>

                    <Button
                        variant={pathname === "/admin/documents" ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        asChild
                    >
                        <Link href="/admin/documents">
                            <FileText className="mr-2 h-4 w-4" />
                            Documents
                        </Link>
                    </Button>

                    <Button
                        variant={pathname === "/admin/users" ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        asChild
                    >
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4" />
                            Users
                        </Link>
                    </Button>
                </nav>
            </ScrollArea>

            <Separator />

            <div className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user.image || ""} alt={user.name || "Admin"} />
                        <AvatarFallback>{user.name ? getInitials(user.name) : "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || "Admin"}</p>
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