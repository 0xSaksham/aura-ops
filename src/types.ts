// types.ts

// Shape of an individual log entry processed by the ingest endpoint.
export interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp?: number;
  // Allows for additional optional metadata fields
  [key: string]: unknown;
}

//Represents the current active incident state within the Durable Object.
export interface Incident {
  status: "active" | "resolved";
  count: number;
  last_seen: string;
  analysis?: string;
}

//Standard Environment interface for Cloudflare Workers.
// Add your specific bindings (KV, DO, Secrets) here.
export interface Env {
  AI: {
    run(
      model: string,
      input: { prompt: string },
    ): Promise<{ response: string }>;
  };
  // Example: INCIDENT_DO: DurableObjectNamespace;
  [key: string]: unknown;
  INCIDENT_ENGINE: DurableObjectNamespace;
}
