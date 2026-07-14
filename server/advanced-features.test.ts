import { describe, it, expect, beforeEach } from 'vitest';
import { BlockchainService } from './blockchainService';
import { WearablesService } from './wearablesService';
import { DronesService } from './dronesService';
import { GamificationService } from './gamificationService';

describe('Advanced Features - Blockchain, Wearables, Drones, Gamification', () => {
  // ========================================================================
  // BLOCKCHAIN TESTS
  // ========================================================================
  describe('Blockchain Service', () => {
    let blockchain: BlockchainService;

    beforeEach(() => {
      blockchain = new BlockchainService();
    });

    it('should create genesis block', () => {
      const chain = blockchain.getFullChain();
      expect(chain.length).toBe(1);
      expect(chain[0].index).toBe(0);
      expect(chain[0].previousHash).toBe('0');
    });

    it('should record events', () => {
      const event = blockchain.recordEvent(
        'accident',
        'user-1',
        'João Silva',
        'Acidente com queda de altura',
        { location: 'Setor A', severity: 'high' }
      );

      expect(event.type).toBe('accident');
      expect(event.userId).toBe('user-1');
      expect(event.hash).toBeDefined();
    });

    it('should mine pending events', () => {
      // Registrar 10 eventos
      for (let i = 0; i < 10; i++) {
        blockchain.recordEvent(
          'training',
          `user-${i}`,
          `User ${i}`,
          `Treinamento ${i}`,
          { course: 'NR-10' }
        );
      }

      const chainLength = blockchain.getChainLength();
      expect(chainLength).toBeGreaterThan(1);
    });

    it('should verify chain integrity', () => {
      blockchain.recordEvent('approval', 'user-1', 'Admin', 'Aprovação de documento', {});

      const verification = blockchain.verifyChain();
      expect(verification.isValid).toBe(true);
      expect(verification.errors.length).toBe(0);
      expect(verification.integrityScore).toBeGreaterThanOrEqual(0);
    });

    it('should get events by type', () => {
      blockchain.recordEvent('accident', 'user-1', 'João', 'Acidente', {});
      blockchain.recordEvent('accident', 'user-2', 'Maria', 'Acidente', {});
      blockchain.recordEvent('training', 'user-3', 'Pedro', 'Treinamento', {});

      const accidents = blockchain.getEventsByType('accident');
      expect(accidents.length).toBe(2);
      expect(accidents.every(e => e.type === 'accident')).toBe(true);
    });

    it('should get events by user', () => {
      blockchain.recordEvent('accident', 'user-1', 'João', 'Acidente', {});
      blockchain.recordEvent('training', 'user-1', 'João', 'Treinamento', {});
      blockchain.recordEvent('approval', 'user-2', 'Maria', 'Aprovação', {});

      const userEvents = blockchain.getEventsByUser('user-1');
      expect(userEvents.length).toBe(2);
      expect(userEvents.every(e => e.userId === 'user-1')).toBe(true);
    });

    it('should generate event certificate', () => {
      const event = blockchain.recordEvent(
        'signature',
        'user-1',
        'João Silva',
        'Assinatura de documento',
        { document: 'PCMSO' }
      );

      const certificate = blockchain.generateEventCertificate(event.id);
      expect(certificate).toBeDefined();
      expect(certificate?.includes('CERTIFICADO')).toBe(true);
      expect(certificate?.includes(event.id)).toBe(true);
    });

    it('should get statistics', () => {
      blockchain.recordEvent('accident', 'user-1', 'João', 'Acidente', {});
      blockchain.recordEvent('training', 'user-2', 'Maria', 'Treinamento', {});

      const stats = blockchain.getStatistics();
      expect(stats.totalBlocks).toBeGreaterThan(0);
      expect(stats.totalEvents).toBeGreaterThanOrEqual(2);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(2);
    });

    it('should detect tampering', () => {
      blockchain.recordEvent('accident', 'user-1', 'João', 'Acidente', {});
      blockchain.minePendingEvents();

      const chain = blockchain.getFullChain();
      if (chain.length > 1) {
        blockchain.simulateAttack(1, 0);
        const verification = blockchain.verifyChain();
        expect(verification.isValid).toBe(false);
      }
    });
  });

  // ========================================================================
  // WEARABLES TESTS
  // ========================================================================
  describe('Wearables Service', () => {
    let wearables: WearablesService;

    beforeEach(() => {
      wearables = new WearablesService();
    });

    it('should initialize devices', () => {
      const devices = wearables.getDevices();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0]).toHaveProperty('id');
      expect(devices[0]).toHaveProperty('type');
    });

    it('should record health metrics', () => {
      const devices = wearables.getDevices();
      const metrics = wearables.recordMetrics(
        devices[0].id,
        75,
        98,
        36.5,
        5000,
        250
      );

      expect(metrics.heartRate).toBe(75);
      expect(metrics.bloodOxygen).toBe(98);
      expect(metrics.temperature).toBe(36.5);
    });

    it('should detect high heart rate', () => {
      const devices = wearables.getDevices();
      wearables.recordMetrics(devices[0].id, 130, 98, 36.5);

      const alerts = wearables.getAlerts(devices[0].userId);
      expect(alerts.some(a => a.type === 'high_heart_rate')).toBe(true);
    });

    it('should detect low oxygen', () => {
      const devices = wearables.getDevices();
      wearables.recordMetrics(devices[0].id, 75, 94, 36.5);

      const alerts = wearables.getAlerts(devices[0].userId);
      expect(alerts.some(a => a.type === 'low_oxygen')).toBe(true);
    });

    it('should detect fall', () => {
      const devices = wearables.getDevices();
      const isFall = wearables.detectFall(devices[0].id, 35);

      expect(isFall).toBe(true);
      const alerts = wearables.getAlerts();
      expect(alerts.some(a => a.type === 'fall_detected')).toBe(true);
    });

    it('should generate health report', () => {
      const devices = wearables.getDevices();
      for (let i = 0; i < 10; i++) {
        wearables.recordMetrics(devices[0].id, 70 + Math.random() * 10, 97, 36.5);
      }

      const report = wearables.getHealthReport(devices[0].id, 7);
      expect(report).toBeDefined();
      expect(report.heartRate).toBeDefined();
      expect(report.bloodOxygen).toBeDefined();
      expect(report.temperature).toBeDefined();
    });

    it('should sync device', () => {
      const devices = wearables.getDevices();
      const result = wearables.syncDevice(devices[0].id);
      expect(result).toBe(true);
    });

    it('should get statistics', () => {
      wearables.recordMetrics('wear-001', 75, 98, 36.5);

      const stats = wearables.getStatistics();
      expect(stats.totalDevices).toBeGreaterThan(0);
      expect(stats.activeDevices).toBeGreaterThanOrEqual(0);
      expect(stats.totalMetrics).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================================================
  // DRONES TESTS
  // ========================================================================
  describe('Drones Service', () => {
    let drones: DronesService;

    beforeEach(() => {
      drones = new DronesService();
    });

    it('should initialize drones', () => {
      const allDrones = drones.getAllDrones();
      expect(allDrones.length).toBeGreaterThan(0);
      expect(allDrones[0]).toHaveProperty('id');
      expect(allDrones[0]).toHaveProperty('model');
    });

    it('should get available drones', () => {
      const available = drones.getAvailableDrones();
      expect(available.length).toBeGreaterThan(0);
      expect(available.every(d => d.status === 'available')).toBe(true);
    });

    it('should plan mission', () => {
      const available = drones.getAvailableDrones();
      const mission = drones.planMission(
        available[0].id,
        { latitude: -23.5505, longitude: -46.6333 },
        'height_inspection',
        'user-1'
      );

      expect(mission.id).toBeDefined();
      expect(mission.status).toBe('planned');
      expect(mission.type).toBe('height_inspection');
    });

    it('should start flight', () => {
      const available = drones.getAvailableDrones();
      const mission = drones.planMission(
        available[0].id,
        { latitude: -23.5505, longitude: -46.6333 },
        'roof_inspection',
        'user-1'
      );

      const result = drones.startFlight(mission.id);
      expect(result).toBe(true);
    });

    it('should capture images', () => {
      const available = drones.getAvailableDrones();
      const mission = drones.planMission(
        available[0].id,
        { latitude: -23.5505, longitude: -46.6333 },
        'safety_audit',
        'user-1'
      );

      drones.startFlight(mission.id);
      const image = drones.captureImage(mission.id, 'Estrutura danificada', true, 'high');

      expect(image.id).toBeDefined();
      expect(image.analysis?.hasRisk).toBe(true);
    });

    it('should end flight', () => {
      const available = drones.getAvailableDrones();
      const mission = drones.planMission(
        available[0].id,
        { latitude: -23.5505, longitude: -46.6333 },
        'thermal_imaging',
        'user-1'
      );

      drones.startFlight(mission.id);
      drones.captureImage(mission.id, 'Teste', false);
      const completed = drones.endFlight(mission.id);

      expect(completed?.status).toBe('completed');
      expect(completed?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should generate inspection report', () => {
      const available = drones.getAvailableDrones();
      const mission = drones.planMission(
        available[0].id,
        { latitude: -23.5505, longitude: -46.6333 },
        'equipment_check',
        'user-1'
      );

      drones.startFlight(mission.id);
      drones.captureImage(mission.id, 'Equipamento OK', false);
      drones.endFlight(mission.id);

      const report = drones.generateInspectionReport(mission.id);
      expect(report).toBeDefined();
      expect(report.includes('RELATÓRIO')).toBe(true);
      expect(report.includes(mission.id)).toBe(true);
    });

    it('should schedule maintenance', () => {
      const allDrones = drones.getAllDrones();
      const result = drones.scheduleMaintenance(allDrones[0].id);
      expect(result).toBe(true);
    });

    it('should get statistics', () => {
      const stats = drones.getStatistics();
      expect(stats.totalDrones).toBeGreaterThan(0);
      expect(stats.availableDrones).toBeGreaterThanOrEqual(0);
      expect(stats.totalMissions).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // GAMIFICATION TESTS
  // ========================================================================
  describe('Gamification Service', () => {
    let gamification: GamificationService;

    beforeEach(() => {
      gamification = new GamificationService();
    });

    it('should create user profile', () => {
      const profile = gamification.createUserProfile('user-1', 'João Silva');

      expect(profile.userId).toBe('user-1');
      expect(profile.userName).toBe('João Silva');
      expect(profile.points).toBe(0);
      expect(profile.level).toBe(1);
    });

    it('should add points', () => {
      gamification.createUserProfile('user-1', 'João');
      const points = gamification.addPoints('user-1', 100, 'Treinamento completo');

      expect(points).toBe(100);
    });

    it('should level up', () => {
      gamification.createUserProfile('user-1', 'João');
      gamification.addPoints('user-1', 1000, 'Teste');

      const profile = gamification.getUserProfile('user-1');
      expect(profile?.level).toBeGreaterThan(1);
    });

    it('should unlock badge', () => {
      gamification.createUserProfile('user-1', 'João');
      const badge = gamification.unlockBadge('user-1', 'badge-safety-first');

      expect(badge).toBeDefined();
      expect(badge?.name).toContain('Segurança');
    });

    it('should unlock achievement', () => {
      gamification.createUserProfile('user-1', 'João');
      const achievement = gamification.unlockAchievement(
        'user-1',
        'Primeiro Treinamento',
        'Completou o primeiro treinamento',
        250,
        'training'
      );

      expect(achievement.title).toBe('Primeiro Treinamento');
      expect(achievement.points).toBe(250);
    });

    it('should add reputation', () => {
      gamification.createUserProfile('user-1', 'João');
      const reputation = gamification.addReputation('user-1', 50, 'Ajudou colega');

      expect(reputation).toBe(50);
    });

    it('should join challenge', () => {
      gamification.createUserProfile('user-1', 'João');
      const challenges = gamification.getActiveChallenges();

      if (challenges.length > 0) {
        const result = gamification.joinChallenge('user-1', challenges[0].id);
        expect(result).toBe(true);
      }
    });

    it('should complete challenge', () => {
      gamification.createUserProfile('user-1', 'João');
      const challenges = gamification.getActiveChallenges();

      if (challenges.length > 0) {
        gamification.joinChallenge('user-1', challenges[0].id);
        const reward = gamification.completeChallenge('user-1', challenges[0].id);

        expect(reward).toBeGreaterThan(0);
      }
    });

    it('should get leaderboard', () => {
      gamification.createUserProfile('user-1', 'João');
      gamification.createUserProfile('user-2', 'Maria');
      gamification.addPoints('user-1', 500, 'Teste');
      gamification.addPoints('user-2', 300, 'Teste');

      const leaderboard = gamification.getLeaderboard();
      expect(leaderboard.length).toBeGreaterThan(0);
      expect(leaderboard[0].points).toBeGreaterThanOrEqual(leaderboard[1]?.points || 0);
    });

    it('should get user rank', () => {
      gamification.createUserProfile('user-1', 'João');
      gamification.addPoints('user-1', 500, 'Teste');

      const rank = gamification.getUserRank('user-1');
      expect(rank).toBeGreaterThan(0);
    });

    it('should generate engagement report', () => {
      gamification.createUserProfile('user-1', 'João');
      gamification.addPoints('user-1', 100, 'Teste');
      gamification.unlockBadge('user-1', 'badge-safety-first');

      const report = gamification.generateEngagementReport('user-1');
      expect(report).toBeDefined();
      expect(report.user.id).toBe('user-1');
      expect(report.stats.points).toBeGreaterThanOrEqual(100);
    });

    it('should get statistics', () => {
      gamification.createUserProfile('user-1', 'João');
      gamification.createUserProfile('user-2', 'Maria');

      const stats = gamification.getStatistics();
      expect(stats.totalUsers).toBe(2);
      expect(stats.availableBadges).toBeGreaterThan(0);
    });

    it('should simulate engagement', () => {
      gamification.createUserProfile('user-1', 'João');
      const profileBefore = gamification.getUserProfile('user-1');

      gamification.simulateEngagement('user-1');

      const profileAfter = gamification.getUserProfile('user-1');
      expect(profileAfter!.points).toBeGreaterThanOrEqual(profileBefore!.points);
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================
  describe('Integration - Advanced Features', () => {
    it('should integrate blockchain with events', () => {
      const blockchain = new BlockchainService();
      blockchain.recordEvent('accident', 'user-1', 'João', 'Acidente', {});

      const events = blockchain.getAllEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('accident');
    });

    it('should integrate gamification with achievements', () => {
      const gamification = new GamificationService();
      gamification.createUserProfile('user-1', 'João');
      gamification.unlockAchievement('user-1', 'Teste', 'Descrição', 100, 'safety');

      const profile = gamification.getUserProfile('user-1');
      expect(profile?.achievements.length).toBe(1);
    });

    it('should integrate wearables with health monitoring', () => {
      const wearables = new WearablesService();
      const devices = wearables.getDevices();

      wearables.recordMetrics(devices[0].id, 75, 98, 36.5);
      const report = wearables.getHealthReport(devices[0].id);

      expect(report.dataPoints).toBeGreaterThan(0);
    });

    it('should integrate drones with mission planning', () => {
      const drones = new DronesService();
      const available = drones.getAvailableDrones();

      const mission = drones.planMission(
        available[0].id,
        { latitude: -23.5505, longitude: -46.6333 },
        'height_inspection',
        'user-1'
      );

      expect(mission.status).toBe('planned');
    });
  });

  // ========================================================================
  // PERFORMANCE TESTS
  // ========================================================================
  describe('Performance', () => {
    it('should handle 100 blockchain events efficiently', () => {
      const blockchain = new BlockchainService();
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        blockchain.recordEvent('training', `user-${i}`, `User ${i}`, `Training ${i}`, {});
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(40000); // Menos de 40 segundos (tolerância para ambiente de teste)
    });

    it('should handle 1000 health metrics efficiently', () => {
      const wearables = new WearablesService();
      const devices = wearables.getDevices();
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        wearables.recordMetrics(devices[0].id, 70 + Math.random() * 20, 95 + Math.random() * 5, 36.5);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });

    it('should generate leaderboard quickly', () => {
      const gamification = new GamificationService();

      for (let i = 0; i < 100; i++) {
        gamification.createUserProfile(`user-${i}`, `User ${i}`);
        gamification.addPoints(`user-${i}`, Math.random() * 10000, 'Teste');
      }

      const start = Date.now();
      const leaderboard = gamification.getLeaderboard(100);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(leaderboard.length).toBe(100);
    });
  });
});
