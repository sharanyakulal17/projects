/**
 * NEBULA CORE / AURA-HEAL Central API Client & Configuration
 * Provides centralized endpoint mappings and error-handled fetch wrappers.
 */

// Central API Base URL Configuration (Supports local dev & AWS deployment)
const API_BASE_URL = typeof window !== 'undefined' && window.location.origin
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:5001'
      : `${window.location.protocol}//${window.location.hostname}:5001`)
  : 'http://127.0.0.1:5001';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/v1/health`,
  METRICS_CURRENT: `${API_BASE_URL}/api/v1/metrics/current`,
  SYSTEM_STATUS: `${API_BASE_URL}/api/v1/system/status`,
  DASHBOARD_OVERVIEW: `${API_BASE_URL}/api/v1/dashboard/overview`,
  AI_DIAGNOSIS: `${API_BASE_URL}/api/v1/ai/diagnosis`,
  AI_ANALYZE: `${API_BASE_URL}/api/v1/ai/analyze`,
  AI_CHAT: `${API_BASE_URL}/api/v1/ai/chat`,
  PREDICT: `${API_BASE_URL}/api/v1/predict`,
  HEAL: `${API_BASE_URL}/api/v1/heal`,
  HEALING_STATUS: `${API_BASE_URL}/api/v1/healing/status`,
  INSTANCES: `${API_BASE_URL}/api/v1/instances`,
  LOGS: `${API_BASE_URL}/api/v1/logs`,
  INJECT: `${API_BASE_URL}/api/v1/inject`,
  TRAFFIC: `${API_BASE_URL}/api/v1/traffic`,
  TRAFFIC_PREDICT: `${API_BASE_URL}/api/v1/traffic/predict`,
  TRAFFIC_WHAT_IF: `${API_BASE_URL}/api/v1/traffic/what-if`,
  BENCHMARKS: `${API_BASE_URL}/api/v1/benchmarks`,
  INCIDENTS: `${API_BASE_URL}/api/v1/incidents`
};

/**
 * Universal safe API fetch wrapper with timeout & error handling
 */
export async function fetchApi(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        message: errorPayload.message || errorPayload.error || `HTTP Error ${response.status}`
      };
    }

    const data = await response.json();
    return { success: true, status: response.status, data };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, status: 408, message: 'API request timed out (8s limit).' };
    }
    return {
      success: false,
      status: 0,
      message: 'Backend server unreachable at http://127.0.0.1:5001. Please check if Flask server is running.'
    };
  }
}

/**
 * High-level API Service Functions
 */
export const NebulaAPI = {
  // System Health
  getHealth: () => fetchApi(API_ENDPOINTS.HEALTH),

  // Metrics & Status
  getCurrentMetrics: () => fetchApi(API_ENDPOINTS.METRICS_CURRENT),
  getSystemStatus: () => fetchApi(API_ENDPOINTS.SYSTEM_STATUS),
  getDashboardOverview: () => fetchApi(API_ENDPOINTS.DASHBOARD_OVERVIEW),

  // AI Operations
  getAiDiagnosis: () => fetchApi(API_ENDPOINTS.AI_DIAGNOSIS),
  analyzeMetricsWithAi: (metrics, isAnomaly = false) => 
    fetchApi(API_ENDPOINTS.AI_ANALYZE, {
      method: 'POST',
      body: JSON.stringify({ metrics, is_anomaly: isAnomaly })
    }),
  sendCopilotMessage: (message) => 
    fetchApi(API_ENDPOINTS.AI_CHAT, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  // ML & Healing
  predictAnomaly: (metrics) => 
    fetchApi(API_ENDPOINTS.PREDICT, {
      method: 'POST',
      body: JSON.stringify(metrics)
    }),
  executeSelfHealing: (statusLabel = 'Anomaly') => 
    fetchApi(API_ENDPOINTS.HEAL, {
      method: 'POST',
      body: JSON.stringify({ status: statusLabel })
    }),
  getHealingStatus: () => fetchApi(API_ENDPOINTS.HEALING_STATUS),

  // Instances & Logs
  getInstances: () => fetchApi(API_ENDPOINTS.INSTANCES),
  healInstance: (vmId) => 
    fetchApi(`${API_ENDPOINTS.INSTANCES}/${vmId}/heal`, { method: 'POST' }),
  getLogs: () => fetchApi(API_ENDPOINTS.LOGS),

  // Fault Injection & Simulation
  injectFault: (faultType) => 
    fetchApi(API_ENDPOINTS.INJECT, {
      method: 'POST',
      body: JSON.stringify({ type: faultType })
    }),
  setTraffic: (requestsPerMin) => 
    fetchApi(API_ENDPOINTS.TRAFFIC, {
      method: 'POST',
      body: JSON.stringify({ traffic: requestsPerMin })
    }),
  simulateWhatIf: (increasePercent) => 
    fetchApi(API_ENDPOINTS.TRAFFIC_WHAT_IF, {
      method: 'POST',
      body: JSON.stringify({ increase_percent: increasePercent })
    }),

  // Benchmarks & Incidents
  getBenchmarks: () => fetchApi(API_ENDPOINTS.BENCHMARKS),
  getIncidents: () => fetchApi(API_ENDPOINTS.INCIDENTS)
};
