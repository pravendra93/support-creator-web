"use client";

import { useState, useRef } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/knowledge-base/empty-state";
import { FileList, KnowledgeBaseFile } from "@/components/knowledge-base/file-list";

// Mock data

export default function KnowledgeBasePage() {
    const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['application/pdf', 'text/csv'];
            const validExtensions = ['.pdf', '.csv'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                alert("Invalid file type. Please upload a PDF or CSV file.");
                return;
            }

            // Simulate upload
            const newFile: KnowledgeBaseFile = {
                id: Math.random().toString(36).substring(7),
                name: file.name,
                type: fileExtension.replace('.', '').toUpperCase(), // Add this
                size: (file.size / (1024 * 1024)).toFixed(1) + " MB", // Changed from 2 to 1 decimal place to match design style
                status: "in_progress",
                uploadedAt: new Date(),
            };
            setFiles([newFile, ...files]);
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
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-muted-foreground mt-1">
                        Upload documents (PDF, CSV, DOCX) to train your AI agent.
                    </p>
                </div>
                {files.length > 0 && (
                    <Button onClick={handleUploadClick} className="cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700">
                        <CloudUpload className="h-4 w-4" />
                        Upload Document
                    </Button>
                )}
            </div>

            {files.length === 0 ? (
                <EmptyState onUpload={handleUploadClick} />
            ) : (
                <FileList files={files} />
            )}
        </div>
    );
}
