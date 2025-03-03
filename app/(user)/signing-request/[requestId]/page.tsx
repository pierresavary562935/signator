"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchSigningRequestById } from "@/lib/actions/user/signing-requests-actions";
import DocumentPreviewComponent from "@/app-components/user/DocumentPreviewComponent";
import { SigningRequestWithDocument } from "@/lib/interfaces";

export default function DocumentPage() {
    const { requestId } = useParams();
    const [request, setRequest] = useState<SigningRequestWithDocument>();

    useEffect(() => {
        if (!requestId) return;
        getSigningRequest();
    }, [requestId]);

    const getSigningRequest = async () => {
        try {
            fetchSigningRequestById(requestId as string).then((request) => {
                if (request) {
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