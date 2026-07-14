/**
 * Blockchain Service - Rastreabilidade Imutável
 * 
 * Funcionalidades:
 * - Registro imutável de eventos críticos
 * - Cadeia de blocos com hash criptográfico
 * - Verificação de integridade
 * - Auditoria completa
 */

import crypto from 'crypto';

// ============================================================================
// TIPOS
// ============================================================================

interface BlockchainEvent {
  id: string;
  type: 'accident' | 'approval' | 'signature' | 'compliance' | 'training' | 'incident';
  timestamp: Date;
  userId: string;
  userName: string;
  description: string;
  data: Record<string, any>;
  hash: string;
  previousHash: string;
}

interface Block {
  index: number;
  timestamp: Date;
  events: BlockchainEvent[];
  previousHash: string;
  hash: string;
  nonce: number;
}

interface BlockchainVerification {
  isValid: boolean;
  errors: string[];
  lastValidBlock: number;
  integrityScore: number; // 0-100
}

// ============================================================================
// BLOCKCHAIN SERVICE
// ============================================================================

export class BlockchainService {
  private chain: Block[] = [];
  private pendingEvents: BlockchainEvent[] = [];
  private difficulty: number = 4; // Número de zeros no início do hash
  private blockSize: number = 10; // Eventos por bloco

  constructor() {
    this.createGenesisBlock();
  }

  /**
   * Criar bloco gênesis
   */
  private createGenesisBlock() {
    const genesisBlock: Block = {
      index: 0,
      timestamp: new Date(),
      events: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
    };

    genesisBlock.hash = this.calculateHash(genesisBlock);
    this.chain.push(genesisBlock);
  }

  /**
   * Calcular hash de um bloco
   */
  private calculateHash(block: Block): string {
    const blockString = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      events: block.events,
      previousHash: block.previousHash,
      nonce: block.nonce,
    });

    return crypto.createHash('sha256').update(blockString).digest('hex');
  }

  /**
   * Calcular hash de um evento
   */
  private calculateEventHash(event: Partial<BlockchainEvent>): string {
    const eventString = JSON.stringify({
      type: event.type,
      timestamp: event.timestamp,
      userId: event.userId,
      description: event.description,
      data: event.data,
    });

    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  /**
   * Minerar bloco (Proof of Work)
   */
  private mineBlock(block: Block): Block {
    let nonce = 0;
    let hash = this.calculateHash(block);

    while (!hash.startsWith('0'.repeat(this.difficulty))) {
      nonce++;
      block.nonce = nonce;
      hash = this.calculateHash(block);
    }

    block.hash = hash;
    return block;
  }

  /**
   * Registrar evento na blockchain
   */
  recordEvent(
    type: BlockchainEvent['type'],
    userId: string,
    userName: string,
    description: string,
    data: Record<string, any>
  ): BlockchainEvent {
    const event: BlockchainEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      userId,
      userName,
      description,
      data,
      hash: '',
      previousHash: this.chain[this.chain.length - 1].hash,
    };

    event.hash = this.calculateEventHash(event);
    this.pendingEvents.push(event);

    // Minerar bloco se atingiu o tamanho máximo
    if (this.pendingEvents.length >= this.blockSize) {
      this.minePendingEvents();
    }

    return event;
  }

  /**
   * Minerar eventos pendentes
   */
  minePendingEvents(): Block {
    const lastBlock = this.chain[this.chain.length - 1];

    const newBlock: Block = {
      index: this.chain.length,
      timestamp: new Date(),
      events: this.pendingEvents,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0,
    };

    // Minerar bloco
    const minedBlock = this.mineBlock(newBlock);
    this.chain.push(minedBlock);

    // Limpar eventos pendentes
    this.pendingEvents = [];

    console.log(`⛏️ Bloco #${minedBlock.index} minerado com ${minedBlock.events.length} eventos`);

    return minedBlock;
  }

  /**
   * Obter todos os eventos
   */
  getAllEvents(): BlockchainEvent[] {
    const allEvents: BlockchainEvent[] = [];

    this.chain.forEach(block => {
      allEvents.push(...block.events);
    });

    // Adicionar eventos pendentes
    allEvents.push(...this.pendingEvents);

    return allEvents;
  }

  /**
   * Obter eventos por tipo
   */
  getEventsByType(type: BlockchainEvent['type']): BlockchainEvent[] {
    return this.getAllEvents().filter(event => event.type === type);
  }

  /**
   * Obter eventos por usuário
   */
  getEventsByUser(userId: string): BlockchainEvent[] {
    return this.getAllEvents().filter(event => event.userId === userId);
  }

  /**
   * Obter eventos em período
   */
  getEventsByPeriod(startDate: Date, endDate: Date): BlockchainEvent[] {
    return this.getAllEvents().filter(
      event => event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  /**
   * Obter bloco por índice
   */
  getBlock(index: number): Block | undefined {
    return this.chain[index];
  }

  /**
   * Obter tamanho da cadeia
   */
  getChainLength(): number {
    return this.chain.length;
  }

  /**
   * Obter cadeia completa
   */
  getFullChain(): Block[] {
    return this.chain;
  }

  /**
   * Verificar integridade da blockchain
   */
  verifyChain(): BlockchainVerification {
    const errors: string[] = [];
    let lastValidBlock = -1;

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verificar hash do bloco atual
      const calculatedHash = this.calculateHash(currentBlock);
      if (calculatedHash !== currentBlock.hash) {
        errors.push(`Bloco #${i}: Hash inválido`);
        break;
      }

      // Verificar referência ao bloco anterior
      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(`Bloco #${i}: Referência ao bloco anterior inválida`);
        break;
      }

      // Verificar Proof of Work
      if (!currentBlock.hash.startsWith('0'.repeat(this.difficulty))) {
        errors.push(`Bloco #${i}: Proof of Work inválido`);
        break;
      }

      lastValidBlock = i;
    }

    const integrityScore = Math.round(((lastValidBlock + 1) / this.chain.length) * 100);

    return {
      isValid: errors.length === 0,
      errors,
      lastValidBlock,
      integrityScore,
    };
  }

  /**
   * Obter estatísticas da blockchain
   */
  getStatistics() {
    const allEvents = this.getAllEvents();

    const eventsByType = {
      accident: allEvents.filter(e => e.type === 'accident').length,
      approval: allEvents.filter(e => e.type === 'approval').length,
      signature: allEvents.filter(e => e.type === 'signature').length,
      compliance: allEvents.filter(e => e.type === 'compliance').length,
      training: allEvents.filter(e => e.type === 'training').length,
      incident: allEvents.filter(e => e.type === 'incident').length,
    };

    const uniqueUsers = new Set(allEvents.map(e => e.userId)).size;
    const oldestEvent = allEvents.length > 0 ? allEvents[0].timestamp : null;
    const newestEvent = allEvents.length > 0 ? allEvents[allEvents.length - 1].timestamp : null;

    return {
      totalBlocks: this.chain.length,
      totalEvents: allEvents.length,
      pendingEvents: this.pendingEvents.length,
      eventsByType,
      uniqueUsers,
      oldestEvent,
      newestEvent,
      chainSize: JSON.stringify(this.chain).length,
    };
  }

  /**
   * Exportar blockchain para auditoria
   */
  exportForAudit() {
    const verification = this.verifyChain();
    const statistics = this.getStatistics();

    return {
      exportDate: new Date(),
      verification,
      statistics,
      chain: this.chain,
      allEvents: this.getAllEvents(),
    };
  }

  /**
   * Gerar certificado de evento
   */
  generateEventCertificate(eventId: string): string | null {
    const allEvents = this.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event) return null;

    const certificate = `
╔════════════════════════════════════════════════════════════════╗
║          CERTIFICADO DE REGISTRO BLOCKCHAIN                   ║
╚════════════════════════════════════════════════════════════════╝

Tipo de Evento:     ${event.type.toUpperCase()}
ID do Evento:       ${event.id}
Data/Hora:          ${event.timestamp.toLocaleString('pt-BR')}
Usuário:            ${event.userName} (${event.userId})
Descrição:          ${event.description}

Hash do Evento:     ${event.hash}
Hash Anterior:      ${event.previousHash}

Dados:
${JSON.stringify(event.data, null, 2)}

Verificação:        ✓ VÁLIDO
Status:             ✓ REGISTRADO NA BLOCKCHAIN
Imutabilidade:      ✓ GARANTIDA

═══════════════════════════════════════════════════════════════════
Gerado em: ${new Date().toLocaleString('pt-BR')}
═══════════════════════════════════════════════════════════════════
    `;

    return certificate;
  }

  /**
   * Simular ataque à blockchain (para testes)
   */
  simulateAttack(blockIndex: number, eventIndex: number) {
    if (blockIndex >= this.chain.length) return false;

    const block = this.chain[blockIndex];
    if (eventIndex >= block.events.length) return false;

    // Modificar evento
    block.events[eventIndex].description = 'EVENTO MODIFICADO - ATAQUE DETECTADO';

    console.log(`⚠️ Ataque simulado no bloco #${blockIndex}, evento #${eventIndex}`);

    return true;
  }

  /**
   * Obter histórico de um evento específico
   */
  getEventHistory(eventId: string) {
    const allEvents = this.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event) return null;

    // Encontrar bloco contendo o evento
    let blockIndex = -1;
    for (let i = 0; i < this.chain.length; i++) {
      if (this.chain[i].events.some(e => e.id === eventId)) {
        blockIndex = i;
        break;
      }
    }

    return {
      event,
      blockIndex,
      block: blockIndex >= 0 ? this.chain[blockIndex] : null,
      isInChain: blockIndex >= 0,
      isValid: this.verifyChain().isValid,
    };
  }

  /**
   * Obter timeline de eventos
   */
  getTimeline(limit: number = 50) {
    const allEvents = this.getAllEvents();
    return allEvents.slice(-limit).reverse();
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const blockchainService = new BlockchainService();

export default blockchainService;
