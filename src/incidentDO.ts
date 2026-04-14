import { DurableObject } from "cloudflare:workers";

export class IncidentDO extends DurableObject {
  logs: any[] = [];
  incident: any = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/ingest") {
      const log = await request.json();
      this.logs.push(log);
      if (this.logs.length > 50) this.logs.shift();

      const errorCount = this.logs.filter((l) => l.level === "error").length;
      if (errorCount > 5) {
        this.incident = {
          status: "active",
          count: errorCount,
          last_seen: new Date().toISOString(),
        };
      }

      return Response.json({ status: "ok", incident: this.incident });
    }

    if (url.pathname === "/status") {
      return Response.json({ logs: this.logs, incident: this.incident });
    }

    return new Response("Not Found", { status: 404 });
  }
}
