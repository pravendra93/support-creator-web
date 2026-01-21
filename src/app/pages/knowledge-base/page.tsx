"use client";

import { useState, useRef, useEffect } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/knowledge-base/empty-state";
import { FileList, KnowledgeBaseFile } from "@/components/knowledge-base/file-list";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Tenant {
    id: string;
    name: string;
}

export default function KnowledgeBasePage() {
    const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const urlTenantId = searchParams.get('tenantId');
    const { user } = useAuth();

    // Fetch Tenants based on user role
    useEffect(() => {
        const loadTenants = async () => {
            try {
                console.log("[KB Page] User:", user);
                console.log("[KB Page] Loading tenants...");

                if (user?.role === 'super_admin' || user?.role === 'platform_user' || user?.role === 'tenant_admin') {
                    console.log("[KB Page] User is admin, fetching all tenants");
                    // Admin users: fetch all tenants and show dropdown
                    const res = await fetch("/api/tenants");
                    if (res.ok) {
                        const data = await res.json();
                        console.log("[KB Page] Received tenants:", data);
                        setTenants(data);

                        // Auto-select if URL has tenant or default to first
                        if (urlTenantId) {
                            setSelectedTenantId(urlTenantId);
                        } else if (data.length > 0) {
                            setSelectedTenantId(data[0].id);
                        }
                    }
                } else {
                    // Regular users: fetch their own tenant only
                    const res = await fetch("/api/tenants");
                    if (res.ok) {
                        const data = await res.json();
                        // For regular users, the API should return only their tenant
                        // but if it returns multiple, just take the first one
                        if (data.length > 0) {
                            setTenants([data[0]]); // Only show their tenant
                            setSelectedTenantId(data[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load tenants", error);
            }
        };

        console.log("[KB Page] useEffect triggered. User exists?", !!user);
        if (user) {
            loadTenants();
        } else {
            console.log("[KB Page] No user, skipping tenant load");
        }
    }, [user, urlTenantId]);

    // FETCH FILES
    const fetchFiles = async () => {
        if (!selectedTenantId) return;
        try {
            const res = await fetch(`/api/knowledge-base?tenant_id=${selectedTenantId}`);
            if (res.ok) {
                const data = await res.json();
                // Map backend response to frontend interface
                const mappedFiles: KnowledgeBaseFile[] = data.map((f: any) => ({
                    id: f.id,
                    name: f.file_name,
                    type: f.file_type?.toUpperCase() || 'PDF',
                    size: (f.file_size / (1024 * 1024)).toFixed(2) + " MB",
                    status: f.status === 'uploaded' ? 'done' : f.status === 'processing' ? 'chunking' : 'in_progress',
                    uploadedAt: new Date(f.created_at),
                    storage_url: f.storage_url || `${process.env.NEXT_PUBLIC_SPACES_URL}/${f.storage_key}`, // Construct URL if not provided
                }));
                setFiles(mappedFiles);
            }
        } catch (error) {
            console.error("Failed to fetch files", error);
        }
    };

    useEffect(() => {
        if (selectedTenantId) {
            fetchFiles();
        }
    }, [selectedTenantId]);

    const handleView = async (fileId: string) => {
        try {
            const res = await fetch(`/api/knowledge-base/${fileId}/view-url`);
            if (res.ok) {
                const data = await res.json();
                window.open(data.view_url, '_blank');
            } else {
                throw new Error("Failed to get view URL");
            }
        } catch (error: any) {
            console.error("View error:", error);
            toast({
                title: "View failed",
                description: error.message || "Failed to open document.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (fileId: string) => {
        try {
            const res = await fetch(`/api/knowledge-base/${fileId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                // Remove file from UI
                setFiles(prev => prev.filter(f => f.id !== fileId));
                toast({
                    title: "File deleted",
                    description: "Document has been removed from knowledge base.",
                });
            } else {
                throw new Error("Failed to delete file");
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast({
                title: "Delete failed",
                description: error.message || "Failed to delete document.",
                variant: "destructive",
            });
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTenantId) return;

        const validTypes = ['application/pdf', 'text/csv'];
        // Check mime type or extension
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const isCsv = file.name.toLowerCase().endsWith('.csv');

        if (!isPdf && !isCsv) {
            toast({
                title: "Invalid file type",
                description: "Please upload a PDF or CSV file.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        const tempId = Math.random().toString();

        // Optimistic UI
        const tempFile: KnowledgeBaseFile = {
            id: tempId,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            status: "in_progress",
            uploadedAt: new Date(),
        };
        setFiles(prev => [tempFile, ...prev]);

        try {
            // 1. Get Presigned URL
            const urlRes = await fetch("/api/knowledge-base/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: selectedTenantId,
                    file_name: file.name,
                    file_type: isPdf ? 'pdf' : 'csv',
                    file_size: file.size,
                    content_type: file.type || 'application/octet-stream'
                })
            });

            if (!urlRes.ok) {
                const err = await urlRes.json();
                throw new Error(err.message || "Failed to get upload URL");
            }
            const { upload_url, file_id } = await urlRes.json();

            // 2. Upload to S3
            // Note: No auth headers here, it's a presigned URL
            const uploadRes = await fetch(upload_url, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type || 'application/octet-stream'
                }
            });

            if (!uploadRes.ok) throw new Error("Failed to upload to storage");

            // 3. Confirm Upload
            const confirmRes = await fetch(`/api/knowledge-base/confirm-upload/${file_id}`, {
                method: "POST"
            });

            if (!confirmRes.ok) throw new Error("Failed to confirm upload");

            const confirmedFile = await confirmRes.json();

            // Update UI with real file
            setFiles(prev => prev.map(f => f.id === tempId ? {
                ...f,
                id: confirmedFile.id,
                status: 'done'
            } : f));

            toast({
                title: "Upload successful",
                description: `${file.name} has been uploaded.`,
            });

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Upload failed",
                description: error.message || "Something went wrong while uploading.",
                variant: "destructive",
            });
            // Remove temp file
            setFiles(prev => prev.filter(f => f.id !== tempId));
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.csv"
                onChange={handleFileChange}
                disabled={isLoading}
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-muted-foreground mt-1">
                        Upload documents (PDF, CSV) to train your AI agent.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Tenant Selector for Platform Users */}
                    {(user?.role === 'super_admin' || user?.role === 'platform_user' || user?.role === 'tenant_admin') && tenants.length > 0 && (
                        <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Tenant" />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {selectedTenantId && (
                        <Button onClick={handleUploadClick} disabled={isLoading} className="cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700">
                            <CloudUpload className="mr-2 h-4 w-4" />
                            {isLoading ? "Uploading..." : "Upload Document"}
                        </Button>
                    )}
                </div>
            </div>

            {!selectedTenantId ? (
                <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed text-center">
                    <p className="text-muted-foreground">Please select a tenant to view knowledge base.</p>
                </div>
            ) : files.length === 0 && !isLoading ? (
                <EmptyState onUpload={handleUploadClick} />
            ) : (
                <FileList files={files} onView={handleView} />
            )}
        </div>
    );
}
