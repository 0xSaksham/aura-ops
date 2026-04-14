import { Hono } from "hono";
import { IncidentDO } from "./incidentDO";
import { Env } from "./types";
export { IncidentDO };

const app = new Hono<{
  Bindings: Env;
}>();

app.post("/ingest/:service", async (c) => {
  const service = c.req.param("service");
  const id = c.env.INCIDENT_ENGINE.idFromName(service);
  const stub = c.env.INCIDENT_ENGINE.get(id);
  return await stub.fetch(c.req.raw);
});

app.get("/status/:service", async (c) => {
  const service = c.req.param("service");
  const id = c.env.INCIDENT_ENGINE.idFromName(service);
  const stub = c.env.INCIDENT_ENGINE.get(id);
  return await stub.fetch(c.req.raw);
});

export default app;
