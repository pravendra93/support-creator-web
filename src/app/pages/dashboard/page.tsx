"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, MessageSquare, Users, Zap, Search, Clock, ArrowUpRight, Signal, Cpu, Server, Database, LayoutGrid, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";

import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/dashboard/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-slate-400 animate-pulse">Loading dashboard metrics...</p>
                </div>
            </div>
        );
    }

    const isSuperAdmin = stats?.role === "super_admin";
    const joinDate = stats?.account_created_at
        ? new Date(stats.account_created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : "N/A";

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
            <PageHeader
                title={isSuperAdmin ? "Command Center" : `Welcome, ${stats?.user_email ? stats.user_email.split('@')[0] : 'Creator'}!`}
                description={isSuperAdmin ? "System-wide operational overview." : "Here's what's happening in your workspace today."}
                icon={LayoutGrid}
                gradient="from-cyan-500 to-blue-600"
                howItWorks="The dashboard provides a high-level view of your AI infrastructure. For regular users, you can monitor active bots, workspace count, and recent engagement. For administrators, this page provides hardware health, global tenant counts, and system-wide traffic signals. Use the 'Live Conversations' panel to watch real-time interactions."
                actions={
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-pulse">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Online
                    </div>
                }
            />

            {/* Top Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isSuperAdmin ? (
                    <>
                        <MetricCard
                            title="System Load (CPU)"
                            value={`${stats?.cpu_usage || 0}%`}
                            change="Real-time"
                            icon={Cpu}
                            gradient="from-red-500 to-orange-500"
                        />
                        <MetricCard
                            title="Total Tenants"
                            value={(stats?.total_tenants || 0).toLocaleString()}
                            change="Active"
                            icon={Server}
                            gradient="from-blue-500 to-cyan-400"
                        />
                        <MetricCard
                            title="Total Users"
                            value={(stats?.total_users || 0).toLocaleString()}
                            change="Global"
                            icon={Users}
                            gradient="from-purple-500 to-pink-500"
                        />
                        <MetricCard
                            title="Total Conversations"
                            value={(stats?.total_conversations || 0).toLocaleString()}
                            change="All Time"
                            icon={Database}
                            gradient="from-emerald-500 to-teal-400"
                        />
                    </>
                ) : (
                    <>
                        <MetricCard
                            title="Current Plan"
                            value={stats?.plan ? stats.plan.toUpperCase() : "TRIAL"}
                            change="Active"
                            icon={Zap}
                            gradient="from-amber-500 to-orange-400"
                        />
                        <MetricCard
                            title="Workspaces"
                            value={(stats?.workspace_count || 0).toLocaleString()}
                            change="Total Owned"
                            icon={LayoutGrid}
                            gradient="from-blue-500 to-cyan-400"
                        />
                        <MetricCard
                            title="Active Bots"
                            value={(stats?.active_bots_count || 0).toLocaleString()}
                            change="Deployed"
                            icon={Activity}
                            gradient="from-emerald-500 to-teal-400"
                        />
                        <MetricCard
                            title="Total Conversations"
                            value={(stats?.total_conversations || 0).toLocaleString()}
                            change="This Workspace"
                            icon={MessageSquare}
                            gradient="from-purple-500 to-pink-500"
                        />
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-3">

                {/* Live Conversations Panel (Left 2/3) */}
                <Card className="col-span-4 lg:col-span-2 border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Live Conversations</CardTitle>
                                <CardDescription>Real-time feed of ongoing chats</CardDescription>
                            </div>
                            <Activity className="h-5 w-5 text-slate-400 animate-pulse" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] w-full pr-4">
                            {/* Empty State / Placeholder */}
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
                                <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                                    <div className="absolute inset-0 border-2 border-dashed border-slate-700 rounded-full animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-2 border border-slate-800 rounded-full" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent rounded-full animate-pulse" />
                                    <Search className="relative w-8 h-8 text-slate-500" />

                                    {/* Radar Sweep Effect */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-cyan-500/20 origin-right animate-[spin_3s_linear_infinite]" style={{ transformOrigin: '100% 50%' }} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-medium text-slate-200">Waiting for signals...</h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    No active conversations at the moment. Your AI agents are standing by and ready to engage instantly.
                                </p>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* System Status / Recent Activity (Right 1/3) */}
                <Card className="col-span-3 lg:col-span-1 border-white/5 bg-slate-900/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-xl">
                            {isSuperAdmin ? "System Health" : "Account Overview"}
                        </CardTitle>
                        <CardDescription>
                            {isSuperAdmin ? "Operational status & limits" : "Your profile details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isSuperAdmin ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Cpu className="w-4 h-4" /> Server Load</span>
                                        <span className="text-emerald-400 font-mono">{stats?.cpu_usage || 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(stats?.cpu_usage || 0, 5)}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Signal className="w-4 h-4" /> API Latency</span>
                                        <span className="text-blue-400 font-mono">45ms</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[15%] rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Global Convos</span>
                                        <span className="text-purple-400 font-mono">{(stats?.total_conversations || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[25%] rounded-full" />
                                    </div>
                                </div>
                                <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/5">
                                    <h4 className="text-sm font-medium text-slate-200 mb-2">Updates</h4>
                                    <p className="text-sm text-slate-400">System maintenance scheduled for Feb 28th.</p>
                                </div>
                            </>
                        ) : (
                            // TENANT PROFILE
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {stats?.user_email?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-white truncate" title={stats?.user_email}>{stats?.user_email || "User"}</p>
                                        <p className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full inline-block mt-1">Platform User</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" /> Member Since</span>
                                        <span className="text-slate-200">{joinDate}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Server className="w-4 h-4" /> Primary Tenant</span>
                                        <span className="text-slate-200 truncate max-w-[120px]" title={stats?.tenant_name}>{stats?.tenant_name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Database className="w-4 h-4" /> KB Files</span>
                                        <span className="text-slate-200">{(stats?.kb_file_count || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                                    <p className="text-xs text-blue-300 leading-relaxed">
                                        <Zap className="w-3 h-3 inline mr-1 mb-0.5" />
                                        Your {stats?.plan || "Trial"} plan includes <strong>{(stats?.workspace_count || 0) + 2}</strong> more workspaces.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, icon: Icon, gradient }: { title: string, value: string, change: string, icon: any, gradient: string }) {
    return (
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/60 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} opacity-80 group-hover:opacity-100 transition-opacity shadow-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                    {value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-emerald-400 font-medium flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                        {change}
                    </span>
                    {/* <span className="text-slate-500">vs last month</span> */}
                </p>

                {/* Subtle bottom glow line */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-sm`} />
            </CardContent>
        </Card>
    );
}
