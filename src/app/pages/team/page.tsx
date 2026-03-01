import { PageHeader } from "@/components/shared/page-header";
import { Users } from "lucide-react";

export default function TeamsPage() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Team Management"
                description="Manage your team members and their access levels."
                icon={Users}
                gradient="from-pink-500 to-rose-600"
                howItWorks="Collaboration is key to building better AI agents. On this page, you can invite team members to your workspaces, assign them specific roles (Admin, Moderator, Observer), and track their activity. Roles ensure that sensitive configurations, like API keys or knowledge base deletions, are only accessible by authorized personnel."
            />
            <div className="flex flex-col items-center justify-center py-20 bg-[#13171F]/50 rounded-[32px] border border-white/5 border-dashed">
                <Users className="w-16 h-16 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-400">Team features coming soon</h3>
                <p className="text-slate-500 text-sm max-w-xs text-center mt-2 font-medium">We're building a robust multi-user collaboration system for your workspaces.</p>
            </div>
        </div>
    );
}
