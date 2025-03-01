"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User } from "@prisma/client";
import { signOut } from "next-auth/react";

export default function UserMenu({ user }: { user: User }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                    {user?.image && <AvatarImage src={user?.image} alt={user?.name + "'s avatar"} />}
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={() => signOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}