import AdminUserPanel from "@/app-components/admin/AdminUserPanel";
import NewDocumentDialog from "@/app-components/admin/NewDocumentDialog";
import NewSigningRequestDialog from "@/app-components/admin/NewSigningRequestDialog";
import Sidebar from "@/app-components/Sidebar";
import UserMenu from "@/app-components/UserMenu";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const user = await requiredCurrentUser() as User;
    if (!user || user.role !== "ADMIN") {
        return redirect("/");
    }

    return (
        <div className="flex h-screen">
            {/* <AdminSidebar /> */}

            <main className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
                    <UserMenu user={user} />
                </div>

                <div className="flex justify-between mt-6">
                    {/* New Signing Request */}
                    <div className="mt-6">
                        <NewSigningRequestDialog />
                        <p className="text-sm text-gray-500 mt-2">
                            *This will generate the documents you need to sign
                        </p>
                    </div>

                    {/* new document btn  */}
                    <div className="mt-6">
                        <Button className="px-6 py-3 text-lg" asChild>
                            <Link href="/admin/documents">
                                Manage Documents
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* User Panel */}
                <div className="mt-6">
                    <AdminUserPanel />
                </div>
            </main>
        </div>
    );
}