/**
 * IoT Service - Monitoramento em Tempo Real
 * 
 * Funcionalidades:
 * - Conexão com sensores IoT
 * - Monitoramento de equipamentos
 * - Alertas em tempo real
 * - Histórico de dados
 */

import { z } from 'zod';

// ============================================================================
// TIPOS
// ============================================================================

interface IoTDevice {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'noise' | 'air_quality' | 'motion' | 'epc_condition';
  location: string;
  status: 'online' | 'offline' | 'error';
  lastReading: Date;
  battery?: number;
}

interface SensorReading {
  deviceId: string;
  timestamp: Date;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  deviceId: string;
  type: 'temperature' | 'humidity' | 'noise' | 'air_quality' | 'device_offline' | 'battery_low';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================================================
// IoT SERVICE
// ============================================================================

export class IoTService {
  private devices: Map<string, IoTDevice> = new Map();
  private readings: SensorReading[] = [];
  private alerts: Alert[] = [];
  private thresholds = {
    temperature: { min: 15, max: 30 },
    humidity: { min: 30, max: 70 },
    noise: { max: 85 }, // dB
    airQuality: { max: 150 }, // AQI
    batteryLow: 20, // %
  };

  constructor() {
    this.initializeDevices();
    this.startMonitoring();
  }

  /**
   * Inicializar dispositivos IoT
   */
  private initializeDevices() {
    const devices: IoTDevice[] = [
      {
        id: 'temp-001',
        name: 'Termômetro - Setor A',
        type: 'temperature',
        location: 'Setor A - Produção',
        status: 'online',
        lastReading: new Date(),
        battery: 85,
      },
      {
        id: 'humid-001',
        name: 'Higrômetro - Setor B',
        type: 'humidity',
        location: 'Setor B - Armazém',
        status: 'online',
        lastReading: new Date(),
        battery: 92,
      },
      {
        id: 'noise-001',
        name: 'Medidor de Ruído - Setor C',
        type: 'noise',
        location: 'Setor C - Máquinas',
        status: 'online',
        lastReading: new Date(),
        battery: 78,
      },
      {
        id: 'air-001',
        name: 'Monitor de Qualidade do Ar - Setor A',
        type: 'air_quality',
        location: 'Setor A - Produção',
        status: 'online',
        lastReading: new Date(),
        battery: 88,
      },
      {
        id: 'motion-001',
        name: 'Sensor de Movimento - Entrada',
        type: 'motion',
        location: 'Entrada Principal',
        status: 'online',
        lastReading: new Date(),
        battery: 95,
      },
      {
        id: 'epc-001',
        name: 'Monitor de Condição EPC - Plataforma',
        type: 'epc_condition',
        location: 'Plataforma de Trabalho',
        status: 'online',
        lastReading: new Date(),
        battery: 72,
      },
    ];

    devices.forEach(device => {
      this.devices.set(device.id, device);
    });
  }

  /**
   * Iniciar monitoramento contínuo
   */
  private startMonitoring() {
    // Simular leituras periódicas
    setInterval(() => {
      this.devices.forEach((device) => {
        this.recordReading(device.id);
      });
    }, 60000); // A cada 1 minuto
  }

  /**
   * Registrar leitura de sensor
   */
  private recordReading(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    let value = 0;
    let unit = '';

    switch (device.type) {
      case 'temperature':
        value = 20 + Math.random() * 10; // 20-30°C
        unit = '°C';
        break;
      case 'humidity':
        value = 40 + Math.random() * 30; // 40-70%
        unit = '%';
        break;
      case 'noise':
        value = 75 + Math.random() * 15; // 75-90 dB
        unit = 'dB';
        break;
      case 'air_quality':
        value = 50 + Math.random() * 100; // 50-150 AQI
        unit = 'AQI';
        break;
      case 'motion':
        value = Math.random() > 0.7 ? 1 : 0; // 1 = movimento detectado
        unit = 'bool';
        break;
      case 'epc_condition':
        value = 70 + Math.random() * 30; // 70-100% condição
        unit = '%';
        break;
    }

    const status = this.evaluateStatus(device.type, value);
    const reading: SensorReading = {
      deviceId,
      timestamp: new Date(),
      value,
      unit,
      status,
    };

    this.readings.push(reading);

    // Manter apenas últimas 1000 leituras
    if (this.readings.length > 1000) {
      this.readings.shift();
    }

    // Gerar alertas se necessário
    if (status !== 'normal') {
      this.generateAlert(device, reading);
    }

    // Atualizar status do dispositivo
    device.lastReading = new Date();
    if (device.battery) {
      device.battery = Math.max(0, device.battery - 0.1); // Simular consumo
      if (device.battery < this.thresholds.batteryLow) {
        this.generateBatteryAlert(device);
      }
    }
  }

  /**
   * Avaliar status da leitura
   */
  private evaluateStatus(type: string, value: number): 'normal' | 'warning' | 'critical' {
    switch (type) {
      case 'temperature':
        if (value < this.thresholds.temperature.min || value > this.thresholds.temperature.max) {
          return 'warning';
        }
        break;
      case 'humidity':
        if (value < this.thresholds.humidity.min || value > this.thresholds.humidity.max) {
          return 'warning';
        }
        break;
      case 'noise':
        if (value > this.thresholds.noise.max) {
          return value > 95 ? 'critical' : 'warning';
        }
        break;
      case 'air_quality':
        if (value > this.thresholds.airQuality.max) {
          return value > 200 ? 'critical' : 'warning';
        }
        break;
    }
    return 'normal';
  }

  /**
   * Gerar alerta
   */
  private generateAlert(device: IoTDevice, reading: SensorReading) {
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      deviceId: device.id,
      type: device.type as any,
      severity: reading.status === 'critical' ? 'critical' : 'high',
      message: this.generateAlertMessage(device, reading),
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    console.log(`🚨 ALERTA: ${alert.message}`);
  }

  /**
   * Gerar alerta de bateria baixa
   */
  private generateBatteryAlert(device: IoTDevice) {
    const alert: Alert = {
      id: `alert-battery-${Date.now()}`,
      deviceId: device.id,
      type: 'battery_low',
      severity: 'medium',
      message: `⚠️ Bateria baixa em ${device.name} (${device.battery}%)`,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
  }

  /**
   * Gerar mensagem de alerta
   */
  private generateAlertMessage(device: IoTDevice, reading: SensorReading): string {
    switch (device.type) {
      case 'temperature':
        return `🌡️ Temperatura fora do intervalo em ${device.name}: ${reading.value.toFixed(1)}${reading.unit}`;
      case 'humidity':
        return `💧 Umidade fora do intervalo em ${device.name}: ${reading.value.toFixed(1)}${reading.unit}`;
      case 'noise':
        return `🔊 Nível de ruído crítico em ${device.name}: ${reading.value.toFixed(1)}${reading.unit}`;
      case 'air_quality':
        return `💨 Qualidade do ar crítica em ${device.name}: ${reading.value.toFixed(1)}${reading.unit}`;
      case 'epc_condition':
        return `🛡️ Condição de EPC degradada em ${device.name}: ${reading.value.toFixed(1)}${reading.unit}`;
      default:
        return `⚠️ Alerta em ${device.name}`;
    }
  }

  /**
   * Obter dispositivos
   */
  getDevices(type?: string): IoTDevice[] {
    if (type) {
      return Array.from(this.devices.values()).filter(d => d.type === type);
    }
    return Array.from(this.devices.values());
  }

  /**
   * Obter leituras recentes
   */
  getRecentReadings(deviceId: string, limit: number = 100): SensorReading[] {
    return this.readings
      .filter(r => r.deviceId === deviceId)
      .slice(-limit);
  }

  /**
   * Obter alertas
   */
  getAlerts(acknowledged?: boolean): Alert[] {
    if (acknowledged === undefined) {
      return this.alerts;
    }
    return this.alerts.filter(a => a.acknowledged === acknowledged);
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
   * Obter estatísticas em tempo real
   */
  getRealTimeStats() {
    const stats = {
      devicesOnline: Array.from(this.devices.values()).filter(d => d.status === 'online').length,
      devicesOffline: Array.from(this.devices.values()).filter(d => d.status === 'offline').length,
      activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
      criticalAlerts: this.alerts.filter(a => !a.acknowledged && a.severity === 'critical').length,
      averageTemperature: this.calculateAverage('temperature'),
      averageHumidity: this.calculateAverage('humidity'),
      maxNoise: this.calculateMax('noise'),
      airQuality: this.getLatestReading('air_quality')?.value || 0,
    };

    return stats;
  }

  /**
   * Calcular média de leituras
   */
  private calculateAverage(type: string): number {
    const readings = this.readings.filter(r => {
      const device = this.devices.get(r.deviceId);
      return device?.type === type;
    });

    if (readings.length === 0) return 0;
    const sum = readings.reduce((acc, r) => acc + r.value, 0);
    return sum / readings.length;
  }

  /**
   * Calcular máximo de leituras
   */
  private calculateMax(type: string): number {
    const readings = this.readings.filter(r => {
      const device = this.devices.get(r.deviceId);
      return device?.type === type;
    });

    if (readings.length === 0) return 0;
    return Math.max(...readings.map(r => r.value));
  }

  /**
   * Obter última leitura
   */
  private getLatestReading(type: string): SensorReading | undefined {
    const readings = this.readings.filter(r => {
      const device = this.devices.get(r.deviceId);
      return device?.type === type;
    });

    return readings[readings.length - 1];
  }

  /**
   * Exportar dados para análise
   */
  exportData(startDate: Date, endDate: Date) {
    const data = this.readings.filter(r => 
      r.timestamp >= startDate && r.timestamp <= endDate
    );

    return {
      exportDate: new Date(),
      period: { startDate, endDate },
      totalReadings: data.length,
      data,
      summary: {
        devices: this.devices.size,
        alerts: this.alerts.length,
        averageTemperature: this.calculateAverage('temperature'),
        averageHumidity: this.calculateAverage('humidity'),
        maxNoise: this.calculateMax('noise'),
      },
    };
  }

  /**
   * Simular falha de dispositivo
   */
  simulateDeviceFailure(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = 'offline';
      const alert: Alert = {
        id: `alert-offline-${Date.now()}`,
        deviceId,
        type: 'device_offline',
        severity: 'high',
        message: `🔴 Dispositivo offline: ${device.name}`,
        timestamp: new Date(),
        acknowledged: false,
      };
      this.alerts.push(alert);
    }
  }

  /**
   * Restaurar dispositivo
   */
  restoreDevice(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = 'online';
      device.lastReading = new Date();
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const iotService = new IoTService();

export default iotService;
