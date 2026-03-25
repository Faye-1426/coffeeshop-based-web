import { useContext } from "react";
import { PosRoleContext } from "./posRoleContextBase";

export function usePosRole() {
  const ctx = useContext(PosRoleContext);
  if (!ctx) {
    throw new Error("usePosRole must be used inside PosRoleProvider");
  }
  return ctx;
}
