import TopNavbar from "@/app-components/user/TopNavbar";
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

      <main className="flex-1 flex flex-col">
        <TopNavbar user={user} />
        <div className="w-1/2 h-2/3 mx-auto">
          {children}
        </div>
      </main>

      <Toaster />
    </>
  );
}