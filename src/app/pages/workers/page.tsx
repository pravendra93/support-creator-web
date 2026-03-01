"use client";

import { useEffect, useState, useCallback } from "react";
import { WorkerStats } from "@/components/workers/worker-stats";
import { WorkerList } from "@/components/workers/worker-list";
import { RecentTasks } from "@/components/workers/recent-tasks";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function WorkersPage() {
    const [loading, setLoading] = useState(true);
    const [workers, setWorkers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total_workers: 0,
        active_tasks: 0,
        processed_tasks: 0,
        failed_tasks: 0,
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch workers (flower exposes /api/workers with different structure, usually an object)
            // We'll normalize it here.
            // Flower API: GET /api/workers
            // Returns: { "worker1@host": { ... }, "worker2@host": { ... } }
            const workersRes = await fetch("/api/flower/api/workers");
            if (!workersRes.ok) throw new Error("Failed to fetch workers");
            const workersData = await workersRes.json();

            // Fetch tasks
            // Flower API: GET /api/tasks?limit=50
            const tasksRes = await fetch("/api/flower/api/tasks?limit=20&sort_by=started&desc=1");
            if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
            const tasksData = await tasksRes.json();
            // Tasks is usually an object of ID -> Task. We need array.
            const tasksArray = Object.values(tasksData || {});

            // Process Workers Data
            const workersList = Object.entries(workersData || {}).map(([name, data]: [string, any]) => ({
                hostname: name,
                status: data.status,
                active: Object.keys(data.active || {}).length,
                processed: data.stats?.pool?.total || 0, // This might vary based on Celery version, simplistic fallback
                failed: 0, // Needs aggregation from tasks or another endpoint
                loadavg: data.loadavg || [0, 0, 0],
            }));

            // Calculate aggregate stats
            const totalWorkers = workersList.length;
            const activeTasksCount = workersList.reduce((acc, w) => acc + w.active, 0);

            // Flower task objects keys: uuid, name, state, received, started, runtime, worker
            const processedCount = tasksArray.filter((t: unknown) => t.state === "SUCCESS").length;
            const failedCount = tasksArray.filter((t: unknown) => t.state === "FAILURE").length;

            setWorkers(workersList);
            setTasks(tasksArray);
            setStats({
                total_workers: totalWorkers,
                active_tasks: activeTasksCount,
                processed_tasks: processedCount,
                failed_tasks: failedCount,
            });

        } catch (error) {
            console.error(error);
            toast({
                title: "Error fetching worker data",
                description: "Could not connect to Flower service",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5s poll
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Background Workers</h2>
                <div className="flex items-center space-x-2">
                    <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
                        <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <WorkerStats stats={stats} />

            <div className="grid gap-4 grid-cols-1">
                <WorkerList workers={workers} />
                <RecentTasks tasks={tasks} />
            </div>
        </div>
    );
}
