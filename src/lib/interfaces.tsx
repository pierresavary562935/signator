import { Document, SigningRequest, User } from "@prisma/client";

export type SigningRequestWithDocument = SigningRequest & {
    document: Document;
    user: User;
};