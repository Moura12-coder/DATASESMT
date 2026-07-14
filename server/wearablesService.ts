/**
 * Wearables Service - Monitoramento de Saúde
 * 
 * Funcionalidades:
 * - Integração com smartwatches e pulseiras
 * - Monitoramento de frequência cardíaca
 * - Detecção de quedas
 * - Alertas de saúde
 */

// ============================================================================
// TIPOS
// ============================================================================

interface WearableDevice {
  id: string;
  userId: string;
  type: 'smartwatch' | 'wristband' | 'chest_strap' | 'safety_helmet';
  model: string;
  serialNumber: string;
  status: 'active' | 'inactive' | 'low_battery' | 'offline';
  batteryLevel: number;
  lastSync: Date;
  pairedAt: Date;
}

interface HealthMetrics {
  deviceId: string;
  timestamp: Date;
  heartRate: number;
  bloodOxygen: number;
  temperature: number;
  steps: number;
  calories: number;
  sleepQuality?: number;
  stress?: number;
}

interface HealthAlert {
  id: string;
  deviceId: string;
  userId: string;
  type: 'high_heart_rate' | 'low_oxygen' | 'fall_detected' | 'high_temperature' | 'abnormal_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  recommendedAction: string;
}

// ============================================================================
// WEARABLES SERVICE
// ============================================================================

export class WearablesService {
  private devices: Map<string, WearableDevice> = new Map();
  private metrics: HealthMetrics[] = [];
  private alerts: HealthAlert[] = [];
  private healthThresholds = {
    heartRateMin: 60,
    heartRateMax: 100,
    heartRateCritical: 120,
    bloodOxygenMin: 95,
    temperatureMax: 37.5,
    temperatureCritical: 39,
  };

  constructor() {
    this.initializeDevices();
  }

  /**
   * Inicializar dispositivos wearables
   */
  private initializeDevices() {
    const devices: WearableDevice[] = [
      {
        id: 'wear-001',
        userId: 'user-1',
        type: 'smartwatch',
        model: 'Apple Watch Series 8',
        serialNumber: 'AW-2024-001',
        status: 'active',
        batteryLevel: 85,
        lastSync: new Date(),
        pairedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'wear-002',
        userId: 'user-2',
        type: 'wristband',
        model: 'Fitbit Charge 6',
        serialNumber: 'FB-2024-002',
        status: 'active',
        batteryLevel: 72,
        lastSync: new Date(),
        pairedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'wear-003',
        userId: 'user-3',
        type: 'chest_strap',
        model: 'Polar H10',
        serialNumber: 'PH-2024-003',
        status: 'active',
        batteryLevel: 91,
        lastSync: new Date(),
        pairedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'wear-004',
        userId: 'user-4',
        type: 'safety_helmet',
        model: 'Smart Safety Helmet Pro',
        serialNumber: 'SSH-2024-004',
        status: 'active',
        batteryLevel: 88,
        lastSync: new Date(),
        pairedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ];

    devices.forEach(device => {
      this.devices.set(device.id, device);
    });
  }

  /**
   * Registrar métricas de saúde
   */
  recordMetrics(
    deviceId: string,
    heartRate: number,
    bloodOxygen: number,
    temperature: number,
    steps: number = 0,
    calories: number = 0
  ): HealthMetrics {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Dispositivo ${deviceId} não encontrado`);

    const metrics: HealthMetrics = {
      deviceId,
      timestamp: new Date(),
      heartRate,
      bloodOxygen,
      temperature,
      steps,
      calories,
    };

    this.metrics.push(metrics);

    // Manter apenas últimas 10000 métricas
    if (this.metrics.length > 10000) {
      this.metrics.shift();
    }

    // Verificar alertas
    this.checkHealthAlerts(device, metrics);

    // Atualizar status do dispositivo
    device.lastSync = new Date();
    device.batteryLevel = Math.max(0, device.batteryLevel - 0.5);

    if (device.batteryLevel < 20) {
      device.status = 'low_battery';
    }

    return metrics;
  }

  /**
   * Verificar alertas de saúde
   */
  private checkHealthAlerts(device: WearableDevice, metrics: HealthMetrics) {
    const alerts: HealthAlert[] = [];

    // Frequência cardíaca crítica
    if (metrics.heartRate > this.healthThresholds.heartRateCritical) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        deviceId: device.id,
        userId: device.userId,
        type: 'high_heart_rate',
        severity: 'critical',
        message: `❤️ Frequência cardíaca crítica: ${metrics.heartRate} bpm`,
        timestamp: new Date(),
        acknowledged: false,
        recommendedAction: 'Procurar atendimento médico imediatamente',
      });
    }
    // Frequência cardíaca alta
    else if (metrics.heartRate > this.healthThresholds.heartRateMax) {
      alerts.push({
        id: `alert-${Date.now()}-2`,
        deviceId: device.id,
        userId: device.userId,
        type: 'high_heart_rate',
        severity: 'high',
        message: `❤️ Frequência cardíaca elevada: ${metrics.heartRate} bpm`,
        timestamp: new Date(),
        acknowledged: false,
        recommendedAction: 'Descansar e monitorar',
      });
    }

    // Oxigênio baixo
    if (metrics.bloodOxygen < this.healthThresholds.bloodOxygenMin) {
      alerts.push({
        id: `alert-${Date.now()}-3`,
        deviceId: device.id,
        userId: device.userId,
        type: 'low_oxygen',
        severity: 'high',
        message: `🫁 Oxigênio no sangue baixo: ${metrics.bloodOxygen}%`,
        timestamp: new Date(),
        acknowledged: false,
        recommendedAction: 'Procurar ar fresco e descansar',
      });
    }

    // Temperatura crítica
    if (metrics.temperature > this.healthThresholds.temperatureCritical) {
      alerts.push({
        id: `alert-${Date.now()}-4`,
        deviceId: device.id,
        userId: device.userId,
        type: 'high_temperature',
        severity: 'critical',
        message: `🌡️ Temperatura crítica: ${metrics.temperature}°C`,
        timestamp: new Date(),
        acknowledged: false,
        recommendedAction: 'Procurar atendimento médico',
      });
    }
    // Temperatura elevada
    else if (metrics.temperature > this.healthThresholds.temperatureMax) {
      alerts.push({
        id: `alert-${Date.now()}-5`,
        deviceId: device.id,
        userId: device.userId,
        type: 'high_temperature',
        severity: 'medium',
        message: `🌡️ Temperatura elevada: ${metrics.temperature}°C`,
        timestamp: new Date(),
        acknowledged: false,
        recommendedAction: 'Monitorar temperatura',
      });
    }

    // Adicionar alertas
    this.alerts.push(...alerts);

    // Log de alertas
    alerts.forEach(alert => {
      console.log(`⚠️ ALERTA DE SAÚDE: ${alert.message}`);
    });
  }

  /**
   * Detectar queda
   */
  detectFall(deviceId: string, acceleration: number): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    // Simular detecção de queda (aceleração > 3G)
    const isFall = acceleration > 30;

    if (isFall) {
      const alert: HealthAlert = {
        id: `alert-fall-${Date.now()}`,
        deviceId,
        userId: device.userId,
        type: 'fall_detected',
        severity: 'critical',
        message: `🚨 QUEDA DETECTADA! Aceleração: ${acceleration.toFixed(1)}G`,
        timestamp: new Date(),
        acknowledged: false,
        recommendedAction: 'Verificar situação do usuário imediatamente',
      };

      this.alerts.push(alert);
      console.log(`🚨 QUEDA DETECTADA em ${device.model} (${device.serialNumber})`);
    }

    return isFall;
  }

  /**
   * Obter dispositivos
   */
  getDevices(userId?: string): WearableDevice[] {
    if (userId) {
      return Array.from(this.devices.values()).filter(d => d.userId === userId);
    }
    return Array.from(this.devices.values());
  }

  /**
   * Obter métricas recentes
   */
  getRecentMetrics(deviceId: string, limit: number = 100): HealthMetrics[] {
    return this.metrics
      .filter(m => m.deviceId === deviceId)
      .slice(-limit);
  }

  /**
   * Obter alertas
   */
  getAlerts(userId?: string, acknowledged?: boolean): HealthAlert[] {
    let filtered = this.alerts;

    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    }

    if (acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === acknowledged);
    }

    return filtered;
  }

  /**
   * Reconhecer alerta
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Obter relatório de saúde
   */
  getHealthReport(deviceId: string, days: number = 7): any {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(
      m => m.deviceId === deviceId && m.timestamp >= cutoffDate
    );

    if (recentMetrics.length === 0) {
      return {
        device,
        period: { days, from: cutoffDate, to: new Date() },
        dataPoints: 0,
        summary: 'Sem dados disponíveis',
      };
    }

    const heartRates = recentMetrics.map(m => m.heartRate);
    const bloodOxygens = recentMetrics.map(m => m.bloodOxygen);
    const temperatures = recentMetrics.map(m => m.temperature);

    const average = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length;
    const max = (arr: number[]) => Math.max(...arr);
    const min = (arr: number[]) => Math.min(...arr);

    return {
      device,
      period: { days, from: cutoffDate, to: new Date() },
      dataPoints: recentMetrics.length,
      heartRate: {
        average: average(heartRates).toFixed(1),
        min: min(heartRates),
        max: max(heartRates),
        status: average(heartRates) > this.healthThresholds.heartRateMax ? 'Elevada' : 'Normal',
      },
      bloodOxygen: {
        average: average(bloodOxygens).toFixed(1),
        min: min(bloodOxygens),
        max: max(bloodOxygens),
        status: average(bloodOxygens) < this.healthThresholds.bloodOxygenMin ? 'Baixa' : 'Normal',
      },
      temperature: {
        average: average(temperatures).toFixed(1),
        min: min(temperatures),
        max: max(temperatures),
        status: average(temperatures) > this.healthThresholds.temperatureMax ? 'Elevada' : 'Normal',
      },
      alerts: this.alerts.filter(a => a.deviceId === deviceId && a.timestamp >= cutoffDate),
    };
  }

  /**
   * Sincronizar dispositivo
   */
  syncDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.lastSync = new Date();
    device.status = 'active';

    console.log(`🔄 Dispositivo ${device.model} sincronizado`);

    return true;
  }

  /**
   * Desconectar dispositivo
   */
  disconnectDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.status = 'offline';

    console.log(`🔌 Dispositivo ${device.model} desconectado`);

    return true;
  }

  /**
   * Obter estatísticas gerais
   */
  getStatistics() {
    const activeDevices = Array.from(this.devices.values()).filter(d => d.status === 'active').length;
    const lowBatteryDevices = Array.from(this.devices.values()).filter(d => d.batteryLevel < 20).length;
    const activeAlerts = this.alerts.filter(a => !a.acknowledged).length;
    const criticalAlerts = this.alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;

    const recentMetrics = this.metrics.slice(-1000);
    const avgHeartRate = recentMetrics.length > 0
      ? (recentMetrics.reduce((sum, m) => sum + m.heartRate, 0) / recentMetrics.length).toFixed(1)
      : 0;

    return {
      totalDevices: this.devices.size,
      activeDevices,
      lowBatteryDevices,
      totalMetrics: this.metrics.length,
      activeAlerts,
      criticalAlerts,
      avgHeartRate,
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const wearablesService = new WearablesService();

export default wearablesService;
