"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { User, Document } from "@prisma/client";
import { fetchUsers } from "@/lib/actions/admin/users-actions";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function NewSigningRequestDialog({ onCreate }: { onCreate?: () => void }) {
    const [open, setOpen] = useState(false);
    const [documentIds, setDocumentIds] = useState<string[]>([]);
    const [userId, setUserId] = useState("");
    const [email, setEmail] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [documentComboOpen, setDocumentComboOpen] = useState(false);
    const [userComboOpen, setUserComboOpen] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        fetchUsers().then(setUsers);
        fetchDocuments().then(setDocuments);
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get("/api/admin/document");
            return response.data;
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast.error("Failed to fetch documents.");
            return [];
        }
    };

    const handleSubmit = async () => {
        if (documentIds.length === 0 || (!userId && !email)) {
            toast.error("Please select at least one document and provide a user ID or email.");
            return;
        }

        try {
            await axios.post("/api/admin/signing-request", { documentIds, userId, email });
            toast.success("Signing request created successfully!");
            setOpen(false);
            setDocumentIds([]);
            setUserId("");
            setEmail("");
            onCreate && onCreate();
        } catch (error) {
            console.error("Error creating signing request:", error);
            toast.error("Failed to create signing request.");
        }
    };

    // Find label to display in the ComboBox button
    const selectedUser = users.find((u) => u.id === userId);
    const displayLabel = selectedUser
        ? `${selectedUser.name} (${selectedUser.email})`
        : "Select user...";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">New Signing Request</Button>
            </DialogTrigger>

            <DialogContent className="p-6 space-y-4">
                <DialogHeader>
                    <DialogTitle>Create New Signing Request</DialogTitle>
                    <DialogDescription>
                        Select multiple documents and assign them to a user.
                    </DialogDescription>
                </DialogHeader>

                {/* Document Selection (Multi-Select) */}
                <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                        <Label>Select Documents</Label>
                        <Popover open={documentComboOpen} onOpenChange={setDocumentComboOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={documentComboOpen}
                                    className="w-full justify-between"
                                >
                                    {documentIds.length > 0
                                        ? `${documentIds.length} document(s) selected`
                                        : "Select documents..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Search documents..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>No documents found.</CommandEmpty>
                                        <CommandGroup>
                                            {documents.map((doc) => (
                                                <CommandItem
                                                    key={doc.id}
                                                    value={doc.id}
                                                    onSelect={() => {
                                                        setDocumentIds((prev) =>
                                                            prev.includes(doc.id)
                                                                ? prev.filter((id) => id !== doc.id)
                                                                : [...prev, doc.id]
                                                        );
                                                    }}
                                                >
                                                    {doc.filename}
                                                    <Check
                                                        className={`ml-auto h-4 w-4 ${documentIds.includes(doc.id) ? "opacity-100" : "opacity-0"
                                                            }`}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Toggle for User Type */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="new-user-toggle">User</Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Existing</span>
                            <Switch
                                id="new-user-toggle"
                                checked={isNewUser}
                                onCheckedChange={setIsNewUser}
                            />
                            <span className="text-sm text-muted-foreground">New</span>
                        </div>
                    </div>

                    {isNewUser ? (
                        <div className="flex flex-col gap-2">
                            {/* Email Input */}
                            <div className="grid gap-2">
                                <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {/* User Selection */}
                            <div className="grid gap-2">
                                <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={userComboOpen}
                                            className="w-full justify-between"
                                        >
                                            {displayLabel}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search user..." className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>No user found.</CommandEmpty>
                                                <CommandGroup>
                                                    {users.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={user.id}
                                                            onSelect={(currentValue) => {
                                                                // Toggle if user reselects
                                                                setUserId(currentValue === userId ? "" : currentValue);
                                                                setUserComboOpen(false);
                                                            }}
                                                        >
                                                            {user.name} ({user.email})
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto h-4 w-4",
                                                                    userId === user.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                </div>


                {/* Submit Button */}
                <Button onClick={handleSubmit} className="w-full">
                    Submit
                </Button>
            </DialogContent>
        </Dialog>
    );
}