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

interface Worker {
    hostname: string;
    status: boolean;
    active: number;
    processed: number;
    failed: number;
    loadavg: number[];
}

export function WorkerList({ workers }: { workers: Worker[] }) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Worker Nodes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hostname</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Processed</TableHead>
                            <TableHead>Failed</TableHead>
                            <TableHead>Load Avg</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workers.map((worker) => (
                            <TableRow key={worker.hostname}>
                                <TableCell className="font-medium">{worker.hostname}</TableCell>
                                <TableCell>
                                    <Badge variant={worker.status ? "default" : "destructive"}>
                                        {worker.status ? "Online" : "Offline"}
                                    </Badge>
                                </TableCell>
                                <TableCell>{worker.active}</TableCell>
                                <TableCell>{worker.processed}</TableCell>
                                <TableCell>{worker.failed}</TableCell>
                                <TableCell>{worker.loadavg.join(", ")}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
