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

    if (url.pathname === "/ingest" && request.method === "POST") {
      const log = await request.json<LogEntry>();
      this.logs.push({ ...log, timestamp: Date.now() });

      // Prune logs to keep memory footprint low
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

    if (url.pathname === "/status") {
      return Response.json({ logs: this.logs, incident: this.incident });
    }

    return new Response("Not Found", { status: 404 });
  }

  private async analyzeLogs(logs: LogEntry[]): Promise<string> {
    const prompt = `Analyze these system logs: ${JSON.stringify(logs)}. Provide a 1-sentence root cause and a 1-sentence fix.`;

    // AI is now strictly typed via our Env interface
    const result = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
      prompt,
    });

    return result.response;
  }
}
