"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { updateMeetingRecording } from "../actions";
import { Mic, FileText } from "lucide-react";

type RecordingSectionProps = {
  meetingId: string;
  recordingUrl?: string | null;
  transcriptText?: string | null;
  transcriptSource?: string | null;
};

export function RecordingSection({
  meetingId,
  recordingUrl: initialRecordingUrl,
  transcriptText: initialTranscriptText,
  transcriptSource: initialTranscriptSource,
}: RecordingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(initialRecordingUrl || "");
  const [transcriptText, setTranscriptText] = useState(initialTranscriptText || "");
  const [transcriptSource, setTranscriptSource] = useState(initialTranscriptSource || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMeetingRecording({
        meetingId,
        recordingUrl,
        transcriptText,
        transcriptSource,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save recording/transcript:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasRecordingOrTranscript = initialRecordingUrl || initialTranscriptText;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-neutral-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Recording & Transcript</h2>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
            {hasRecordingOrTranscript ? "Edit" : "Add"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <label htmlFor="recordingUrl" className="block text-sm font-medium text-neutral-700">
                Recording URL
              </label>
              <input
                id="recordingUrl"
                type="url"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Link to recording (Zoom, Loom, etc.)
              </p>
            </div>

            <div>
              <label htmlFor="transcriptSource" className="block text-sm font-medium text-neutral-700">
                Transcript Source
              </label>
              <input
                id="transcriptSource"
                type="text"
                value={transcriptSource}
                onChange={(e) => setTranscriptSource(e.target.value)}
                placeholder="e.g., Zoom, Otter.ai, manual"
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="transcriptText" className="block text-sm font-medium text-neutral-700">
                Transcript
              </label>
              <textarea
                id="transcriptText"
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste transcript here..."
                rows={10}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => {
                  setRecordingUrl(initialRecordingUrl || "");
                  setTranscriptText(initialTranscriptText || "");
                  setTranscriptSource(initialTranscriptSource || "");
                  setIsEditing(false);
                }}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {initialRecordingUrl && (
              <div>
                <p className="text-sm font-medium text-neutral-700">Recording</p>
                <a
                  href={initialRecordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {initialRecordingUrl}
                </a>
              </div>
            )}

            {initialTranscriptText && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-700">Transcript</p>
                  {initialTranscriptSource && (
                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                      {initialTranscriptSource}
                    </span>
                  )}
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                  <pre className="whitespace-pre-wrap font-sans">{initialTranscriptText}</pre>
                </div>
              </div>
            )}

            {!hasRecordingOrTranscript && (
              <p className="text-sm text-neutral-500">
                No recording or transcript attached. Click "Add" to attach.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
