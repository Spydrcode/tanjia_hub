"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Flag, UserPlus, Video, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function Composer() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleAction = (action: string) => {
    if (!text.trim()) return;

    // Store in sessionStorage to prefill on destination page
    sessionStorage.setItem("tanjia_composer_text", text);
    sessionStorage.setItem("tanjia_composer_action", action);

    // Navigate based on action
    switch (action) {
      case "reply":
        router.push("/tanjia/support?from=composer");
        break;
      case "followup":
        router.push("/tanjia/followups?action=new&from=composer");
        break;
      case "lead":
        router.push("/tanjia/leads?action=new&from=composer");
        break;
      case "meeting":
        router.push("/tanjia/meetings?action=new&from=composer");
        break;
      default:
        break;
    }

    setText("");
  };

  const actions = [
    {
      id: "reply",
      label: "Draft reply",
      icon: MessageSquare,
      description: "Turn this into a response",
    },
    {
      id: "followup",
      label: "Create follow-up",
      icon: Flag,
      description: "Set a reminder",
    },
    {
      id: "lead",
      label: "Log lead",
      icon: UserPlus,
      description: "Add as new contact",
    },
    {
      id: "meeting",
      label: "Meeting notes",
      icon: Video,
      description: "Turn into notes",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-all",
        isFocused ? "border-emerald-300 shadow-md" : "border-neutral-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2">
        <Sparkles className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-neutral-700">Quick capture</span>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste a comment, a lead message, or call notes…"
          className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 p-3 sm:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            disabled={!text.trim()}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-center transition",
              text.trim()
                ? "hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm"
                : "cursor-not-allowed opacity-50"
            )}
            title={action.description}
          >
            <action.icon className="h-4 w-4 text-neutral-600" />
            <span className="text-xs font-medium text-neutral-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
