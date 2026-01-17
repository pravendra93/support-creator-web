import { FileText, MoreVertical, Loader2, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FileStatus = "in_progress" | "done" | "chunking";

export interface KnowledgeBaseFile {
    id: string;
    name: string;
    size: string;
    status: FileStatus;
    uploadedAt: Date;
}

interface FileListProps {
    files: KnowledgeBaseFile[];
}

const statusMap: Record<FileStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "secondary" }> = {
    in_progress: { label: "In Progress", color: "secondary" },
    done: { label: "Done", color: "default" },
    chunking: { label: "Chunking", color: "outline" },
};

const statusIconMap: Record<FileStatus, React.ReactNode> = {
    in_progress: <Loader2 className="h-3 w-3 animate-spin mr-1" />,
    done: <CheckCircle className="h-3 w-3 mr-1" />,
    chunking: <Clock className="h-3 w-3 mr-1" />,
};

export function FileList({ files }: FileListProps) {
    return (
        <div className="space-y-4">
            {files.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="grid gap-1">
                            <div className="font-semibold">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {file.size} • {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant={statusMap[file.status].color} className="flex items-center">
                            {statusIconMap[file.status]}
                            {statusMap[file.status].label}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ))}
        </div>
    );
}
