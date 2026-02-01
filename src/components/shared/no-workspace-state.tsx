
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NoWorkspaceStateProps {
    message?: string;
}

export function NoWorkspaceState({ message = "You need a workspace to continue." }: NoWorkspaceStateProps) {
    return (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed text-center gap-4 p-6">
            <p className="text-muted-foreground max-w-md">{message}</p>
            <Button asChild className="cursor-pointer">
                <Link href="/pages/tenants/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Workspace
                </Link>
            </Button>
        </div>
    );
}
