'use client';

import React, { createContext, useContext, useState, useEffect } from "react";

type ViewModesContext = {
  explainMode: boolean;
  shareMode: boolean;
  toggleExplain: () => void;
  toggleShare: () => void;
  setShare: (value: boolean) => void;
  // Deprecated: keep for backward compatibility during transition
  presentationMode: boolean;
  togglePresentation: () => void;
  setPresentation: (value: boolean) => void;
};

const defaultValue: ViewModesContext = {
  explainMode: false,
  shareMode: false,
  toggleExplain: () => {},
  toggleShare: () => {},
  setShare: () => {},
  presentationMode: false,
  togglePresentation: () => {},
  setPresentation: () => {},
};

const ViewModesCtx = createContext<ViewModesContext>(defaultValue);

const STORAGE_KEYS = {
  explainMode: 'tanjia_explain_mode',
  shareMode: 'tanjia_share_mode',
};

export function ViewModesProvider({ children }: { children: React.ReactNode }) {
  const [explainMode, setExplainMode] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedExplain = localStorage.getItem(STORAGE_KEYS.explainMode);
    const storedShare = localStorage.getItem(STORAGE_KEYS.shareMode);
    
    if (storedExplain !== null) {
      setExplainMode(storedExplain === 'true');
    }
    if (storedShare !== null) {
      setShareMode(storedShare === 'true');
    }
    
    setMounted(true);
  }, []);

  // Persist to localStorage whenever values change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.explainMode, String(explainMode));
  }, [explainMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.shareMode, String(shareMode));
  }, [shareMode, mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+E for Explain Mode
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setExplainMode(prev => !prev);
      }
      
      // Ctrl+Shift+S for Share Mode
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShareMode(prev => {
          const newValue = !prev;
          // Share Mode automatically disables Explain Mode
          if (newValue) {
            setExplainMode(false);
          }
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExplain = () => {
    setExplainMode(prev => !prev);
  };

  const toggleShare = () => {
    setShareMode(prev => {
      const newValue = !prev;
      // Share Mode automatically disables Explain Mode
      if (newValue) {
        setExplainMode(false);
      }
      return newValue;
    });
  };

  const setShare = (value: boolean) => {
    setShareMode(value);
    // Share Mode automatically disables Explain Mode
    if (value) {
      setExplainMode(false);
    }
  };

  const value: ViewModesContext = {
    explainMode,
    shareMode,
    toggleExplain,
    toggleShare,
    setShare,
    // Deprecated backward compatibility
    presentationMode: shareMode,
    togglePresentation: toggleShare,
    setPresentation: setShare,
  };

  return <ViewModesCtx.Provider value={value}>{children}</ViewModesCtx.Provider>;
}

export function useViewModes() {
  return useContext(ViewModesCtx);
}

// Masking utilities for Share View (professional data hiding)
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
  if (!note) return "Private details hidden";
  return "Private details hidden";
}

export function maskGeneric(text?: string | null) {
  if (!text) return "Private details hidden";
  return "Private details hidden";
}
