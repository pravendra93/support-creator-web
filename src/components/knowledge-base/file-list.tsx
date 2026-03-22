import { FileText, Loader2, CheckCircle, Clock, Eye, Play, Square } from "lucide-react";
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

export type FileStatus = "in_progress" | "done" | "chunking" | "uploaded" | "processing" | "processed" | "failed";

export interface KnowledgeBaseFile {
    id: string;
    name: string;
    size: string;
    type?: string;
    status: FileStatus;
    uploadedAt: Date;
    workspaceName?: string;
    storage_url?: string;
    estimated_time?: number;
    raw_size?: number; // File size in bytes for calculating estimated credits
}

interface FileListProps {
    files: KnowledgeBaseFile[];
    onView?: (id: string) => void;
    onProcess?: (id: string) => void;
    onStop?: (id: string) => void;
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
        label: "Chunking",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
        icon: <Clock className="h-3 w-3 mr-1" />
    },
    uploaded: {
        label: "Uploaded",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    processing: {
        label: "Processing",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
        icon: <Loader2 className="h-3 w-3 animate-spin mr-1" />
    },
    processed: {
        label: "Processed",
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    failed: {
        label: "Failed",
        className: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
        icon: <Clock className="h-3 w-3 mr-1" />
    },
};

export function FileList({ files, onView, onProcess, onStop }: FileListProps) {
    return (
        <div className="rounded-lg border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[35%] font-semibold text-xs uppercase text-muted-foreground">Document Name</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Workspace</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Type</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Size</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Estimated Credits</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right font-semibold text-xs uppercase text-muted-foreground">Actions</TableHead>
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
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-blue-500/5 text-blue-600 border-blue-500/20 uppercase tracking-tight">
                                        {file.workspaceName || "System"}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="rounded-sm px-2 py-0.5 text-xs font-normal bg-muted text-muted-foreground hover:bg-muted uppercase">
                                    {file.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{file.size}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <span className="font-medium text-indigo-400">
                                        {file.raw_size ? Math.max(1, Math.ceil(file.raw_size / 4000)).toLocaleString() : "-"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">credits</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-xs font-medium border ${statusMap[file.status].className}`}>
                                        {statusMap[file.status].icon}
                                        {statusMap[file.status].label}
                                    </Badge>
                                    {file.status === 'processing' && file.estimated_time && (
                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" />
                                            ~{file.estimated_time > 60 ? `${Math.ceil(file.estimated_time / 60)} min` : `${file.estimated_time}s`}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    {/* Show Process button for files that need processing or are processing */}
                                    {(file.status === 'uploaded' || file.status === 'failed' || file.status === 'in_progress' || file.status === 'processing') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-8 w-8 cursor-pointer ${file.status === 'processing' ? 'text-red-500 hover:text-red-700' : 'text-muted-foreground hover:text-green-600'}`}
                                            onClick={() => {
                                                if (file.status === 'processing') {
                                                    onStop?.(file.id);
                                                } else {
                                                    onProcess?.(file.id);
                                                }
                                            }}
                                            title={file.status === 'processing' ? "Stop processing" : "Process document"}
                                        >
                                            {file.status === 'processing' ? (
                                                <Square className="h-4 w-4 fill-current" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">{file.status === 'processing' ? "Stop" : "Process"}</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-blue-600 cursor-pointer"
                                        onClick={() => onView?.(file.id)}
                                        title="View document"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
