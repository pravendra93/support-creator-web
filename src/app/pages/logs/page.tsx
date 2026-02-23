"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, RefreshCw, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LogsData = {
    app_logs: string;
    error_logs: string;
    nginx_access: string;
    nginx_error: string;
    gunicorn: string;
};

const renderLogs = (rawLogs: string) => {
    const lines = rawLogs.split("\n").filter(line => line.trim() !== "");

    return (
        <div className="flex flex-col overflow-x-auto">
            {lines.map((line, index) => {
                try {
                    const logObj = JSON.parse(line);

                    const timestamp = logObj.timestamp || logObj.time || logObj.asctime || "";
                    const level = (logObj.level || logObj.levelname || "INFO").toUpperCase();
                    const message = logObj.message || logObj.msg || logObj.event || "";

                    let levelColor = "text-zinc-400";
                    if (level === "ERROR" || level === "CRITICAL" || level === "FATAL") levelColor = "text-red-400 font-bold";
                    else if (level === "WARNING" || level === "WARN") levelColor = "text-yellow-400 font-semibold";
                    else if (level === "INFO") levelColor = "text-blue-400 font-semibold";
                    else if (level === "DEBUG") levelColor = "text-zinc-500";

                    const { timestamp: _t, time: _ti, asctime: _a, level: _l, levelname: _ln, message: _m, msg: _ms, event: _e, ...rest } = logObj;
                    const hasExtra = Object.keys(rest).length > 0;

                    return (
                        <div key={index} className="flex gap-4 border-b border-zinc-800/30 hover:bg-zinc-800/30 p-1 -mx-1 rounded transition-colors text-xs md:text-sm">
                            {timestamp && <span className="text-zinc-500 whitespace-nowrap">{timestamp}</span>}
                            <span className={`w-14 shrink-0 ${levelColor}`}>{level}</span>
                            <span className="text-zinc-300 break-all">
                                {message}
                                {hasExtra && (
                                    <span className="ml-3 text-zinc-500">
                                        {JSON.stringify(rest)}
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                } catch (e) {
                    return (
                        <div key={index} className="text-zinc-400 border-b border-zinc-800/30 hover:bg-zinc-800/30 p-1 -mx-1 rounded transition-colors text-xs md:text-sm break-all">
                            {line}
                        </div>
                    );
                }
            })}
        </div>
    );
};

export default function LogsPage() {
    const [logs, setLogs] = useState<LogsData>({ app_logs: "", error_logs: "", nginx_access: "", nginx_error: "", gunicorn: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("app_logs");

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/logs");
            if (!res.ok) {
                if (res.status === 404) throw new Error("Log file not found.");
                throw new Error("Failed to fetch logs.");
            }
            const data: LogsData = await res.json();
            setLogs({
                app_logs: data.app_logs || "",
                error_logs: data.error_logs || "",
                nginx_access: data.nginx_access || "",
                nginx_error: data.nginx_error || "",
                gunicorn: data.gunicorn || "",
            });
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
        const content = logs[activeTab as keyof LogsData] || "";
        const blob = new Blob([content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeTab.replace("_", "-")}-${new Date().toISOString()}.log`;
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
                    <Button variant="secondary" size="sm" onClick={handleDownload} disabled={loading || !logs[activeTab as keyof LogsData]}>
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

            <Tabs defaultValue="app_logs" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="app_logs" className="cursor-pointer">App Logs</TabsTrigger>
                    <TabsTrigger value="error_logs" className="cursor-pointer">Errors</TabsTrigger>
                    <TabsTrigger value="nginx_access" className="cursor-pointer">Nginx Access</TabsTrigger>
                    <TabsTrigger value="nginx_error" className="cursor-pointer">Nginx Error</TabsTrigger>
                    <TabsTrigger value="gunicorn" className="cursor-pointer">Gunicorn</TabsTrigger>
                </TabsList>

                {(["app_logs", "error_logs", "nginx_access", "nginx_error", "gunicorn"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="m-0">
                        <Card className="border-secondary/50 shadow-md bg-zinc-950 text-zinc-50 dark:bg-zinc-950">
                            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                    <span className="ml-2 text-xs font-mono text-zinc-400">
                                        {tab === "app_logs" ? "app.log" : tab === "error_logs" ? "errors.log" : tab === "nginx_access" ? "access.log" : tab === "nginx_error" ? "error.log" : "gunicorn.log"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-[600px] overflow-auto p-4 font-mono text-xs md:text-sm whitespace-pre-wrap">
                                    {loading ? (
                                        <div className="flex h-full items-center justify-center text-zinc-500">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <span className="ml-2">Loading logs...</span>
                                        </div>
                                    ) : logs[tab] ? (
                                        renderLogs(logs[tab])
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-zinc-500">
                                            No logs available.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
