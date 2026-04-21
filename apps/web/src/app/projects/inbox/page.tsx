// app/projects/inbox/page.tsx
import React from "react";
import { Inbox, CheckCircle2 } from "lucide-react";

export default function InboxPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-card rounded-3xl border border-border shadow-sm mx-4 mt-4 lg:mx-0 lg:mt-0 lg:h-full">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-border mb-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">You're all caught up!</h2>
        <p className="text-slate-500 font-medium">
          There are no new notifications or messages in your inbox. Relax and enjoy your day!
        </p>
      </div>
    </div>
  );
}
