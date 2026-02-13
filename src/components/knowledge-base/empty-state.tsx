import { UploadCloud, BookOpen, FileText, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    onUpload: () => void;
}

export function EmptyState({ onUpload }: EmptyStateProps) {
    return (
        <div className="flex flex-col gap-8">
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

            <div className="flex flex-col gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">Learn more about Knowledge bases</h2>
                    <p className="text-sm text-muted-foreground">
                        Learn about our knowledge bases, how to add your data to them, and other best practices.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-6 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <BookOpen className="h-4 w-4" />
                                <span>WHAT IS A KNOWLEDGE BASE?</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                A knowledge base is a repository of vector embeddings made from your data that your agent can reference to answer domain-specific questions.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border p-6 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <FileText className="h-4 w-4" />
                                <span>SUPPORTED FORMATS FOR KNOWLEDGE BASE</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                Knowledge bases currently support text-based data, such as information in .txt, .doc, .docx, .pdf, .csv files.
                            </p>
                        </div>
                    </div>

                    {/* <div className="rounded-lg border p-6 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-semibold text-primary">
                                <Layers className="h-4 w-4" />
                                <span>PRODUCT DOCS</span>
                            </div>
                            <div className="mt-2 flex flex-col gap-2">
                                <a href="#" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                                    Overview
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                                <a href="#" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                                    Best Practices
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
