import UserPanel from "@/app-components/admin/UserPanel";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function UsersPage() {
    const user = await requiredCurrentUser() as User;
    if (!user || user.role !== "ADMIN") {
        return redirect("/");
    }

    return (
        <div className="p-6 space-y-4">
            <UserPanel />
        </div>
    );
}