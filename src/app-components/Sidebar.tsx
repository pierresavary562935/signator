import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import Link from "next/link";

export default async function Sidebar() {
    const user = await requiredCurrentUser() as User;

    return (
        <aside className="h-screen w-64 bg-gray-100 p-6 flex flex-col justify-between">
            <div>
                <h1 className="text-xl font-bold">OKCohabs</h1>
                <nav className="mt-6 flex flex-col space-y-3">
                    <Link href="/dashboard" className="text-gray-700 hover:text-black">
                        Dashboard
                    </Link>
                    <Link href="/documents" className="text-gray-700 hover:text-black">
                        My documents
                    </Link>
                    {user && user.role === "ADMIN" && (
                        <Link href="/admin" className="text-gray-700 hover:text-black">
                            Admin
                        </Link>
                    )}
                </nav>
            </div>
        </aside>
    );
}