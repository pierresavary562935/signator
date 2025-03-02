import { ReactNode } from "react";
import { cn } from "@/lib/utils"; // Ensure you have a `cn` utility for conditional classes

interface PageHeaderProps {
    title: string;
    icon?: ReactNode; // Optional icon (e.g., <File size={32} />)
    children?: ReactNode; // Optional extra elements (buttons, filters, etc.)
    className?: string; // Optional styling override
}

export default function PageHeader({ title, icon, children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex justify-between items-center mb-6", className)}>
            <div className="flex items-center space-x-2">
                {icon && <span className="text-gray-600">{icon}</span>}
                <h1 className="text-3xl font-bold">{title}</h1>
            </div>
            {children && <div className="flex space-x-2">{children}</div>}
        </div>
    );
}