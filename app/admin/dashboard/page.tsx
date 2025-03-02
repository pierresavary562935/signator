import SigningRequestsList from "@/app-components/admin/SigningRequestsList";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {

    const user = await requiredCurrentUser() as User;
    if (!user || user.role !== "ADMIN") {
        return redirect("/");
    }

    return (
        <div className="p-6 space-y-4">
            <SigningRequestsList />
        </div>
    );

}