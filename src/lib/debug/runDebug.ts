export type RunDebugPayload = Record<string, unknown>;

export function debugRunEvent(eventName: string, payload: RunDebugPayload = {}) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.info(`[tusiger:run] ${eventName}`, {
    at: new Date().toISOString(),
    ...payload
  });
}
