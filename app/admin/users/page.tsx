import UserManagement from "@/app-components/admin/UserManagement";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import { UsersIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function UsersPage() {
    const user = await requiredCurrentUser() as User;
    if (!user || user.role !== "ADMIN") {
        return redirect("/");
    }

    return (
        <div className="p-6 space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>
                            View and manage user accounts
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <UserManagement />
                </CardContent>
            </Card>
        </div>
    );
}