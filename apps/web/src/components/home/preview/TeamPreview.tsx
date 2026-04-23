import React from "react";
import { Users } from "lucide-react";

export default function TeamPreview() {
  return (
    <div className="flex-1 p-6 md:p-8 bg-background/30 overflow-hidden flex flex-col gap-6 relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Team Members
          </h2>
          <p className="text-sm text-text-muted mt-1">
            12 active members across 3 teams
          </p>
        </div>
        <button className="px-4 py-2 bg-card border border-border text-text text-sm font-medium rounded-lg hover:bg-muted shadow-sm transition-colors flex items-center gap-2">
          <Users className="w-4 h-4" /> Invite
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <TeamMemberCard
          name="Uta Kotobuki"
          role="Lead Engineer"
          status="online"
          initials="UK"
          color="from-blue-500 to-indigo-600"
          tasks={4}
        />
        <TeamMemberCard
          name="Nanda Shuzie"
          role="Product Designer"
          status="offline"
          initials="NS"
          color="from-pink-500 to-rose-600"
          tasks={2}
        />
        <TeamMemberCard
          name="Rasendriya"
          role="Frontend Dev"
          status="online"
          initials="R"
          color="from-emerald-500 to-teal-600"
          tasks={5}
        />
        <TeamMemberCard
          name="Iamz"
          role="Backend Dev"
          status="busy"
          initials="I"
          color="from-orange-500 to-red-600"
          tasks={3}
        />
        <TeamMemberCard
          name="Golip"
          role="QA Engineer"
          status="online"
          initials="G"
          color="from-violet-500 to-purple-600"
          tasks={1}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
    </div>
  );
}

function TeamMemberCard({ name, role, status, initials, color, tasks }: any) {
  return (
    <div className="p-5 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md group cursor-pointer">
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-xl font-bold text-white shadow-lg ring-4 ring-background group-hover:scale-105 transition-transform`}
        >
          {initials}
        </div>
        <div
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${status === "online" ? "bg-[#27C93F]" : status === "busy" ? "bg-[#FFBD2E]" : "bg-muted"}`}
        ></div>
      </div>
      <div>
        <div className="font-bold text-sm text-text group-hover:text-primary transition-colors">
          {name}
        </div>
        <div className="text-xs font-medium text-text-muted mt-0.5">{role}</div>
      </div>
      <div className="mt-1 text-[10px] font-semibold bg-muted/50 text-text-muted px-2.5 py-1 rounded-md border border-border">
        {tasks} active tasks
      </div>
    </div>
  );
}
