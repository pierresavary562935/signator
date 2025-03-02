"use client";
import PageHeader from "@/app-components/PageHeader";
import DocumentsList from "@/app-components/user/DocumentsList";
import { File } from "lucide-react";

export default function DocumentsPage() {


    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageHeader title="Documents" icon={<File size={32} />} />

            <DocumentsList />
        </div>
    );
}