import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Task {
    uuid: string;
    name: string;
    state: string;
    received: number;
    started: number;
    runtime: number;
    worker: string;
}

export function RecentTasks({ tasks }: { tasks: Task[] }) {
    const getStatusColor = (state: string) => {
        switch (state) {
            case "SUCCESS":
                return "default";
            case "FAILURE":
                return "destructive";
            case "STARTED":
                return "secondary";
            case "RECEIVED":
                return "outline";
            default:
                return "outline";
        }
    };

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>Worker</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Runtime</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No tasks found
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.uuid}>
                                    <TableCell className="font-mono text-xs truncate max-w-[100px]" title={task.uuid}>
                                        {task.uuid.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>{task.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(task.state) as "default" | "destructive" | "secondary" | "outline"}>
                                            {task.state}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{task.worker}</TableCell>
                                    <TableCell>
                                        {task.started
                                            ? formatDistanceToNow(new Date(task.started * 1000), { addSuffix: true })
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {task.runtime ? `${task.runtime.toFixed(2)}s` : "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
