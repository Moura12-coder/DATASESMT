import crypto from "crypto";

/**
 * Interface para dados de assinatura
 */
export interface SignatureData {
  signerName: string;
  signerRole: string;
  signerEmail?: string;
  timestamp: Date;
  documentHash: string;
}

/**
 * Gera hash SHA-256 de um documento
 */
export function generateDocumentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Cria assinatura digital de um documento
 */
export function createDigitalSignature(
  content: string,
  signerName: string,
  signerRole: string,
  signerEmail?: string
): SignatureData {
  const documentHash = generateDocumentHash(content);

  return {
    signerName,
    signerRole,
    signerEmail,
    timestamp: new Date(),
    documentHash,
  };
}

/**
 * Verifica se uma assinatura é válida
 */
export function verifySignature(
  content: string,
  signature: SignatureData
): boolean {
  const currentHash = generateDocumentHash(content);
  return currentHash === signature.documentHash;
}

/**
 * Formata assinatura para exibição em PDF/documento
 */
export function formatSignatureBlock(signature: SignatureData): string {
  return `
═════════════════════════════════════════════════════════════════════════════
ASSINATURA DIGITAL

Assinado por: ${signature.signerName}
Cargo/Função: ${signature.signerRole}
${signature.signerEmail ? `Email: ${signature.signerEmail}\n` : ""}Data/Hora: ${signature.timestamp.toLocaleString("pt-BR")}
Hash do Documento: ${signature.documentHash}

Registro de integridade por hash. Não comprova a identidade do signatário
e não constitui assinatura digital certificada.

Certificado de Autenticidade: ${generateCertificateNumber()}
═════════════════════════════════════════════════════════════════════════════
`;
}

/**
 * Gera número de certificado único
 */
export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(8).toString("hex");
  return `${timestamp}-${random}`.toUpperCase();
}

/**
 * Cria assinatura com timestamp confiável
 */
export function createTrustedTimestampSignature(
  content: string,
  signerName: string,
  signerRole: string,
  signerEmail?: string
): SignatureData & { certificateNumber: string } {
  const signature = createDigitalSignature(
    content,
    signerName,
    signerRole,
    signerEmail
  );

  return {
    ...signature,
    certificateNumber: generateCertificateNumber(),
  };
}

/**
 * Valida múltiplas assinaturas de um documento
 */
export function validateMultipleSignatures(
  content: string,
  signatures: SignatureData[]
): { valid: boolean; invalidSignatures: number } {
  const documentHash = generateDocumentHash(content);
  const invalidCount = signatures.filter(
    sig => sig.documentHash !== documentHash
  ).length;

  return {
    valid: invalidCount === 0,
    invalidSignatures: invalidCount,
  };
}

/**
 * Cria cadeia de assinaturas (aprovação em cascata)
 */
export interface SignatureChain {
  documentHash: string;
  signatures: Array<
    SignatureData & {
      order: number;
      approvalStatus: "Aprovado" | "Rejeitado" | "Pendente";
    }
  >;
  createdAt: Date;
  completedAt?: Date;
}

export function createSignatureChain(content: string): SignatureChain {
  return {
    documentHash: generateDocumentHash(content),
    signatures: [],
    createdAt: new Date(),
  };
}

export function addSignatureToChain(
  chain: SignatureChain,
  signerName: string,
  signerRole: string,
  approvalStatus: "Aprovado" | "Rejeitado" | "Pendente",
  signerEmail?: string
): SignatureChain {
  const signature = createDigitalSignature(
    "",
    signerName,
    signerRole,
    signerEmail
  );

  chain.signatures.push({
    ...signature,
    order: chain.signatures.length + 1,
    approvalStatus,
  });

  if (
    approvalStatus === "Aprovado" &&
    chain.signatures.every(s => s.approvalStatus !== "Pendente")
  ) {
    chain.completedAt = new Date();
  }

  return chain;
}

/**
 * Gera relatório de assinatura para auditoria
 */
export function generateSignatureAuditReport(chain: SignatureChain): string {
  return `
RELATÓRIO DE AUDITORIA DE ASSINATURA DIGITAL

Hash do Documento: ${chain.documentHash}
Data de Criação: ${chain.createdAt.toLocaleString("pt-BR")}
${chain.completedAt ? `Data de Conclusão: ${chain.completedAt.toLocaleString("pt-BR")}\n` : ""}

CADEIA DE ASSINATURAS:
${chain.signatures
  .map(
    (sig, idx) => `
${idx + 1}. ${sig.signerName}
   Cargo: ${sig.signerRole}
   Email: ${sig.signerEmail || "Não informado"}
   Status: ${sig.approvalStatus}
   Data/Hora: ${sig.timestamp.toLocaleString("pt-BR")}
   Hash: ${sig.documentHash}
`
  )
  .join("\n")}

RESUMO:
- Total de Assinantes: ${chain.signatures.length}
- Aprovações: ${chain.signatures.filter(s => s.approvalStatus === "Aprovado").length}
- Rejeições: ${chain.signatures.filter(s => s.approvalStatus === "Rejeitado").length}
- Pendentes: ${chain.signatures.filter(s => s.approvalStatus === "Pendente").length}
- Status Final: ${chain.completedAt ? "Concluído" : "Em Processamento"}

Este relatório foi gerado automaticamente pelo sistema de assinatura digital.
`;
}
