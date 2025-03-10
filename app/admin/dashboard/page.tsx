import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import { redirect } from "next/navigation";
import SigningRequestsList from "@/app-components/admin/SigningRequestsList";
import PageHeader from "@/app-components/PageHeader";
import { LayoutDashboard } from "lucide-react";


export default async function AdminDashboard() {
    const user = await requiredCurrentUser() as User;
    if (!user || user.role !== "ADMIN") {
        return redirect("/");
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Admin Dashboard"
                icon={<LayoutDashboard size={32} />}
            />
            <SigningRequestsList />
        </div>
    );
}