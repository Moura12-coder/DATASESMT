/**
 * Gamification Service - Sistema de Pontos e Engajamento
 * 
 * Funcionalidades:
 * - Sistema de pontos e reputação
 * - Badges e conquistas
 * - Leaderboards
 * - Desafios e missões
 * - Recompensas
 */

// ============================================================================
// TIPOS
// ============================================================================

interface UserProfile {
  userId: string;
  userName: string;
  points: number;
  level: number;
  reputation: number;
  badges: Badge[];
  achievements: Achievement[];
  joinDate: Date;
  lastActivityDate: Date;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earnedDate: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  points: number;
  category: 'safety' | 'training' | 'compliance' | 'engagement' | 'leadership';
  unlockedDate: Date;
  progress: number; // 0-100
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'weekly' | 'monthly' | 'seasonal' | 'special';
  startDate: Date;
  endDate: Date;
  objective: string;
  reward: number; // pontos
  participants: string[];
  status: 'active' | 'completed' | 'expired';
}

interface Leaderboard {
  rank: number;
  userId: string;
  userName: string;
  points: number;
  level: number;
  badges: number;
  achievements: number;
}

// ============================================================================
// GAMIFICATION SERVICE
// ============================================================================

export class GamificationService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private badges: Map<string, Badge> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private pointsMultiplier: number = 1;

  constructor() {
    this.initializeBadges();
    this.initializeChallenges();
  }

  /**
   * Inicializar badges disponíveis
   */
  private initializeBadges() {
    const badges: Badge[] = [
      {
        id: 'badge-safety-first',
        name: '🛡️ Segurança em Primeiro',
        description: 'Completar 5 treinamentos de segurança',
        icon: '🛡️',
        criteria: 'trainings_completed >= 5',
        earnedDate: new Date(),
        rarity: 'common',
      },
      {
        id: 'badge-zero-incidents',
        name: '✨ Sem Incidentes',
        description: 'Passar 30 dias sem incidentes',
        icon: '✨',
        criteria: 'days_without_incidents >= 30',
        earnedDate: new Date(),
        rarity: 'uncommon',
      },
      {
        id: 'badge-compliance-master',
        name: '📋 Mestre da Conformidade',
        description: 'Manter 100% de conformidade por 90 dias',
        icon: '📋',
        criteria: 'compliance_score >= 100 && days >= 90',
        earnedDate: new Date(),
        rarity: 'rare',
      },
      {
        id: 'badge-leader',
        name: '👑 Líder de Segurança',
        description: 'Estar no top 10 do leaderboard',
        icon: '👑',
        criteria: 'leaderboard_rank <= 10',
        earnedDate: new Date(),
        rarity: 'epic',
      },
      {
        id: 'badge-legend',
        name: '⭐ Lenda da SST',
        description: 'Acumular 10000 pontos',
        icon: '⭐',
        criteria: 'total_points >= 10000',
        earnedDate: new Date(),
        rarity: 'legendary',
      },
    ];

    badges.forEach(badge => {
      this.badges.set(badge.id, badge);
    });
  }

  /**
   * Inicializar desafios
   */
  private initializeChallenges() {
    const challenges: Challenge[] = [
      {
        id: 'challenge-weekly-training',
        title: '📚 Semana de Treinamento',
        description: 'Completar 3 treinamentos esta semana',
        category: 'weekly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        objective: 'trainings_completed >= 3',
        reward: 500,
        participants: [],
        status: 'active',
      },
      {
        id: 'challenge-monthly-compliance',
        title: '✅ Mês de Conformidade',
        description: 'Manter 100% de conformidade o mês todo',
        category: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        objective: 'compliance_score >= 100',
        reward: 2000,
        participants: [],
        status: 'active',
      },
      {
        id: 'challenge-seasonal-safety',
        title: '🎯 Temporada de Segurança',
        description: 'Participar de 10 atividades de segurança',
        category: 'seasonal',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        objective: 'safety_activities >= 10',
        reward: 5000,
        participants: [],
        status: 'active',
      },
    ];

    challenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  /**
   * Criar perfil de usuário
   */
  createUserProfile(userId: string, userName: string): UserProfile {
    const profile: UserProfile = {
      userId,
      userName,
      points: 0,
      level: 1,
      reputation: 0,
      badges: [],
      achievements: [],
      joinDate: new Date(),
      lastActivityDate: new Date(),
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Obter perfil do usuário
   */
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Adicionar pontos
   */
  addPoints(userId: string, points: number, reason: string): number {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = this.createUserProfile(userId, `User-${userId}`);
    }

    const adjustedPoints = Math.round(points * this.pointsMultiplier);
    profile.points += adjustedPoints;
    profile.lastActivityDate = new Date();

    // Verificar aumento de nível
    const newLevel = Math.floor(profile.points / 1000) + 1;
    if (newLevel > profile.level) {
      profile.level = newLevel;
      console.log(`🎉 ${profile.userName} subiu para o nível ${newLevel}!`);
    }

    console.log(`⭐ ${profile.userName} ganhou ${adjustedPoints} pontos (${reason})`);

    return profile.points;
  }

  /**
   * Desbloquear badge
   */
  unlockBadge(userId: string, badgeId: string): Badge | null {
    const profile = this.userProfiles.get(userId);
    if (!profile) return null;

    const badge = this.badges.get(badgeId);
    if (!badge) return null;

    // Verificar se já possui o badge
    if (profile.badges.some(b => b.id === badgeId)) {
      return null;
    }

    profile.badges.push(badge);
    this.addPoints(userId, 100, `Desbloqueou badge: ${badge.name}`);

    console.log(`🏆 ${profile.userName} desbloqueou o badge: ${badge.name}`);

    return badge;
  }

  /**
   * Desbloquear conquista
   */
  unlockAchievement(
    userId: string,
    title: string,
    description: string,
    points: number,
    category: Achievement['category']
  ): Achievement {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = this.createUserProfile(userId, `User-${userId}`);
    }

    const achievement: Achievement = {
      id: `achievement-${Date.now()}`,
      userId,
      title,
      description,
      points,
      category,
      unlockedDate: new Date(),
      progress: 100,
    };

    profile.achievements.push(achievement);
    this.addPoints(userId, points, `Conquista: ${title}`);

    console.log(`🎖️ ${profile.userName} desbloqueou: ${title}`);

    return achievement;
  }

  /**
   * Adicionar reputação
   */
  addReputation(userId: string, amount: number, reason: string): number {
    const profile = this.userProfiles.get(userId);
    if (!profile) return 0;

    profile.reputation += amount;
    console.log(`👍 ${profile.userName} reputação: +${amount} (${reason})`);

    return profile.reputation;
  }

  /**
   * Participar de desafio
   */
  joinChallenge(userId: string, challengeId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return false;

    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      console.log(`✅ Usuário ${userId} participou do desafio: ${challenge.title}`);
      return true;
    }

    return false;
  }

  /**
   * Completar desafio
   */
  completeChallenge(userId: string, challengeId: string): number {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return 0;

    if (!challenge.participants.includes(userId)) {
      return 0;
    }

    const reward = challenge.reward;
    this.addPoints(userId, reward, `Desafio completado: ${challenge.title}`);

    console.log(`🎯 ${userId} completou o desafio e ganhou ${reward} pontos!`);

    return reward;
  }

  /**
   * Obter leaderboard
   */
  getLeaderboard(limit: number = 100): Leaderboard[] {
    const profiles = Array.from(this.userProfiles.values());

    const leaderboard = profiles
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
      .map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        userName: profile.userName,
        points: profile.points,
        level: profile.level,
        badges: profile.badges.length,
        achievements: profile.achievements.length,
      }));

    return leaderboard;
  }

  /**
   * Obter ranking do usuário
   */
  getUserRank(userId: string): number {
    const leaderboard = this.getLeaderboard(this.userProfiles.size);
    const userRank = leaderboard.find(entry => entry.userId === userId)?.rank || -1;
    return userRank;
  }

  /**
   * Obter desafios ativos
   */
  getActiveChallenges(): Challenge[] {
    return Array.from(this.challenges.values()).filter(c => c.status === 'active');
  }

  /**
   * Obter desafios do usuário
   */
  getUserChallenges(userId: string): Challenge[] {
    return Array.from(this.challenges.values()).filter(c => c.participants.includes(userId));
  }

  /**
   * Obter badges disponíveis
   */
  getAvailableBadges(): Badge[] {
    return Array.from(this.badges.values());
  }

  /**
   * Gerar relatório de engajamento
   */
  generateEngagementReport(userId: string): any {
    const profile = this.userProfiles.get(userId);
    if (!profile) return null;

    const leaderboard = this.getLeaderboard();
    const userRank = leaderboard.find(entry => entry.userId === userId);

    const report = {
      user: {
        id: profile.userId,
        name: profile.userName,
        joinDate: profile.joinDate,
        lastActivity: profile.lastActivityDate,
      },
      stats: {
        points: profile.points,
        level: profile.level,
        reputation: profile.reputation,
        rank: userRank?.rank || -1,
      },
      badges: {
        total: profile.badges.length,
        list: profile.badges.map(b => `${b.icon} ${b.name}`),
      },
      achievements: {
        total: profile.achievements.length,
        byCategory: {
          safety: profile.achievements.filter(a => a.category === 'safety').length,
          training: profile.achievements.filter(a => a.category === 'training').length,
          compliance: profile.achievements.filter(a => a.category === 'compliance').length,
          engagement: profile.achievements.filter(a => a.category === 'engagement').length,
          leadership: profile.achievements.filter(a => a.category === 'leadership').length,
        },
      },
      challenges: {
        total: this.getUserChallenges(userId).length,
        active: this.getUserChallenges(userId).filter(c => c.status === 'active').length,
      },
    };

    return report;
  }

  /**
   * Obter estatísticas gerais
   */
  getStatistics() {
    const profiles = Array.from(this.userProfiles.values());
    const totalPoints = profiles.reduce((sum, p) => sum + p.points, 0);
    const avgPoints = profiles.length > 0 ? Math.round(totalPoints / profiles.length) : 0;
    const avgLevel = profiles.length > 0 ? (profiles.reduce((sum, p) => sum + p.level, 0) / profiles.length).toFixed(1) : 0;
    const totalBadges = profiles.reduce((sum, p) => sum + p.badges.length, 0);
    const totalAchievements = profiles.reduce((sum, p) => sum + p.achievements.length, 0);

    return {
      totalUsers: profiles.length,
      totalPoints,
      avgPoints,
      avgLevel,
      totalBadges,
      totalAchievements,
      activeChallenges: this.getActiveChallenges().length,
      availableBadges: this.badges.size,
    };
  }

  /**
   * Simular atividades de engajamento
   */
  simulateEngagement(userId: string) {
    const activities = [
      { points: 100, reason: 'Completou treinamento' },
      { points: 50, reason: 'Reportou incidente' },
      { points: 75, reason: 'Participou de auditoria' },
      { points: 150, reason: 'Liderou sessão de segurança' },
      { points: 200, reason: 'Implementou melhoria' },
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];
    this.addPoints(userId, activity.points, activity.reason);

    // Chance de desbloquear badge
    if (Math.random() > 0.7) {
      const badgeId = Array.from(this.badges.keys())[Math.floor(Math.random() * this.badges.size)];
      this.unlockBadge(userId, badgeId);
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const gamificationService = new GamificationService();

export default gamificationService;
