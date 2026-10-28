import { createHash } from "node:crypto";
import { getDb } from "./db";
import {
  employees,
  incidents,
  exams,
  trainings,
  trainingRecords,
  costs,
  leaveOfAbsence,
  risks,
  actionPlans,
} from "../drizzle/schema";
import { eq, and, gte, lte, getTableColumns } from "drizzle-orm";

/**
 * Gera relatório de acidentes em PDF (NR-01 Anexo I)
 */
export async function generateAccidentReport(
  unitId: number,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const incidentList = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.unitId, unitId),
        gte(incidents.date, startDate),
        lte(incidents.date, endDate)
      )
    );

  const totalAccidents = incidentList.length;
  const lostTimeAccidents = incidentList.filter(
    i => i.type === "Acidente com Afastamento"
  ).length;
  const totalDaysLost = incidentList.reduce(
    (acc, i) => acc + (i.daysLost || 0),
    0
  );

  const content = `
RELATÓRIO DE ACIDENTES - NR-01 ANEXO I
Unidade: ${unitId}
Período: ${startDate.toLocaleDateString("pt-BR")} a ${endDate.toLocaleDateString("pt-BR")}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

RESUMO:
- Total de Acidentes: ${totalAccidents}
- Acidentes com Afastamento: ${lostTimeAccidents}
- Dias Perdidos: ${totalDaysLost}

DETALHES DOS ACIDENTES:
${incidentList
  .map(
    (i, idx) => `
${idx + 1}. ${i.description}
   Data: ${new Date(i.date).toLocaleDateString("pt-BR")}
   Tipo: ${i.type}
   Dias Perdidos: ${i.daysLost || 0}
`
  )
  .join("\n")}

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Gera relatório PCMSO (Portaria 3214/78)
 */
export async function generatePCMSOReport(unitId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const empList = await db
    .select()
    .from(employees)
    .where(eq(employees.unitId, unitId));
  const examList = await db
    .select(getTableColumns(exams))
    .from(exams)
    .innerJoin(employees, eq(exams.employeeId, employees.id))
    .where(eq(employees.unitId, unitId));

  const content = `
RELATÓRIO PCMSO - PORTARIA 3214/78
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

RESUMO EXECUTIVO:
- Total de Funcionários: ${empList.length}
- Total de Exames Realizados: ${examList.length}
- Exames em Dia: ${examList.filter(e => e.expirationDate && new Date(e.expirationDate) > new Date()).length}
- Exames Vencidos: ${examList.filter(e => e.expirationDate && new Date(e.expirationDate) <= new Date()).length}

OBJETIVO:
Preservar e promover a saúde do conjunto de seus empregados.

RESPONSABILIDADES:
- Médico Coordenador
- Médicos Executantes
- Enfermeiro do Trabalho
- Técnico de Segurança do Trabalho

EXAMES REALIZADOS:
${examList
  .slice(0, 10)
  .map(
    (e, idx) => `
${idx + 1}. Tipo: ${e.type}
   Funcionário: ${e.employeeId}
   Data: ${new Date(e.examDate).toLocaleDateString("pt-BR")}
   Status: ${e.expirationDate && new Date(e.expirationDate) > new Date() ? "Em Dia" : "Vencido"}
`
  )
  .join("\n")}

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Gera relatório PPRA (NR-09)
 */
export async function generatePPRAReport(unitId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const riskList = await db
    .select()
    .from(risks)
    .where(eq(risks.unitId, unitId));

  const content = `
PROGRAMA DE PREVENÇÃO DE RISCOS AMBIENTAIS - PPRA
NR-09 - Portaria 3214/78
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

OBJETIVO:
Proteger a saúde e a integridade dos trabalhadores, através da antecipação, reconhecimento, avaliação e consequente controle da ocorrência de riscos ambientais existentes ou que venham a existir no ambiente de trabalho.

RISCOS IDENTIFICADOS: ${riskList.length}

CLASSIFICAÇÃO DOS RISCOS:
${riskList
  .map(
    (r, idx) => `
${idx + 1}. ${r.description}
   Tipo: ${r.type}
   Nível: ${r.riskLevel}
   Setor: ${r.sectorId}
`
  )
  .join("\n")}

MEDIDAS DE CONTROLE:
1. Eliminação do risco na fonte
2. Redução do risco
3. Utilização de EPI
4. Monitoramento ambiental
5. Vigilância da saúde dos trabalhadores

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Gera relatório PGR (NR-01)
 */
export async function generatePGRReport(unitId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const riskList = await db.select().from(risks);
  const actionList = await db
    .select(getTableColumns(actionPlans))
    .from(actionPlans)
    .innerJoin(risks, eq(actionPlans.riskId, risks.id))
    .where(eq(risks.unitId, unitId));

  const content = `
PROGRAMA DE GESTÃO DE RISCOS - PGR
NR-01 - Portaria 3214/78
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

OBJETIVO:
Estabelecer um processo contínuo de identificação, avaliação e controle de riscos à saúde e segurança dos trabalhadores.

RISCOS IDENTIFICADOS: ${riskList.length}
AÇÕES PLANEJADAS: ${actionList.length}

MATRIZ DE RISCOS:
${riskList
  .map(
    (r, idx) => `
${idx + 1}. ${r.description}
   Probabilidade: ${r.probability}
   Severidade: ${r.severity}
   Nível de Risco: ${r.riskLevel}
   Controles Existentes: ${r.controlMeasures || "Não informado"}
`
  )
  .join("\n")}

PLANO DE AÇÃO:
${actionList
  .slice(0, 5)
  .map(
    (a, idx) => `
${idx + 1}. ${a.what}
   Responsável: ${a.who}
   Quando: ${new Date(a.when).toLocaleDateString("pt-BR")}
`
  )
  .join("\n")}

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Gera relatório CIPA (NR-05)
 */
export async function generateCIPAReport(unitId: number): Promise<string> {
  const content = `
RELATÓRIO CIPA - COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES
NR-05 - Portaria 3214/78
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

OBJETIVO:
Observar e relatar as condições de risco e as práticas inadequadas encontradas nos locais de trabalho, solicitando medidas para redução ou eliminação dos riscos identificados.

COMPOSIÇÃO DA CIPA:
- Presidente
- Vice-Presidente
- Secretário
- Membros Representantes dos Empregadores
- Membros Representantes dos Empregados

ATRIBUIÇÕES:
1. Identificar situações de risco no ambiente de trabalho
2. Solicitar medidas para redução ou eliminação de riscos
3. Orientar os trabalhadores quanto à prevenção de acidentes
4. Participar da investigação de acidentes
5. Manter registros de suas atividades

REUNIÕES REALIZADAS: 0
ACIDENTES INVESTIGADOS: 0
RECOMENDAÇÕES IMPLEMENTADAS: 0

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Gera relatório de Treinamentos
 */
export async function generateTrainingReport(unitId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const trainingList = await db.select().from(trainings);
  const recordList = await db
    .select(getTableColumns(trainingRecords))
    .from(trainingRecords)
    .innerJoin(employees, eq(trainingRecords.employeeId, employees.id))
    .where(eq(employees.unitId, unitId));

  const content = `
RELATÓRIO DE TREINAMENTOS
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

TREINAMENTOS OFERECIDOS: ${trainingList.length}
REGISTROS DE TREINAMENTO: ${recordList.length}

CONFORMIDADE:
- Treinamentos em Dia: ${recordList.filter(r => r.expiryDate && new Date(r.expiryDate) > new Date()).length}
- Treinamentos Vencidos: ${recordList.filter(r => r.expiryDate && new Date(r.expiryDate) <= new Date()).length}

TREINAMENTOS REALIZADOS:
${trainingList
  .slice(0, 10)
  .map(
    (t, idx) => `
${idx + 1}. ${t.title}
   Descrição: ${t.description}
   Carga Horária: ${t.workload}h
   Tipo: ${t.type}
`
  )
  .join("\n")}

RECOMENDAÇÕES:
1. Manter registros atualizados de todos os treinamentos
2. Realizar reciclagens conforme exigido por lei
3. Documentar participação de todos os funcionários
4. Arquivar certificados de conclusão

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Gera relatório de Custos SST
 */
export async function generateCostReport(unitId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const costList = await db
    .select()
    .from(costs)
    .where(eq(costs.unitId, unitId));

  const totalCost = costList.reduce(
    (acc, c) => acc + (parseFloat(c.value) || 0),
    0
  );
  const costByCategory = costList.reduce((acc: Record<string, number>, c) => {
    const cat = c.category || "Outros";
    acc[cat] = (acc[cat] || 0) + (parseFloat(c.value) || 0);
    return acc;
  }, {});

  const content = `
RELATÓRIO DE CUSTOS EM SST
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

RESUMO FINANCEIRO:
- Custo Total: R$ ${totalCost.toFixed(2)}
- Número de Registros: ${costList.length}

CUSTOS POR CATEGORIA:
${Object.entries(costByCategory)
  .map(
    ([cat, amount]) => `
- ${cat}: R$ ${(amount as number).toFixed(2)}
`
  )
  .join("\n")}

DETALHES:
${costList
  .slice(0, 10)
  .map(
    (c, idx) => `
${idx + 1}. ${c.description}
   Categoria: ${c.category}
   Valor: R$ ${(parseFloat(c.value) || 0).toFixed(2)}
   Data: ${new Date(c.date).toLocaleDateString("pt-BR")}
`
  )
  .join("\n")}

ANÁLISE:
Investimento em segurança e saúde do trabalho é essencial para:
- Reduzir custos com acidentes
- Melhorar produtividade
- Cumprir obrigações legais
- Proteger vidas

Gerado em ${new Date().toLocaleString("pt-BR")}. Assinatura digital não aplicada.
`;

  return content;
}

/**
 * Assina digitalmente um documento
 */
export function signDocument(
  content: string,
  signerName: string,
  signerRole: string,
  timestamp: Date = new Date()
): string {
  const signature = `

═════════════════════════════════════════════════════════════════════════════
ASSINATURA DIGITAL

Assinado por: ${signerName}
Cargo/Função: ${signerRole}
Data/Hora: ${timestamp.toLocaleString("pt-BR")}
Hash: ${createHash("sha256").update(content).digest("hex")}

Registro informativo de autoria. Não contém assinatura digital certificada.
═════════════════════════════════════════════════════════════════════════════
`;

  return content + signature;
}
