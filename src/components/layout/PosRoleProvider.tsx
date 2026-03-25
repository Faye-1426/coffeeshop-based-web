import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  readPosRole,
  writePosRole,
  type PosAppRole,
} from "../../lib/posDemoSession";
import { PosRoleContext } from "./posRoleContextBase";

export type { PosAppRole };

export function PosRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<PosAppRole>(() => readPosRole());

  const setRole = useCallback((r: PosAppRole) => {
    writePosRole(r);
    setRoleState(r);
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);

  return (
    <PosRoleContext.Provider value={value}>{children}</PosRoleContext.Provider>
  );
}
