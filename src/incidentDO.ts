import { DurableObject } from "cloudflare:workers";
import { Incident, LogEntry, Env } from "./types"; // Adjust path as needed

export class IncidentDO extends DurableObject<Env> {
  private logs: LogEntry[] = [];
  private incident: Incident | null = null;
  protected env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Check if the path starts with /ingest
    if (url.pathname.startsWith("/ingest") && request.method === "POST") {
      const log = await request.json<LogEntry>();
      this.logs.push({ ...log, timestamp: Date.now() });

      if (this.logs.length > 50) this.logs.shift();

      const errorLogs = this.logs.filter((l) => l.level === "error");

      if (errorLogs.length > 5 && !this.incident) {
        const analysis = await this.analyzeLogs(errorLogs);
        this.incident = {
          status: "active",
          count: errorLogs.length,
          last_seen: new Date().toISOString(),
          analysis,
        };
      }

      return Response.json({ status: "ok", incident: this.incident });
    }

    // Check if the path starts with /status
    if (url.pathname.startsWith("/status")) {
      return Response.json({ logs: this.logs, incident: this.incident });
    }

    return new Response("Not Found (Path requested: " + url.pathname + ")", {
      status: 404,
    });
  }

  private async analyzeLogs(logs: LogEntry[]): Promise<string> {
    const prompt = `Analyze these system logs: ${JSON.stringify(logs)}. Provide a 1-sentence root cause and a 1-sentence fix.`;

    // AI is now strictly typed via our Env interface
    const result = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt,
    });

    return result.response;
  }
}
