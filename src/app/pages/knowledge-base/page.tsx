"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/knowledge-base/empty-state";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { FileList, KnowledgeBaseFile } from "@/components/knowledge-base/file-list";
import { UploadModal } from "@/components/knowledge-base/upload-modal";
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

import { PageHeader } from "@/components/shared/page-header";
import { getErrorMessage } from "@/lib/utils";

function KnowledgeBaseContent() {
    const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const urlTenantId = searchParams.get('tenantId');
    const { user } = useAuth();

    // Fetch Tenants based on user role
    useEffect(() => {
        const loadTenants = async () => {
            try {
                setIsLoadingTenants(true);

                if (user?.role === 'super_admin' || user?.role === 'platform_user' || user?.role === 'tenant_admin') {
                    const res = await fetch("/api/tenants");
                    if (res.ok) {
                        const data = await res.json();
                        setTenants(data);

                        if (urlTenantId) {
                            setSelectedTenantId(urlTenantId);
                        } else if (data.length > 0) {
                            setSelectedTenantId(data[0].id);
                        }
                    }
                } else {
                    const res = await fetch("/api/tenants");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.length > 0) {
                            setTenants([data[0]]);
                            setSelectedTenantId(data[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load tenants", error);
            } finally {
                setIsLoadingTenants(false);
            }
        };

        if (user) {
            loadTenants();
        }
    }, [user, urlTenantId]);

    // FETCH FILES
    const fetchFiles = async (tenantList: Tenant[] = tenants) => {
        if (tenantList.length === 0) return;

        try {
            setIsLoading(true);
            const allFiles: KnowledgeBaseFile[] = [];

            // If we have multiple tenants, we want to show all of them as per user request
            // We use Promise.all to fetch from all tenants in parallel
            const fetchPromises = tenantList.map(async (tenant) => {
                try {
                    const res = await fetch(`/api/knowledge-base?tenant_id=${tenant.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        return data.map((f: any) => ({
                            id: f.id,
                            name: f.file_name,
                            workspaceName: tenant.name,
                            type: f.file_type?.toUpperCase() || 'PDF',
                            size: (f.file_size / (1024 * 1024)).toFixed(2) + " MB",
                            raw_size: f.file_size,
                            status: f.status,
                            uploadedAt: new Date(f.created_at),
                            storage_url: f.storage_url || `${process.env.NEXT_PUBLIC_SPACES_URL}/${f.storage_key}`,
                            estimated_time: f.estimated_time,
                            tenantId: tenant.id // Keep track of which tenant this belongs to
                        }));
                    }
                } catch (err) {
                    console.error(`Failed to fetch files for tenant ${tenant.id}`, err);
                }
                return [];
            });

            const results = await Promise.all(fetchPromises);
            results.forEach(fileGroup => allFiles.push(...fileGroup));

            // Sort by uploadedAt descending
            allFiles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

            setFiles(allFiles);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tenants.length > 0) {
            fetchFiles();
        }
    }, [tenants]);

    const handleView = async (fileId: string) => {
        try {
            const res = await fetch(`/api/knowledge-base/${fileId}/view-url`);
            if (res.ok) {
                const data = await res.json();
                window.open(data.view_url, '_blank');
            } else {
                throw new Error("Failed to get view URL");
            }
        } catch (error: unknown) {
            console.error("View error:", error);
            toast({
                title: "View failed",
                description: getErrorMessage(error) || "Failed to open document.",
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
                setFiles(prev => prev.filter(f => f.id !== fileId));
                toast({
                    title: "File deleted",
                    description: "Document has been removed from knowledge base.",
                });
            } else {
                throw new Error("Failed to delete file");
            }
        } catch (error: unknown) {
            console.error("Delete error:", error);
            toast({
                title: "Delete failed",
                description: getErrorMessage(error) || "Failed to delete document.",
                variant: "destructive",
            });
        }
    };

    const handleProcess = async (fileId: string) => {
        try {
            const res = await fetch(`/api/knowledge-base/${fileId}/process`, {
                method: "POST",
            });

            if (res.ok) {
                const updatedFile = await res.json();
                setFiles(prev => prev.map(f => f.id === fileId ? {
                    ...f,
                    status: updatedFile.status === 'uploaded' ? 'in_progress' : updatedFile.status
                } : f));

                toast({
                    title: "Processing started",
                    description: "Document is being processed in the background.",
                });

                setTimeout(() => fetchFiles(), 2000);
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to trigger processing");
            }
        } catch (error: unknown) {
            console.error("Process error:", error);
            toast({
                title: "Processing failed",
                description: getErrorMessage(error) || "Failed to trigger document processing.",
                variant: "destructive",
            });
        }
    };

    const handleStop = async (fileId: string) => {
        try {
            const res = await fetch(`/api/knowledge-base/${fileId}/stop`, {
                method: "POST",
            });

            if (res.ok) {
                const updatedFile = await res.json();
                setFiles(prev => prev.map(f => f.id === fileId ? {
                    ...f,
                    status: updatedFile.status
                } : f));

                toast({
                    title: "Processing stopped",
                    description: "Document processing has been cancelled.",
                });
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to stop processing");
            }
        } catch (error: unknown) {
            console.error("Stop error:", error);
            toast({
                title: "Stop failed",
                description: getErrorMessage(error) || "Failed to stop document processing.",
                variant: "destructive",
            });
        }
    };

    const handleUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTenantId) return;

        const validExtensions = ['.txt', '.doc', '.docx', '.pdf', '.csv'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(ext)) {
            toast({
                title: "Invalid file type",
                description: "Please upload a TXT, DOC, DOCX, PDF, or CSV file.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        const tempId = Math.random().toString();
        const workspaceName = tenants.find(t => t.id === selectedTenantId)?.name || "Default";

        const tempFile: KnowledgeBaseFile = {
            id: tempId,
            name: file.name,
            workspaceName: workspaceName,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            status: "in_progress",
            uploadedAt: new Date(),
        };
        setFiles(prev => [tempFile, ...prev]);

        try {
            const urlRes = await fetch("/api/knowledge-base/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: selectedTenantId,
                    file_name: file.name,
                    file_type: ext.replace('.', ''),
                    file_size: file.size,
                    content_type: file.type || 'application/octet-stream'
                })
            });

            if (!urlRes.ok) {
                const err = await urlRes.json();
                throw new Error(err.message || "Failed to get upload URL");
            }
            const { upload_url, file_id } = await urlRes.json();

            const uploadRes = await fetch(upload_url, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type || 'application/octet-stream'
                }
            });

            if (!uploadRes.ok) throw new Error("Failed to upload to storage");

            const confirmRes = await fetch(`/api/knowledge-base/confirm-upload/${file_id}`, {
                method: "POST"
            });

            if (!confirmRes.ok) throw new Error("Failed to confirm upload");

            const confirmedFile = await confirmRes.json();

            setFiles(prev => prev.map(f => f.id === tempId ? {
                ...f,
                id: confirmedFile.id,
                status: 'done'
            } : f));

            toast({
                title: "Upload successful",
                description: `${file.name} has been uploaded.`,
            });

        } catch (error: unknown) {
            console.error(error);
            toast({
                title: "Upload failed",
                description: getErrorMessage(error) || "Something went wrong while uploading.",
                variant: "destructive",
            });
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
                accept=".txt,.doc,.docx,.pdf,.csv"
                onChange={handleFileChange}
                disabled={isLoading}
            />
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={() => fetchFiles()}
                initialTenantId={selectedTenantId}
                tenants={tenants}
            />

            <PageHeader
                title="Knowledge Base"
                description="Upload documents to train your AI agent"
                icon={CloudUpload}
                gradient="from-blue-500 to-indigo-600"
                howItWorks="The Knowledge Base is the brain of your AI agent. When you upload a document, our system parses its content and breaks it down into 'chunks' that the AI can understand. You must explicitly 'Process' a document after uploading it to make it available for the AI. Supported formats: TXT, DOC, DOCX, PDF, and CSV. Each workspace has its own isolated knowledge base."
                actions={tenants.length > 0 ? (
                    <Button onClick={handleUploadClick} disabled={isLoading} className="cursor-pointer gap-2 bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl border border-white/10 text-white">
                        <CloudUpload className="mr-2 h-5 w-5" />
                        {isLoading ? "Uploading..." : "Upload Document"}
                    </Button>
                ) : (
                    !isLoadingTenants && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold animate-pulse">
                            Create workspace first to upload docs
                        </div>
                    )
                )}
            />

            {tenants.length === 0 && !isLoadingTenants ? (
                <div className="mt-8">
                    <NoWorkspaceState message="Create a workspace first then you can upload docs" />
                </div>
            ) : files.length === 0 && !isLoading ? (
                <EmptyState onUpload={handleUploadClick} />
            ) : (
                <FileList files={files} onView={handleView} onProcess={handleProcess} onStop={handleStop} />
            )}
        </div>
    );
}

export default function KnowledgeBasePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <p className="text-muted-foreground">Loading Knowledge Base...</p>
            </div>
        }>
            <KnowledgeBaseContent />
        </Suspense>
    );
}
