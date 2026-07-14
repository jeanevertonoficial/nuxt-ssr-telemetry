<template>
  <div class="demo-wrapper">
    <header class="demo-header">
      <div class="logo-area">
        <span class="logo-icon">🧪</span>
        <h1>Nuxt SSR Telemetry</h1>
        <span class="badge">v0.1.7</span>
      </div>
      <p class="subtitle">
        Production-ready end-to-end trace correlation and structured Pino logging for Nuxt 3 applications.
      </p>
    </header>

    <main class="demo-grid">
      <!-- Left Panel: Actions & Settings -->
      <section class="panel-section card settings-panel">
        <h2 class="panel-title">
          Interactive Controller
        </h2>
        <p class="panel-desc">
          Simulate requests, pass correlation headers, and witness trace propagation.
        </p>

        <!-- Hydration Info -->
        <div class="info-block">
          <div class="info-label-row">
            <span class="info-label">Initial Hydrated Server Request ID</span>
            <span class="tag tag-ssr">SSR Hydrated</span>
          </div>
          <div class="request-id-badge">
            {{ initialRequestId || 'None (Client Only)' }}
          </div>
        </div>

        <div class="divider" />

        <!-- Simulation Options -->
        <div class="control-group">
          <label for="header-name-input">Request Header Name</label>
          <input
            id="header-name-input"
            v-model="headerName"
            type="text"
            placeholder="x-request-id"
            class="input-text"
          >
        </div>

        <div class="control-group">
          <label for="custom-id-input">Custom Correlation ID <span class="label-opt">(Optional)</span></label>
          <input
            id="custom-id-input"
            v-model="customIdValue"
            type="text"
            placeholder="Leave empty to auto-generate UUID"
            class="input-text"
          >
        </div>

        <!-- Action Button -->
        <button
          class="btn-trigger"
          :disabled="loading"
          @click="triggerFetch"
        >
          <span
            v-if="loading"
            class="spinner"
          />
          <span class="btn-text">{{ loading ? 'Correlating Trace...' : 'Trigger Correlation Request' }}</span>
        </button>

        <!-- Response Area -->
        <div
          v-if="responseData"
          class="response-viewer mt-4 fade-in"
        >
          <div class="viewer-header">
            <span>API Response Header (Correlated)</span>
            <span class="status-indicator success">200 OK</span>
          </div>
          <pre class="code-box"><code>{{ JSON.stringify(responseData, null, 2) }}</code></pre>
        </div>
      </section>

      <!-- Right Panel: Log Streams -->
      <section class="panel-section card logs-panel">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-title">
              Full-Stack Trace Logs
            </h2>
            <p class="panel-desc">
              Real-time log stream showing how frontend actions trace back to backend operations.
            </p>
          </div>
          <button
            class="btn-clear"
            @click="clearLogs"
          >
            Clear Logs
          </button>
        </div>

        <div class="log-stream">
          <div
            v-if="logEntries.length === 0"
            class="empty-state"
          >
            <p>No logs recorded. Trigger a request to view telemetry trace logs.</p>
          </div>
          <transition-group
            name="list"
            tag="div"
            class="log-list"
          >
            <div
              v-for="log in logEntries"
              :key="log.id"
              class="log-card"
              :class="[log.source, log.level]"
            >
              <div class="log-meta">
                <span class="log-timestamp">{{ log.timestamp }}</span>
                <span
                  class="log-badge"
                  :class="log.source"
                >{{ log.source.toUpperCase() }}</span>
                <span
                  class="log-badge"
                  :class="log.level"
                >{{ log.level.toUpperCase() }}</span>
                <span class="log-trace-id">ID: {{ log.requestId }}</span>
              </div>
              <div class="log-body">
                <p class="log-message">
                  {{ log.message }}
                </p>
                <pre
                  v-if="log.rawJson"
                  class="log-raw"
                ><code>{{ log.rawJson }}</code></pre>
              </div>
            </div>
          </transition-group>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const logger = useLogger()

// Configure headers
const headerName = ref('x-request-id')
const customIdValue = ref('')

// Last request state
const responseData = ref<{ success: boolean, id: string } | null>(null)
const loading = ref(false)

// Initial fetch from SSR
const { data: initialData } = await useFetch<{ success: boolean, id: string }>('/api/test')
const initialRequestId = initialData.value?.id || ''

// List of logs to display in the UI
interface LogEntry {
  id: string
  source: 'client' | 'server'
  level: 'info' | 'warn' | 'error' | 'debug'
  timestamp: string
  requestId: string
  message: string
  rawJson?: string // for pino log simulation
}

const logEntries = ref<LogEntry[]>([])

const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
  logEntries.value.unshift({
    ...entry,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString(),
  })
}

// On component mount, seed initial logs representing the SSR call
onMounted(() => {
  // 1. Log on client console
  logger.info('Vue component mounted (hydration complete)')

  // 2. Add simulated server logs for the SSR load to the UI
  addLog({
    source: 'server',
    level: 'info',
    requestId: initialRequestId,
    message: 'Rendering SSR page for /',
    rawJson: `{"level":30,"time":${Date.now()},"requestId":"${initialRequestId}","msg":"Rendering SSR page for /"}`,
  })
  addLog({
    source: 'server',
    level: 'info',
    requestId: initialRequestId,
    message: 'Fetching initial telemetry data from DB',
    rawJson: `{"level":30,"time":${Date.now() - 5},"requestId":"${initialRequestId}","msg":"Fetching initial telemetry data from DB"}`,
  })

  // 3. Add client log
  addLog({
    source: 'client',
    level: 'info',
    requestId: initialRequestId,
    message: 'Vue component mounted (hydration complete)',
  })
})

const triggerFetch = async () => {
  loading.value = true
  responseData.value = null

  // Generate or get the request ID to send
  const reqIdToSend = customIdValue.value.trim() || Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15)

  // Log request start on client
  logger.info(`Initiating fetch to /api/test with ID: ${reqIdToSend}`)
  addLog({
    source: 'client',
    level: 'info',
    requestId: reqIdToSend,
    message: `Initiating fetch to /api/test`,
  })

  try {
    const headers: Record<string, string> = {}
    if (headerName.value) {
      headers[headerName.value] = reqIdToSend
    }

    const res = await $fetch<{ success: boolean, id: string }>('/api/test', { headers })
    responseData.value = res

    // Log success on client
    logger.info(`Received API response with correlated ID: ${res.id}`)

    // Add server log (simulating the Pino log from the server)
    addLog({
      source: 'server',
      level: 'info',
      requestId: res.id,
      message: 'API route hit!',
      rawJson: `{"level":30,"time":${Date.now()},"requestId":"${res.id}","msg":"API route hit!"}`,
    })

    // Add client log
    addLog({
      source: 'client',
      level: 'info',
      requestId: res.id,
      message: `API Response: success = ${res.success}`,
    })
  }
  catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logger.error(`API Fetch failed: ${errorMsg}`)
    addLog({
      source: 'client',
      level: 'error',
      requestId: reqIdToSend,
      message: `API Fetch failed: ${errorMsg}`,
    })
  }
  finally {
    loading.value = false
  }
}

const clearLogs = () => {
  logEntries.value = []
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

:root {
  --bg-color: #0b0f19;
  --card-bg: rgba(22, 29, 48, 0.7);
  --border-color: rgba(255, 255, 255, 0.08);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --color-green: #00dc82;
  --color-blue: #00e5ff;
  --color-red: #ff3366;
  --font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: var(--font-sans);
  background-image:
    radial-gradient(circle at 10% 20%, rgba(0, 220, 130, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(0, 229, 255, 0.05) 0%, transparent 40%);
  background-attachment: fixed;
  min-height: 100vh;
}

.demo-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 2.5rem;
}

.demo-header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--color-green) 0%, var(--color-blue) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  background: rgba(0, 220, 130, 0.15);
  color: var(--color-green);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 500;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 30px;
}

@media (max-width: 900px) {
  .demo-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
}

.panel-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  width: max-content;
}

.panel-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

/* Info block styling */
.info-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  flex-wrap: wrap;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  font-weight: 600;
}

.request-id-badge {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-blue);
  word-break: break-all;
  user-select: all;
  background: rgba(0, 229, 255, 0.08);
  padding: 8px 12px;
  border-radius: 6px;
  display: block;
  box-sizing: border-box;
  width: 100%;
}

.tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.tag-ssr {
  background: rgba(0, 220, 130, 0.15);
  color: var(--color-green);
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 24px 0;
}

/* Form controls */
.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.label-opt {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.input-text {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.input-text:focus {
  outline: none;
  border-color: var(--color-blue);
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.15);
}

/* Trigger Button */
.btn-trigger {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--color-green) 0%, #00b368 100%);
  color: #0b0f19;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  margin-top: 10px;
}

.btn-trigger:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.3);
}

.btn-trigger:active {
  transform: translateY(0);
}

.btn-trigger:disabled {
  background: var(--text-secondary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Response Viewer */
.response-viewer {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.viewer-header {
  background: rgba(255, 255, 255, 0.02);
  padding: 10px 16px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.status-indicator.success {
  color: var(--color-green);
  font-weight: 600;
}

.code-box {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-size: 0.85rem;
  color: #a7f3d0;
}

/* Clear Button */
.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.btn-clear {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

/* Log stream visualizer */
.log-stream {
  min-height: 400px;
  max-height: 520px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: center;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-card {
  background: rgba(255, 255, 255, 0.02);
  border-left: 4px solid var(--text-secondary);
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.log-card.client {
  border-color: var(--color-blue);
  background: rgba(0, 229, 255, 0.02);
}

.log-card.server {
  border-color: var(--color-green);
  background: rgba(0, 220, 130, 0.02);
}

.log-card.error {
  border-color: var(--color-red);
  background: rgba(255, 51, 102, 0.02);
}

.log-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.log-timestamp {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.log-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.log-badge.client {
  background: rgba(0, 229, 255, 0.15);
  color: var(--color-blue);
}

.log-badge.server {
  background: rgba(0, 220, 130, 0.15);
  color: var(--color-green);
}

.log-badge.info {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.log-badge.error {
  background: rgba(255, 51, 102, 0.15);
  color: var(--color-red);
}

.log-trace-id {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-blue);
  margin-left: auto;
}

.log-message {
  margin: 0;
  line-height: 1.4;
  color: var(--text-primary);
}

.log-raw {
  margin: 8px 0 0 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  font-size: 0.75rem;
  color: #cbd5e1;
  overflow-x: auto;
  border: 1px solid var(--border-color);
}

/* Animations & Spacers */
.mt-4 { margin-top: 16px; }

.fade-in {
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(11, 15, 25, 0.3);
  border-top-color: #0b0f19;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
