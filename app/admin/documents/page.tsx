import { requiredCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { User } from "@prisma/client";
import DocumentsPanel from "@/app-components/admin/DocumentsPanel";

export default async function DocumentPage() {
    const user = await requiredCurrentUser() as User;
    if (!user || user.role !== "ADMIN") {
        return redirect("/");
    }

    return (
        <div className="p-6 space-y-4">
            <DocumentsPanel />
        </div>
    );
}