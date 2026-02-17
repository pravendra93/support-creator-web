"use client";

import React, { useState, useRef, useCallback } from "react";
import { CloudUpload, FileText, X, Loader2, CheckCircle, File } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    selectedTenantId: string;
    tenantName?: string;
}

const ACCEPTED_EXTENSIONS = [".txt", ".doc", ".docx", ".pdf", ".csv"];
const ACCEPTED_MIME_TYPES = [
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/csv",
];

const FILE_TYPE_MAP: Record<string, string> = {
    ".txt": "txt",
    ".doc": "doc",
    ".docx": "docx",
    ".pdf": "pdf",
    ".csv": "csv",
};

function getFileExtension(fileName: string): string {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    return ext;
}

function isValidFile(file: File): boolean {
    const ext = getFileExtension(file.name);
    return ACCEPTED_EXTENSIONS.includes(ext);
}

export function UploadModal({
    isOpen,
    onClose,
    onUploadComplete,
    selectedTenantId,
    tenantName,
}: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            validateAndSetFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (!isValidFile(file)) {
            toast({
                title: "Invalid file type",
                description: `Please upload one of the following: ${ACCEPTED_EXTENSIONS.join(", ")}`,
                variant: "destructive",
            });
            return;
        }

        setSelectedFile(file);
        setUploadComplete(false);
        // Auto-start upload will be handled by useEffect
    };

    // Auto-upload effect
    React.useEffect(() => {
        if (selectedFile && !isUploading && !uploadComplete) {
            handleUpload();
        }
    }, [selectedFile]);

    const handleUpload = async () => {
        if (!selectedFile || !selectedTenantId) return;

        setIsUploading(true);

        try {
            const ext = getFileExtension(selectedFile.name);
            const fileType = FILE_TYPE_MAP[ext] || "pdf";

            // 1. Get Presigned URL
            const urlRes = await fetch("/api/knowledge-base/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: selectedTenantId,
                    file_name: selectedFile.name,
                    file_type: fileType,
                    file_size: selectedFile.size,
                    content_type: selectedFile.type || "application/octet-stream",
                }),
            });

            if (!urlRes.ok) {
                const err = await urlRes.json();
                throw new Error(err.message || "Failed to get upload URL");
            }
            const { upload_url, file_id } = await urlRes.json();

            // 2. Upload to S3
            const uploadRes = await fetch(upload_url, {
                method: "PUT",
                body: selectedFile,
                headers: {
                    "Content-Type": selectedFile.type || "application/octet-stream",
                },
            });

            if (!uploadRes.ok) throw new Error("Failed to upload to storage");

            // 3. Confirm Upload
            const confirmRes = await fetch(`/api/knowledge-base/confirm-upload/${file_id}`, {
                method: "POST",
            });

            if (!confirmRes.ok) throw new Error("Failed to confirm upload");

            setUploadComplete(true);

            toast({
                title: "Upload successful",
                description: `${selectedFile.name} has been uploaded successfully.`,
            });

            onUploadComplete();

            // Auto-close after a short delay
            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error.message || "Something went wrong while uploading.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setUploadComplete(false);
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onClose();
    };

    const removeFile = () => {
        setSelectedFile(null);
        setUploadComplete(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CloudUpload className="h-5 w-5 text-blue-600" />
                        Upload Document {tenantName ? `- ${tenantName}` : ""}
                    </DialogTitle>
                    <DialogDescription>
                        Upload a document to your knowledge base. Supported formats: TXT, DOC, DOCX, PDF, CSV.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept={ACCEPTED_EXTENSIONS.join(",")}
                        onChange={handleFileSelect}
                    />

                    {!selectedFile ? (
                        /* Dropzone */
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                flex flex-col items-center justify-center 
                                h-52 rounded-xl border-2 border-dashed 
                                cursor-pointer transition-all duration-200 ease-in-out
                                ${isDragging
                                    ? "border-blue-500 bg-blue-50/80 scale-[1.02] shadow-lg shadow-blue-100"
                                    : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30"
                                }
                            `}
                        >
                            <div className={`
                                flex h-14 w-14 items-center justify-center rounded-full mb-3 transition-all duration-200
                                ${isDragging ? "bg-blue-100 scale-110" : "bg-slate-100"}
                            `}>
                                <CloudUpload className={`h-7 w-7 transition-colors duration-200 ${isDragging ? "text-blue-600" : "text-slate-400"}`} />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                or <span className="text-blue-600 font-medium hover:underline">browse to choose a file</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-4">
                                {ACCEPTED_EXTENSIONS.map((ext) => (
                                    <Badge
                                        key={ext}
                                        variant="secondary"
                                        className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 hover:bg-slate-100 uppercase font-medium"
                                    >
                                        {ext.replace(".", "")}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Selected file */
                        <div className="rounded-xl border bg-slate-50/50 p-4">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    flex h-12 w-12 items-center justify-center rounded-lg shrink-0
                                    ${uploadComplete ? "bg-emerald-50" : "bg-blue-50"}
                                `}>
                                    {uploadComplete ? (
                                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                                    ) : (
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {selectedFile.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(selectedFile.size)}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-500 hover:bg-slate-100 uppercase font-medium"
                                        >
                                            {getFileExtension(selectedFile.name).replace(".", "")}
                                        </Badge>
                                        {uploadComplete && (
                                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                Uploaded
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!isUploading && !uploadComplete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                        onClick={removeFile}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {isUploading && (
                                <div className="mt-3">
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4 transition-all duration-300" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Uploading...
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    {/* Upload button removed as upload starts automatically */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
