import { FileText, Loader2, CheckCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FileStatus = "in_progress" | "done" | "chunking";

export interface KnowledgeBaseFile {
    id: string;
    name: string;
    size: string;
    type?: string;
    status: FileStatus;
    uploadedAt: Date;
    storage_url?: string;
}

interface FileListProps {
    files: KnowledgeBaseFile[];
    onView?: (id: string) => void;
}

const statusMap: Record<FileStatus, { label: string; className: string; icon: React.ReactNode }> = {
    in_progress: {
        label: "Processing",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
        icon: <Loader2 className="h-3 w-3 animate-spin mr-1" />
    },
    done: {
        label: "Ready",
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    chunking: {
        label: "Processing",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
        icon: <Clock className="h-3 w-3 mr-1" />
    },
};

export function FileList({ files, onView }: FileListProps) {
    return (
        <div className="rounded-lg border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[40%] font-semibold text-xs uppercase text-muted-foreground">Document Name</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Type</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Size</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right font-semibold text-xs uppercase text-muted-foreground">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="grid gap-0.5">
                                        <div className="font-medium text-sm text-foreground">{file.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Uploaded on {format(file.uploadedAt, "yyyy-MM-dd")}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="rounded-sm px-2 py-0.5 text-xs font-normal bg-muted text-muted-foreground hover:bg-muted uppercase">
                                    {file.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{file.size}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-xs font-medium border ${statusMap[file.status].className}`}>
                                    {statusMap[file.status].icon}
                                    {statusMap[file.status].label}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                    onClick={() => onView?.(file.id)}
                                    title="View document"
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
