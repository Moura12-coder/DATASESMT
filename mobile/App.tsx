/**
 * DataSESMT Pro - Mobile App (React Native)
 * iOS/Android - Acesso em Campo
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ============================================================================
// SCREENS
// ============================================================================

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dashboard Screen
function DashboardScreen() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Simular carregamento de KPIs
      const data = {
        accidents: 5,
        trainings: 45,
        compliance: 92,
        incidents: 2,
      };
      setKpis(data);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard Executivo</Text>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <KPICard
          title="Acidentes"
          value={kpis?.accidents || 0}
          color="#ff6b6b"
        />
        <KPICard
          title="Treinamentos"
          value={kpis?.trainings || 0}
          color="#4ecdc4"
        />
        <KPICard
          title="Conformidade"
          value={`${kpis?.compliance || 0}%`}
          color="#45b7d1"
        />
        <KPICard
          title="Incidentes"
          value={kpis?.incidents || 0}
          color="#ffa502"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📋 Registrar Incidente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>✓ Completar Treinamento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🔍 Inspeção de Campo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Incidents Screen
function IncidentsScreen() {
  const [incidents, setIncidents] = useState([]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Incidentes</Text>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>+ Novo Incidente</Text>
      </TouchableOpacity>

      {incidents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nenhum incidente registrado</Text>
        </View>
      ) : (
        incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))
      )}
    </ScrollView>
  );
}

// Inspections Screen
function InspectionsScreen() {
  const [inspections, setInspections] = useState([]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inspeções</Text>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>+ Nova Inspeção</Text>
      </TouchableOpacity>

      <View style={styles.inspectionList}>
        <InspectionCard
          title="Inspeção - Setor A"
          date="17/05/2026"
          status="Pendente"
        />
        <InspectionCard
          title="Inspeção - Setor B"
          date="16/05/2026"
          status="Concluída"
        />
      </View>
    </ScrollView>
  );
}

// Documents Screen
function DocumentsScreen() {
  const [documents, setDocuments] = useState([]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Documentos</Text>

      <View style={styles.documentList}>
        <DocumentCard title="ASO - Exame Admissional" date="15/05/2026" />
        <DocumentCard title="Certificado NR-10" date="10/05/2026" />
        <DocumentCard title="Contrato de Trabalho" date="01/01/2026" />
      </View>
    </ScrollView>
  );
}

// Settings Screen
function SettingsScreen() {
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Modo Offline</Text>
        <TouchableOpacity
          style={[
            styles.toggle,
            offlineMode && styles.toggleActive,
          ]}
          onPress={() => setOfflineMode(!offlineMode)}
        >
          <Text style={styles.toggleText}>{offlineMode ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Sincronizar Dados</Text>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Sincronizar Agora</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Versão</Text>
        <Text style={styles.settingValue}>4.0.0</Text>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function KPICard({ title, value, color }) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
    </View>
  );
}

function IncidentCard({ incident }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{incident.title}</Text>
      <Text style={styles.cardText}>Data: {incident.date}</Text>
      <Text style={[styles.cardText, { color: '#ff6b6b' }]}>
        Status: {incident.status}
      </Text>
    </View>
  );
}

function InspectionCard({ title, date, status }) {
  const statusColor = status === 'Concluída' ? '#4ecdc4' : '#ffa502';

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>Data: {date}</Text>
      <Text style={[styles.cardText, { color: statusColor }]}>
        Status: {status}
      </Text>
    </View>
  );
}

function DocumentCard({ title, date }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>Data: {date}</Text>
      <TouchableOpacity style={styles.downloadButton}>
        <Text style={styles.downloadButtonText}>Baixar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentsScreen}
        options={{
          title: 'Incidentes',
          tabBarLabel: 'Incidentes',
        }}
      />
      <Tab.Screen
        name="Inspections"
        component={InspectionsScreen}
        options={{
          title: 'Inspeções',
          tabBarLabel: 'Inspeções',
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: 'Documentos',
          tabBarLabel: 'Documentos',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          tabBarLabel: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiTitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
  inspectionList: {
    marginTop: 12,
  },
  documentList: {
    marginTop: 12,
  },
  settingItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#4ecdc4',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
