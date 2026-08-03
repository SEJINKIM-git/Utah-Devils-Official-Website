"use client";

import { createContext, useContext } from "react";

const EditModeContext = createContext(false);

export default function EditModeProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <EditModeContext.Provider value={enabled}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}
