"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogsPage() {
    const [logs, setLogs] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/logs");
            if (!res.ok) {
                if (res.status === 404) throw new Error("Log file not found.");
                throw new Error("Failed to fetch logs.");
            }
            const text = await res.text();
            setLogs(text);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDownload = () => {
        const blob = new Blob([logs], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `application-logs-${new Date().toISOString()}.log`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="container py-6 animate-in fade-in duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        System Logs
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View and analyze system application logs.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!logs || loading}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <div className="flex items-center gap-2 font-semibold">
                        <FileText className="h-4 w-4" />
                        Error
                    </div>
                    <p className="mt-1 text-sm">{error}</p>
                </div>
            )}

            <Card className="border-secondary/50 shadow-md bg-zinc-950 text-zinc-50 dark:bg-zinc-950">
                <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="ml-2 text-xs font-mono text-zinc-400">application.log</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[600px] overflow-auto p-4 font-mono text-xs md:text-sm whitespace-pre">
                        {loading ? (
                            <div className="flex h-full items-center justify-center text-zinc-500">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Loading logs...</span>
                            </div>
                        ) : logs ? (
                            logs
                        ) : (
                            <div className="flex h-full items-center justify-center text-zinc-500">
                                No logs available.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
