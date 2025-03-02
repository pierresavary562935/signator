import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
    switch (status) {
        case "PENDING":
            return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        case "SIGNED":
            return <Badge className="bg-green-100 text-green-800">Signed</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};