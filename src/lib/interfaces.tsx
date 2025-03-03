import { SigningRequest, User } from "@prisma/client";
import { Document as PrismaDocument } from "@prisma/client";

export type SigningRequestWithDocument = SigningRequest & {
    document: PrismaDocument;
    user: User;
};