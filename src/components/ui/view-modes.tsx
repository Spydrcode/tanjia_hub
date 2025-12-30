'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ViewModesContext = {
  explainMode: boolean;
  presentationMode: boolean;
  toggleExplain: () => void;
  togglePresentation: () => void;
  setPresentation: (value: boolean) => void;
};

const ViewModesCtx = createContext<ViewModesContext | undefined>(undefined);

const EXPLAIN_KEY = "tanjia_explain_mode";
const PRESENTATION_KEY = "tanjia_presentation_mode";

export function ViewModesProvider({ children }: { children: React.ReactNode }) {
  const [explainMode, setExplainMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const explain = window.localStorage.getItem(EXPLAIN_KEY);
    setExplainMode(explain === "true");
    // Always start a new session in regular mode; presentation must be explicitly enabled per visit.
    setPresentationMode(false);
    window.localStorage.removeItem(PRESENTATION_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(EXPLAIN_KEY, explainMode ? "true" : "false");
  }, [explainMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PRESENTATION_KEY, presentationMode ? "true" : "false");
    document.body.classList.toggle("presentation-mode", presentationMode);
  }, [presentationMode]);

  const toggleExplain = useCallback(() => setExplainMode((prev) => !prev), []);
  const togglePresentation = useCallback(
    () =>
      setPresentationMode((prev) => {
        const next = !prev;
        if (next) setExplainMode(false);
        return next;
      }),
    [],
  );
  const setPresentation = useCallback((value: boolean) => {
    setPresentationMode((prev) => {
      if (value) setExplainMode(false);
      return value;
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === "KeyE") {
        event.preventDefault();
        toggleExplain();
      }
      if (event.ctrlKey && event.shiftKey && event.code === "KeyP") {
        event.preventDefault();
        togglePresentation();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleExplain, togglePresentation]);

  useEffect(() => {
    if (presentationMode && explainMode) {
      setExplainMode(false);
    }
  }, [presentationMode, explainMode]);

  const value = useMemo(
    () => ({
      explainMode,
      presentationMode,
      toggleExplain,
      togglePresentation,
      setPresentation,
    }),
    [explainMode, presentationMode, toggleExplain, togglePresentation, setPresentation],
  );

  return <ViewModesCtx.Provider value={value}>{children}</ViewModesCtx.Provider>;
}

export function useViewModes() {
  const ctx = useContext(ViewModesCtx);
  if (!ctx) throw new Error("useViewModes must be used within ViewModesProvider");
  return ctx;
}

export function maskEmail(email?: string | null) {
  if (!email) return "hidden email";
  const [user, domain] = email.split("@");
  if (!domain) return "hidden email";
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0] || ""}***`;
  return `${maskedUser}@${domain}`;
}

export function maskPhone(phone?: string | null) {
  if (!phone) return "(***) ***-****";
  const digits = phone.replace(/\D/g, "");
  const tail = digits.slice(-4) || "0000";
  return `(***) ***-${tail}`;
}

export function safeLeadLabel(id?: string | null) {
  if (!id) return "Lead";
  const suffix = id.replace(/-/g, "").slice(-4);
  return `Lead #${suffix}`;
}

export function maskNote(note?: string | null) {
  if (!note) return "Hidden";
  return "Message hidden";
}

export function maskGeneric(text?: string | null) {
  if (!text) return "Hidden";
  return "Hidden";
}
