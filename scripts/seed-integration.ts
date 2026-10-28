/** Only for a dedicated disposable integration database. */
import mysql from "mysql2/promise";
async function main() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.includes("test"))
    throw new Error(
      "A disposable TEST_DATABASE_URL containing 'test' is required"
    );
  const db = await mysql.createConnection(url);
  try {
    await db.query(
      "INSERT INTO company_units (id,name) VALUES (1,'Integration Unit'),(2,'Other Unit')"
    );
    await db.query(
      "INSERT INTO sectors (id,unitId,name) VALUES (1,1,'Integration Sector')"
    );
    await db.query(
      "INSERT INTO employees (id,unitId,sectorId,name) VALUES (1,1,1,'Integration Worker')"
    );
    await db.query(
      "INSERT INTO risk_map_areas (id,unitId,name,coordinates) VALUES (1,1,'Integration Area',?)",
      [JSON.stringify({ x: 0, y: 0, width: 200, height: 100 })]
    );
    await db.query(
      "INSERT INTO ghe (id,unitId,code,name,riskMapAreaId) VALUES (1,1,'FIXTURE-001','Fixture Group',1)"
    );
    await db.query(
      "INSERT INTO ghe_exposure_agents (gheId,agentType,agentName,riskLevel) VALUES (1,'Físico','Ruído','Moderado')"
    );
  } finally {
    await db.end();
  }
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
