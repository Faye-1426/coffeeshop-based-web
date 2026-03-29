import { createContext } from "react";
import type { PosAppRole } from "../lib/posDemoSession";

export type PosRoleContextValue = {
  role: PosAppRole;
  setRole: (r: PosAppRole) => void;
};

export const PosRoleContext = createContext<PosRoleContextValue | null>(null);
