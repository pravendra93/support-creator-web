'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LogsPage() {
    const [logs, setLogs] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/logs');
            if (!res.ok) {
                if (res.status === 403 || res.status === 401) {
                    throw new Error("You don't have permission to view logs");
                }
                throw new Error('Failed to fetch logs');
            }
            const text = await res.text();
            setLogs(text);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDownload = () => {
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `application-${new Date().toISOString()}.log`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={handleDownload} disabled={!logs}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
            </div>

            <Card className="h-[calc(100vh-200px)]">
                <CardHeader>
                    <CardTitle>Application Log</CardTitle>
                    <CardDescription>
                        View backend and frontend logs. sensitive data might be masked.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-full pb-10">
                    {error ? (
                        <div className="flex h-full items-center justify-center text-destructive">
                            {error}
                        </div>
                    ) : (
                        <div className="h-[calc(100%-80px)] w-full rounded-md border bg-muted/50 p-4 overflow-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                {logs || 'No logs found.'}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
