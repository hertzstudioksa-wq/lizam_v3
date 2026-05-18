import { createContext, useContext } from "react";

/**
 * When AllSectionsAdmin renders multiple page admins together,
 * it provides this context so that:
 *   - SaveBar hides itself and registers its save fn with the parent
 *   - ExtraSectionsManager hides itself
 */
export const EmbeddedAdminCtx = createContext(null);
export const useEmbeddedAdmin = () => useContext(EmbeddedAdminCtx);
