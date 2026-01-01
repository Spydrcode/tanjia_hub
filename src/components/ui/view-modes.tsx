'use client';

import React, { createContext, useContext } from "react";

type ViewModesContext = {
  explainMode: boolean;
  presentationMode: boolean;
  toggleExplain: () => void;
  togglePresentation: () => void;
  setPresentation: (value: boolean) => void;
};

const defaultValue: ViewModesContext = {
  explainMode: false,
  presentationMode: false,
  toggleExplain: () => {},
  togglePresentation: () => {},
  setPresentation: () => {},
};

const ViewModesCtx = createContext<ViewModesContext>(defaultValue);

export function ViewModesProvider({ children }: { children: React.ReactNode }) {
  return <ViewModesCtx.Provider value={defaultValue}>{children}</ViewModesCtx.Provider>;
}

export function useViewModes() {
  return useContext(ViewModesCtx);
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
