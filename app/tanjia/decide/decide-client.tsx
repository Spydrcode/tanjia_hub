'use client';

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, Plus, MessageCircle, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { markFollowupDone, snoozeFollowup, createFollowup } from "@/app/tanjia/leads/actions";
import { tanjiaConfig } from "@/lib/tanjia-config";

type Lead = {
  id: string;
  name: string;
};

type FollowUp = {
  id: string;
  leadId: string;
  leadName: string;
  note: string;
  dueAt: string | null;
  done: boolean;
};

type Props = {
  followUps: FollowUp[];
  leads: Lead[];
};

export function DecideClient({ followUps, leads }: Props) {
  const [items, setItems] = useState(followUps);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLeadId, setNewLeadId] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  const pending = items.filter(f => !f.done);
  const completed = items.filter(f => f.done);
  const currentMove = pending[0];

  const handleComplete = (id: string, leadId: string) => {
    // Optimistic update
    setItems(prev => prev.map(f => 
      f.id === id ? { ...f, done: true } : f
    ));
    
    startTransition(async () => {
      await markFollowupDone(id, leadId);
    });
  };

  const handleSnooze = (id: string, days: number) => {
    // Optimistic update
    setItems(prev => prev.map(f => {
      if (f.id !== id) return f;
      const current = new Date(f.dueAt || new Date());
      current.setDate(current.getDate() + days);
      return { ...f, dueAt: current.toISOString() };
    }));
    
    startTransition(async () => {
      await snoozeFollowup(id, days);
    });
  };

  const handleAddFollowup = async () => {
    if (!newLeadId || !newNote.trim()) return;
    
    const lead = leads.find(l => l.id === newLeadId);
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic add
    setItems(prev => [...prev, {
      id: tempId,
      leadId: newLeadId,
      leadName: lead?.name || "Unknown",
      note: newNote.trim(),
      dueAt: newDueAt || null,
      done: false,
    }]);
    
    setNewLeadId("");
    setNewNote("");
    setNewDueAt("");
    setShowAddForm(false);
    
    startTransition(async () => {
      await createFollowup(newLeadId, newNote.trim(), newDueAt || undefined);
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No due date";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    const isPast = date < today;
    const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return isPast ? `Overdue: ${formatted}` : formatted;
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Current Move — THE one calm action */}
      {currentMove && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          layout
        >
          <Card className={`backdrop-blur shadow-sm ${
            isOverdue(currentMove.dueAt)
              ? "border-rose-200 bg-rose-50/50"
              : "border-emerald-200 bg-emerald-50/50"
          }`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base ${
                  isOverdue(currentMove.dueAt) ? "text-rose-900" : "text-emerald-900"
                }`}>
                  Your one calm move
                </CardTitle>
                {isOverdue(currentMove.dueAt) && (
                  <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                    overdue
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className={`flex items-center gap-2 text-xs ${
                isOverdue(currentMove.dueAt) ? "text-rose-600" : "text-emerald-600"
              }`}>
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{currentMove.leadName}</span>
                <span className={isOverdue(currentMove.dueAt) ? "text-rose-400" : "text-emerald-400"}>·</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDate(currentMove.dueAt)}</span>
              </div>
              
              <p className={`text-sm font-medium leading-relaxed ${
                isOverdue(currentMove.dueAt) ? "text-rose-900" : "text-emerald-900"
              }`}>
                {currentMove.note}
              </p>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleComplete(currentMove.id, currentMove.leadId)}
                  disabled={isPending}
                  className={`flex-1 text-white ${
                    isOverdue(currentMove.dueAt)
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Mark complete
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleSnooze(currentMove.id, 1)}
                  disabled={isPending}
                  className={`${
                    isOverdue(currentMove.dueAt)
                      ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  +1 day
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No pending items */}
      {!currentMove && (
        <Card className="border-emerald-100 bg-emerald-50/30 backdrop-blur">
          <CardContent className="p-6 text-center">
            <Check className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
            <p className="font-medium text-emerald-900">All caught up</p>
            <p className="text-sm text-emerald-600 mt-1">
              No pending follow-ups. Take a breath.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upcoming queue */}
      {pending.length > 1 && (
        <Card className="border-neutral-200 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-700">Coming up ({pending.length - 1})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <AnimatePresence>
                {pending.slice(1, 5).map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isOverdue(item.dueAt)
                        ? "bg-rose-50 hover:bg-rose-100"
                        : "bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {item.leadName}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {item.note}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs ${isOverdue(item.dueAt) ? "text-rose-600 font-medium" : "text-neutral-500"}`}>
                        {formatDate(item.dueAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {pending.length > 5 && (
                <p className="text-xs text-neutral-500 text-center pt-2">
                  +{pending.length - 5} more follow-ups
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick add */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          {showAddForm ? (
            <div className="space-y-3">
              <select
                value={newLeadId}
                onChange={(e) => setNewLeadId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.name}</option>
                ))}
              </select>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What's the follow-up?"
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddFollowup}
                  disabled={!newLeadId || !newNote.trim() || isPending}
                  className="flex-1"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add follow-up"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="secondary" 
              onClick={() => setShowAddForm(true)}
              className="w-full border-dashed border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add a follow-up
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Share with Second Look */}
      <Card className="border-emerald-100 bg-emerald-50/30 backdrop-blur">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-emerald-800 mb-3">
            Share Second Look
          </h4>
          <SecondLookShare
            url={tanjiaConfig.secondLookUrl}
            note="This gives you a clearer way to see how growth has changed what you're carrying."
          />
        </CardContent>
      </Card>

      {/* Completed section */}
      {completed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-500 hover:text-neutral-700 py-2">
            {completed.length} completed follow-up{completed.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-1">
            {completed.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded bg-neutral-50 text-neutral-500"
              >
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm truncate flex-1">{item.leadName}: {item.note}</span>
              </div>
            ))}
            {completed.length > 5 && (
              <p className="text-xs text-neutral-400 pl-6">
                +{completed.length - 5} more
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
