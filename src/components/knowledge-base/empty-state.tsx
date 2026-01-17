import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    onUpload: () => void;
}

export function EmptyState({ onUpload }: EmptyStateProps) {
    return (
        <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No files uploaded</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    You haven&apos;t uploaded any files yet. Upload a file to get started.
                </p>
                <Button onClick={onUpload} className="cursor-pointer">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
            </div>
        </div>
    );
}
