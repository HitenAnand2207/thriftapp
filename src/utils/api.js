// Prefer an explicit backend URL when provided.
// Otherwise use relative URLs so local dev can use CRA proxy and prod can use same-origin APIs.
const configuredBase = (process.env.REACT_APP_API_BASE_URL || "").trim();
export const API_BASE_URL = configuredBase.replace(/\/+$/, "");
