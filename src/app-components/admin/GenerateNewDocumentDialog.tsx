"use client";

import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function GenerateNewDocumentDialog({ onUpload }: { onUpload?: () => void }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title || !file) {
            toast.error("Please provide a document title and select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);

        try {
            setLoading(true);
            await axios.post("/api/admin/document", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Document uploaded successfully!");
            setOpen(false);
            setTitle("");
            setFile(null);
            if (onUpload) {
                onUpload();
            }
        } catch (error) {
            console.error("Error uploading document:", error);
            toast.error("Failed to upload document.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Generate New Document</Button>
            </DialogTrigger>
            <DialogContent className="p-6 space-y-4">
                <DialogHeader>
                    <DialogTitle>Generate New Document</DialogTitle>
                    <DialogDescription>Generate a new document from text.</DialogDescription>
                </DialogHeader>

                {/* Document Title */}
                <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                        <Label>Document Title</Label>
                        <Input
                            placeholder="Enter document title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                </div>

                {/* Document Text */}
                <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                        <Label>Document Text</Label>
                        <Input
                            placeholder="Enter document text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                </div>


                {/* Submit Button */}
                <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                    {loading ? "Uploading..." : "Upload Document"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}