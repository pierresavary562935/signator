import Sidebar from "@/app-components/Sidebar";
import UserMenu from "@/app-components/UserMenu";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import SigningRequestsList from "@/app-components/SigningRequestsList";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";

export default async function HomePage() {
  const user = (await requiredCurrentUser()) as User;
  if (!user) return redirect("/auth/login");

  return (
    <>

      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">👋 Welcome {user?.name}</h2>
        <UserMenu user={user} />
      </div>


      {/* My Requests Section */}
      <h3 className="mt-10 text-xl font-semibold">My requests</h3>
      {/* Add request list here later */}
      <SigningRequestsList />
    </>
  );
}