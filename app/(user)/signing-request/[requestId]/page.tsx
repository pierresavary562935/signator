"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, FileText, RefreshCcw, ArrowLeft } from "lucide-react";
import { redirect, useParams, useRouter } from "next/navigation";
import { Document, SigningRequest } from "@prisma/client";
import { formatDate } from "@/lib/date-utils";
import { fetchSigningRequestById } from "@/lib/actions/user/signing-requests-actions";
import axios from "axios";
import { toast } from "sonner";
import DocumentPreviewComponent from "@/app-components/user/DocumentPreviewComponent";

// Extended types
type SigningRequestWithDocument = SigningRequest & {
    document: Document;
};

export default function DocumentPage() {
    const { requestId } = useParams(); // ✅ Get requestId from URL
    const [request, setRequest] = useState<SigningRequestWithDocument>();

    useEffect(() => {
        if (!requestId) return; // Prevent fetching if requestId is missing
        console.log("Fetching document content...");
        console.log("Request ID:", requestId);
        getSigningRequest();
    }, [requestId]);

    const getSigningRequest = async () => {
        try {
            fetchSigningRequestById(requestId as string).then((request) => {
                if (request) {
                    console.log("Signing request:", request);
                    setRequest(request as SigningRequestWithDocument);
                }
            });
        } catch (error) {
            console.error("Error fetching signing request:", error);
        }
    };

    return (
        <DocumentPreviewComponent
            selectedRequest={request}
            onSignSuccess={getSigningRequest}
            documentId={request?.documentId}
            requestId={request?.id}
        />
    );
}