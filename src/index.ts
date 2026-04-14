import { Hono } from "hono";
import { IncidentDO } from "./incidentDO";
export { IncidentDO };

const app = new Hono<{
  Bindings: { AI: any; INCIDENT_ENGINE: DurableObjectNamespace };
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
