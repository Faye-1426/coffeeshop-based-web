import { useLocation } from "react-router-dom";
import { CUSTOMER_STORE_SUFFIX } from "../lib/storePath";

/** First path segment when it ends with `-store` (marketplace routes). */
export function useCustomerStoreKeyFromPath(): string | null {
  const { pathname } = useLocation();
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg?.endsWith(CUSTOMER_STORE_SUFFIX) ? seg : null;
}
