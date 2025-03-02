"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchUsers, updateUserRole } from "@/lib/actions/admin/users-actions";
import { User } from "@prisma/client";
import PageHeader from "../PageHeader";

export default function UserPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        const usersData = await fetchUsers();
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <>
            <PageHeader title="Users" />
            {loading ? (
                <p>Loading users...</p>
            ) : (
                <ul className="space-y-3">
                    {users.map((user) => (
                        <li key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-400">Role: {user.role}</p>
                            </div>
                            <div className="flex gap-2">
                                {user.role === "ADMIN" ? (
                                    <Button
                                        onClick={() => updateUserRole(user.id, "USER")}
                                        variant="destructive"
                                    >
                                        Revoke Admin
                                    </Button>
                                ) : (
                                    < Button
                                        onClick={() => updateUserRole(user.id, "ADMIN")}
                                    >
                                        Make Admin
                                    </Button>
                                )}

                            </div>
                        </li>
                    ))}
                </ul >
            )
            }
        </>
    );
}