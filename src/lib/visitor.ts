const VISITOR_KEY = 'visitor-id';

/**
 * Anonymous per-browser id used only to let the API know which reactions
 * belong to this visitor. Not tied to any account — safe to keep in
 * localStorage as a per-viewer convenience.
 */
export const getVisitorId = (): string => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};
