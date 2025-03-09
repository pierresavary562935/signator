import { redirect } from "next/navigation";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import SigningRequestsCardList from "@/app-components/user/SigningRequestCardList";

export default async function HomePage() {
  const user = (await requiredCurrentUser()) as User;
  if (!user) return redirect("/auth/login");

  return (
    <div className="container mx-auto py-6 space-y-6">

      <div className="flex justify-center items-center space-x-2">
        <h2 className="text-2xl font-semibold">Welcome, {user.name}</h2>
        <span className="animate-bounce text-3xl">👋</span>
      </div>

      <SigningRequestsCardList />
    </div>
  );
}