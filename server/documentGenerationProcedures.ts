/**
 * Document Generation Procedures
 * Handles generation of SST documents (PGR, PCMSO, LTCAT, PPP, ASO, CAT)
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// ─── DOCUMENT TEMPLATES ──────────────────────────────────────────────────────

const PGR_TEMPLATE = `
# PROGRAMA DE GESTÃO DE RISCOS (PGR)

## 1. Identificação da Empresa
- Razão Social: {companyName}
- CNPJ: {cnpj}
- Endereço: {address}

## 2. Inventário de Riscos
{riskInventory}

## 3. Plano de Ação
{actionPlan}

## 4. Responsáveis
{responsibleTeam}

## 5. Prazos de Implementação
{implementationDeadline}

Data de Elaboração: {date}
Assinado por: {author}
`;

const PCMSO_TEMPLATE = `
# PROGRAMA DE CONTROLE MÉDICO E SAÚDE OCUPACIONAL (PCMSO)

## 1. Dados da Empresa
- Razão Social: {companyName}
- CNPJ: {cnpj}

## 2. Médico Responsável
- Nome: {occupationalMedic}
- Registro: {medicRegistration}

## 3. Fatores de Risco Identificados
{riskFactors}

## 4. Exames Obrigatórios
{examsRequired}

## 5. Frequência de Exames
{examsFrequency}

Data de Elaboração: {date}
Assinado por: {author}
`;

const LTCAT_TEMPLATE = `
# LAUDO TÉCNICO DE CONDIÇÕES AMBIENTAIS DO TRABALHO (LTCAT)

## 1. Identificação
- Empresa: {companyName}
- CNPJ: {cnpj}

## 2. Atividades Especiais Identificadas
{specialActivities}

## 3. Fatores de Exposição
{exposureFactors}

## 4. Conclusão sobre Aposentadoria Especial
{conclusionSpecialRetirement}

Data: {date}
Assinado por: {author}
`;

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const GeneratePGRSchema = z.object({
  unitId: z.number().positive(),
  companyName: z.string(),
  cnpj: z.string().optional(),
  riskInventory: z.string(),
  actionPlan: z.string(),
  responsibleTeam: z.string(),
  implementationDeadline: z.string().optional(),
});

const GeneratePCMSOSchema = z.object({
  unitId: z.number().positive(),
  companyName: z.string(),
  cnpj: z.string().optional(),
  occupationalMedic: z.string(),
  medicRegistration: z.string().optional(),
  riskFactors: z.string(),
  examsRequired: z.array(z.string()),
  examsFrequency: z.string().optional(),
});

const GenerateLTCATSchema = z.object({
  unitId: z.number().positive(),
  companyName: z.string(),
  cnpj: z.string().optional(),
  specialActivities: z.array(z.string()),
  exposureFactors: z.string(),
  conclusionSpecialRetirement: z.boolean().optional(),
});

// ─── PROCEDURES ──────────────────────────────────────────────────────────────

export const documentGenerationRouter = router({
  // Generate PGR Document
  generatePGR: protectedProcedure
    .input(GeneratePGRSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores e gerentes podem gerar documentos",
          });
        }

        const content = PGR_TEMPLATE
          .replace("{companyName}", input.companyName)
          .replace("{cnpj}", input.cnpj || "N/A")
          .replace("{riskInventory}", input.riskInventory)
          .replace("{actionPlan}", input.actionPlan)
          .replace("{responsibleTeam}", input.responsibleTeam)
          .replace("{implementationDeadline}", input.implementationDeadline || "A definir")
          .replace("{date}", new Date().toLocaleDateString("pt-BR"))
          .replace("{author}", ctx.user?.name || "Sistema");

        return {
          success: true,
          documentType: "PGR",
          content,
          fileName: `PGR_${input.companyName}_${new Date().getTime()}.md`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error generating PGR:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar documento PGR",
        });
      }
    }),

  // Generate PCMSO Document
  generatePCMSO: protectedProcedure
    .input(GeneratePCMSOSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores e gerentes podem gerar documentos",
          });
        }

        const content = PCMSO_TEMPLATE
          .replace("{companyName}", input.companyName)
          .replace("{cnpj}", input.cnpj || "N/A")
          .replace("{occupationalMedic}", input.occupationalMedic)
          .replace("{medicRegistration}", input.medicRegistration || "N/A")
          .replace("{riskFactors}", input.riskFactors)
          .replace("{examsRequired}", input.examsRequired.join("\n- "))
          .replace("{examsFrequency}", input.examsFrequency || "Conforme NR-07")
          .replace("{date}", new Date().toLocaleDateString("pt-BR"))
          .replace("{author}", ctx.user?.name || "Sistema");

        return {
          success: true,
          documentType: "PCMSO",
          content,
          fileName: `PCMSO_${input.companyName}_${new Date().getTime()}.md`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error generating PCMSO:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar documento PCMSO",
        });
      }
    }),

  // Generate LTCAT Document
  generateLTCAT: protectedProcedure
    .input(GenerateLTCATSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores e gerentes podem gerar documentos",
          });
        }

        const content = LTCAT_TEMPLATE
          .replace("{companyName}", input.companyName)
          .replace("{cnpj}", input.cnpj || "N/A")
          .replace("{specialActivities}", input.specialActivities.join("\n- "))
          .replace("{exposureFactors}", input.exposureFactors)
          .replace(
            "{conclusionSpecialRetirement}",
            input.conclusionSpecialRetirement
              ? "Sim - Atividade especial identificada"
              : "Não - Atividade comum"
          )
          .replace("{date}", new Date().toLocaleDateString("pt-BR"))
          .replace("{author}", ctx.user?.name || "Sistema");

        return {
          success: true,
          documentType: "LTCAT",
          content,
          fileName: `LTCAT_${input.companyName}_${new Date().getTime()}.md`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error generating LTCAT:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar documento LTCAT",
        });
      }
    }),

  // Get document templates
  getDocumentTemplates: protectedProcedure.query(async () => {
    return {
      templates: [
        {
          id: "pgr",
          name: "PGR (NR-01)",
          description: "Programa de Gestão de Riscos",
          template: PGR_TEMPLATE,
        },
        {
          id: "pcmso",
          name: "PCMSO (NR-07)",
          description: "Programa de Controle Médico e Saúde Ocupacional",
          template: PCMSO_TEMPLATE,
        },
        {
          id: "ltcat",
          name: "LTCAT",
          description: "Laudo Técnico de Condições Ambientais do Trabalho",
          template: LTCAT_TEMPLATE,
        },
      ],
    };
  }),
});
