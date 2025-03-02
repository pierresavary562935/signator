import { LoginForm } from "@/app-components/LoginForm";
import { requiredCurrentUser } from "@/lib/current-user";
import { User } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const user = await requiredCurrentUser() as User;
    if (user) {
        return redirect("/home");
    }

    return (
        <main className="flex-1 flex flex-col">
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <LoginForm />
                </div>
            </div>
        </main>
    )
}
