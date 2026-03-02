"use client";
import { getErrorMessage } from "@/lib/utils";

import React, { useState, useRef, useCallback } from "react";
import { CloudUpload, FileText, X, Loader2, CheckCircle, File, Building2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Tenant {
    id: string;
    name: string;
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    initialTenantId?: string | null;
    tenants: Tenant[];
}

const ACCEPTED_EXTENSIONS = [".txt", ".doc", ".docx", ".pdf", ".csv"];

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
    initialTenantId,
    tenants,
}: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [internalSelectedTenantId, setInternalSelectedTenantId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Force manual workspace selection on every modal open
    React.useEffect(() => {
        if (isOpen) {
            setInternalSelectedTenantId(null);
            setSelectedFile(null);
            setUploadComplete(false);
            setIsUploading(false);
        }
    }, [isOpen]);

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
        if (!internalSelectedTenantId) {
            toast({
                title: "No workspace selected",
                description: "Please select a workspace before uploading.",
                variant: "destructive",
            });
            return;
        }

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
    };

    // Auto-upload effect
    React.useEffect(() => {
        if (selectedFile && !isUploading && !uploadComplete && internalSelectedTenantId) {
            handleUpload();
        }
    }, [selectedFile, internalSelectedTenantId]);

    const handleUpload = async () => {
        if (!selectedFile || !internalSelectedTenantId) return;

        setIsUploading(true);

        try {
            const ext = getFileExtension(selectedFile.name);
            const fileType = FILE_TYPE_MAP[ext] || "pdf";

            // 1. Get Presigned URL
            const urlRes = await fetch("/api/knowledge-base/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: internalSelectedTenantId,
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
            }, 2000);

        } catch (error: unknown) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: getErrorMessage(error) || "Something went wrong while uploading.",
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
            <DialogContent className="sm:max-w-[540px] bg-[#0A0C12] border-slate-800 text-white p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="p-8 pb-4">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl">
                                <CloudUpload className="h-6 w-6 text-blue-500" />
                            </div>
                            Upload Document
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-base">
                            Train your AI agent with custom internal knowledge.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Premium Workspace Selection Dropdown */}
                        {tenants.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                        Target Workspace
                                    </label>
                                    {internalSelectedTenantId && (
                                        <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20 px-2 py-0 text-[10px] uppercase font-bold">
                                            Selected
                                        </Badge>
                                    )}
                                </div>

                                <Select
                                    value={internalSelectedTenantId || ""}
                                    onValueChange={(val) => setInternalSelectedTenantId(val)}
                                >
                                    <SelectTrigger className="w-full h-14 bg-[#13171F] border-slate-800 rounded-2xl px-5 text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#1a1f29] hover:border-slate-700 font-medium cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Building2 className={cn("h-5 w-5", internalSelectedTenantId ? "text-blue-500" : "text-slate-500")} />
                                            <SelectValue placeholder="Search or select workspace..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#13171F] border-slate-800 text-slate-200 rounded-2xl shadow-2xl p-2 min-w-[300px]">
                                        {tenants.map((t) => (
                                            <SelectItem
                                                key={t.id}
                                                value={t.id}
                                                className="rounded-xl px-4 py-3 cursor-pointer hover:bg-blue-500/10 focus:bg-blue-500/10 focus:text-blue-400 transition-colors my-1 font-medium"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-4 w-4" />
                                                    {t.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Dropzone transition */}
                        <div className={cn(
                            "relative transition-all duration-700",
                            !internalSelectedTenantId ? "opacity-20 blur-[2px] pointer-events-none scale-95" : "opacity-100 blur-0 scale-100"
                        )}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept={ACCEPTED_EXTENSIONS.join(",")}
                                onChange={handleFileSelect}
                            />

                            {!selectedFile ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "flex flex-col items-center justify-center h-52 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
                                        isDragging
                                            ? "border-blue-500 bg-blue-500/10 scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                                            : "border-slate-800 bg-[#13171F] hover:border-blue-500/50 hover:bg-[#1a1f29]"
                                    )}
                                >
                                    <div className={cn(
                                        "h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
                                        isDragging ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-blue-400"
                                    )}>
                                        <CloudUpload className="h-7 w-7" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-200">
                                        Drop your knowledge here
                                    </p>
                                    <p className="text-sm text-slate-500 mt-2">
                                        or <span className="text-blue-500 font-semibold">browse files</span>
                                    </p>

                                    <div className="flex gap-2 mt-6">
                                        {ACCEPTED_EXTENSIONS.slice(0, 3).map(ext => (
                                            <span key={ext} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-900 px-2 py-1 rounded">
                                                {ext.replace('.', '')}
                                            </span>
                                        ))}
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-900 px-2 py-1 rounded">
                                            +{ACCEPTED_EXTENSIONS.length - 3} More
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 relative overflow-hidden group">
                                    {isUploading && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-[2000ms] animate-pulse w-full" />
                                    )}
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                            uploadComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {uploadComplete ? <CheckCircle className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-bold text-white truncate mb-1">
                                                {selectedFile.name}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                                                <span>{formatFileSize(selectedFile.size)}</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                <span className="uppercase">{getFileExtension(selectedFile.name).replace('.', '')}</span>
                                            </div>
                                        </div>
                                        {!isUploading && !uploadComplete && (
                                            <button
                                                onClick={removeFile}
                                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>

                                    {isUploading && (
                                        <div className="mt-6 flex items-center gap-3 text-blue-400 font-bold text-sm">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Syncing knowledge...
                                        </div>
                                    )}
                                    {uploadComplete && (
                                        <div className="mt-6 flex items-center gap-3 text-emerald-400 font-bold text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            Knowledge added successfully!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#13171F]/50 p-6 flex justify-end gap-3 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl px-6 cursor-pointer"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
