import { SigningRequest } from "@prisma/client";
import axios from "axios";
import { toast } from "sonner";

export const fetchUserSigningRequests = async (): Promise<SigningRequest[] | []> => {
    // Fetch user signing requests
    try {
        const response = await axios.get("/api/signing-request");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching user signing requests:", error);
        toast.error("Failed to fetch user signing requests.");
        return [];
    }
};

export const fetchSigningRequestById = async (id: string): Promise<SigningRequest | []> => {
    // Fetch signing request by id
    try {
        const response = await axios.get(`/api/signing-request/${id}`);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching signing request by id:", error);
        toast.error("Failed to fetch signing request.");
        return [];
    }
}