import Sidebar from "@/app-components/user/Sidebar";
import UserMenu from "@/app-components/UserMenu";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await requiredCurrentUser() as User;

  if (!user) {
    return redirect("/auth/login");
  }

  return (
    <>
      <Sidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6">
        {children}
      </main>

      <Toaster />
    </>
  );
}