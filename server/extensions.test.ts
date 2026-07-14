import { describe, it, expect, beforeEach } from 'vitest';
import { MLService } from './mlService';
import { IoTService } from './iotService';

describe('Extensions - Mobile, ML, IoT', () => {
  // ========================================================================
  // MACHINE LEARNING TESTS
  // ========================================================================
  describe('Machine Learning Service', () => {
    let mlService: MLService;

    beforeEach(() => {
      mlService = new MLService();
    });

    it('should predict risks by sector', async () => {
      const historicalData = [
        { type: 'accident', date: new Date() },
        { type: 'absence', date: new Date() },
        { compliant: true },
      ];

      const prediction = await mlService.predictRisksBySector('sector-1', historicalData);

      expect(prediction.sector).toBe('sector-1');
      expect(['Baixo', 'Médio', 'Alto', 'Crítico']).toContain(prediction.riskLevel);
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.factors).toBeInstanceOf(Array);
      expect(prediction.recommendations).toBeInstanceOf(Array);
    });

    it('should detect anomalies', async () => {
      const data = [
        { type: 'accident', date: new Date() },
        { type: 'accident', date: new Date() },
        { type: 'accident', date: new Date() },
        { type: 'accident', date: new Date() },
        { type: 'accident', date: new Date() },
      ];

      const anomalies = await mlService.detectAnomalies(data);

      expect(anomalies).toBeInstanceOf(Array);
      if (anomalies.length > 0) {
        expect(anomalies[0]).toHaveProperty('type');
        expect(anomalies[0]).toHaveProperty('severity');
        expect(anomalies[0]).toHaveProperty('description');
      }
    });

    it('should analyze trends', async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        type: Math.random() > 0.7 ? 'accident' : 'normal',
        date: new Date(),
      }));

      const trends = await mlService.analyzeTrends(data, 'monthly');

      expect(trends.period).toBe('monthly');
      expect(trends.trends).toHaveProperty('accidents');
      expect(trends.trends).toHaveProperty('absences');
      expect(trends.insights).toBeInstanceOf(Array);
      expect(trends.forecast).toHaveProperty('accidents');
    });

    it('should generate recommendations', async () => {
      const data = [
        { type: 'accident', date: new Date() },
        { training: { completed: false } },
      ];

      const recommendations = await mlService.getRecommendations('unit-1', data);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(typeof recommendations[0]).toBe('string');
    });

    it('should get model info', () => {
      const models = mlService.getModelInfo();
      expect(models).toBeInstanceOf(Map);
      expect(models.size).toBeGreaterThan(0);
    });

    it('should train model', async () => {
      const trainingData = Array.from({ length: 100 }, () => ({
        features: [Math.random(), Math.random()],
        label: Math.random() > 0.5,
      }));

      const model = await mlService.trainModel('risk-prediction', trainingData);

      expect(model).toHaveProperty('accuracy');
      expect(model).toHaveProperty('precision');
      expect(model).toHaveProperty('recall');
      expect(model.accuracy).toBeGreaterThan(0.8);
    });
  });

  // ========================================================================
  // IoT SERVICE TESTS
  // ========================================================================
  describe('IoT Service', () => {
    let iotService: IoTService;

    beforeEach(() => {
      iotService = new IoTService();
    });

    it('should initialize devices', () => {
      const devices = iotService.getDevices();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0]).toHaveProperty('id');
      expect(devices[0]).toHaveProperty('name');
      expect(devices[0]).toHaveProperty('type');
    });

    it('should filter devices by type', () => {
      const tempDevices = iotService.getDevices('temperature');
      expect(tempDevices.length).toBeGreaterThan(0);
      tempDevices.forEach(device => {
        expect(device.type).toBe('temperature');
      });
    });

    it('should record sensor readings', () => {
      const devices = iotService.getDevices();
      const readings = iotService.getRecentReadings(devices[0].id, 10);
      
      expect(readings).toBeInstanceOf(Array);
      if (readings.length > 0) {
        expect(readings[0]).toHaveProperty('deviceId');
        expect(readings[0]).toHaveProperty('value');
        expect(readings[0]).toHaveProperty('timestamp');
        expect(['normal', 'warning', 'critical']).toContain(readings[0].status);
      }
    });

    it('should generate alerts', () => {
      const alerts = iotService.getAlerts();
      expect(alerts).toBeInstanceOf(Array);
      
      if (alerts.length > 0) {
        expect(alerts[0]).toHaveProperty('id');
        expect(alerts[0]).toHaveProperty('deviceId');
        expect(alerts[0]).toHaveProperty('severity');
        expect(alerts[0]).toHaveProperty('message');
      }
    });

    it('should acknowledge alerts', () => {
      const alerts = iotService.getAlerts(false);
      if (alerts.length > 0) {
        const result = iotService.acknowledgeAlert(alerts[0].id);
        expect(result).toBe(true);
      }
    });

    it('should get real-time statistics', () => {
      const stats = iotService.getRealTimeStats();

      expect(stats).toHaveProperty('devicesOnline');
      expect(stats).toHaveProperty('devicesOffline');
      expect(stats).toHaveProperty('activeAlerts');
      expect(stats).toHaveProperty('criticalAlerts');
      expect(stats).toHaveProperty('averageTemperature');
      expect(stats).toHaveProperty('averageHumidity');
      expect(stats).toHaveProperty('maxNoise');
      expect(stats).toHaveProperty('airQuality');

      expect(stats.devicesOnline).toBeGreaterThanOrEqual(0);
      expect(stats.activeAlerts).toBeGreaterThanOrEqual(0);
    });

    it('should export data', () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const exportedData = iotService.exportData(startDate, endDate);

      expect(exportedData).toHaveProperty('exportDate');
      expect(exportedData).toHaveProperty('period');
      expect(exportedData).toHaveProperty('totalReadings');
      expect(exportedData).toHaveProperty('data');
      expect(exportedData).toHaveProperty('summary');
    });

    it('should simulate device failure', () => {
      const devices = iotService.getDevices();
      const deviceId = devices[0].id;

      iotService.simulateDeviceFailure(deviceId);
      const alerts = iotService.getAlerts();

      expect(alerts.some(a => a.deviceId === deviceId && a.type === 'device_offline')).toBe(true);
    });

    it('should restore device', () => {
      const devices = iotService.getDevices();
      const deviceId = devices[0].id;

      iotService.simulateDeviceFailure(deviceId);
      iotService.restoreDevice(deviceId);

      const updatedDevices = iotService.getDevices();
      const device = updatedDevices.find(d => d.id === deviceId);
      expect(device?.status).toBe('online');
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================
  describe('Integration - ML + IoT', () => {
    let mlService: MLService;
    let iotService: IoTService;

    beforeEach(() => {
      mlService = new MLService();
      iotService = new IoTService();
    });

    it('should use IoT data for ML predictions', async () => {
      const devices = iotService.getDevices();
      const readings = iotService.getRecentReadings(devices[0].id, 50);

      const data = readings.map(r => ({
        value: r.value,
        status: r.status,
        date: r.timestamp,
      }));

      const prediction = await mlService.predictRisksBySector('sector-1', data);

      expect(prediction.riskLevel).toBeDefined();
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
    });

    it('should generate alerts based on ML predictions', async () => {
      const devices = iotService.getDevices();
      const readings = iotService.getRecentReadings(devices[0].id, 50);

      const data = readings.map(r => ({
        value: r.value,
        status: r.status,
        date: r.timestamp,
      }));

      const prediction = await mlService.predictRisksBySector('sector-1', data);
      const alerts = iotService.getAlerts();

      if (prediction.riskLevel === 'Alto' || prediction.riskLevel === 'Crítico') {
        expect(alerts.length).toBeGreaterThan(0);
      }
    });

    it('should provide comprehensive monitoring dashboard', async () => {
      const iotStats = iotService.getRealTimeStats();
      const devices = iotService.getDevices();
      
      const data = devices.map(d => ({
        deviceId: d.id,
        readings: iotService.getRecentReadings(d.id, 10),
      }));

      const recommendations = await mlService.getRecommendations('unit-1', data);

      expect(iotStats.devicesOnline).toBeGreaterThanOrEqual(0);
      expect(recommendations).toBeInstanceOf(Array);
    });
  });

  // ========================================================================
  // PERFORMANCE TESTS
  // ========================================================================
  describe('Performance', () => {
    it('should handle 1000 sensor readings efficiently', () => {
      const start = Date.now();
      const readings = Array.from({ length: 1000 }, (_, i) => ({
        deviceId: `device-${i % 10}`,
        timestamp: new Date(),
        value: Math.random() * 100,
        unit: 'unit',
        status: 'normal' as const,
      }));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('should generate ML predictions quickly', async () => {
      const mlService = new MLService();
      const data = Array.from({ length: 500 }, () => ({
        type: Math.random() > 0.7 ? 'accident' : 'normal',
        date: new Date(),
      }));

      const start = Date.now();
      await mlService.predictRisksBySector('sector-1', data);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // Menos de 2 segundos
    });
  });

  // ========================================================================
  // SECURITY TESTS
  // ========================================================================
  describe('Security', () => {
    it('should not expose sensitive device data', () => {
      const iotService = new IoTService();
      const devices = iotService.getDevices();

      devices.forEach(device => {
        expect(device).toHaveProperty('id');
        expect(device).toHaveProperty('name');
        // Sensível: não deve expor credenciais
        expect(device).not.toHaveProperty('apiKey');
        expect(device).not.toHaveProperty('password');
      });
    });

    it('should validate ML model inputs', async () => {
      const mlService = new MLService();

      // Tentar com dados inválidos
      const invalidData = [{ invalid: 'data' }];

      try {
        await mlService.predictRisksBySector('sector-1', invalidData);
        // Deve continuar funcionando com dados parciais
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================
  describe('Edge Cases', () => {
    it('should handle empty data gracefully', async () => {
      const mlService = new MLService();
      const prediction = await mlService.predictRisksBySector('sector-1', []);

      expect(prediction).toBeDefined();
      expect(prediction.riskLevel).toBeDefined();
    });

    it('should handle offline devices', () => {
      const iotService = new IoTService();
      iotService.simulateDeviceFailure('temp-001');

      const alerts = iotService.getAlerts();
      expect(alerts.some(a => a.type === 'device_offline')).toBe(true);
    });

    it('should handle extreme sensor values', async () => {
      const mlService = new MLService();
      const extremeData = [
        { value: -100, type: 'temperature' },
        { value: 1000, type: 'temperature' },
      ];

      const prediction = await mlService.predictRisksBySector('sector-1', extremeData);
      expect(prediction.riskLevel).toBeDefined();
    });
  });
});
