"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

export default function UserMenu({ session }: { session: any }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                    <AvatarFallback>{session?.user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                    {session?.user?.image && <AvatarImage src={session?.user?.image} alt={session?.user?.name} />}
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>{session?.user?.email}</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={() => signOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}