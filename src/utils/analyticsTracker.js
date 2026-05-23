/**
 * Analytics Tracker — Client-side feature usage, error tracking & crash detection
 * Sends data to backend APIs for admin dashboard
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const EVENT_QUEUE = [];
const FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes
let flushTimer = null;

// ─── Feature Usage Tracking ───
export function trackEvent(action, target = '', meta = {}) {
  EVENT_QUEUE.push({
    action,
    target,
    timestamp: new Date().toISOString(),
    session_id: SESSION_ID,
    ...meta,
  });

  // Auto-flush if queue gets large
  if (EVENT_QUEUE.length >= 20) {
    flushEvents();
  }
}

async function flushEvents() {
  if (EVENT_QUEUE.length === 0) return;
  const events = EVENT_QUEUE.splice(0, EVENT_QUEUE.length);
  try {
    await fetch(`${API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
  } catch (e) {
    // Put events back if flush fails
    EVENT_QUEUE.unshift(...events);
  }
}

// ─── Error Tracking ───
export function trackError(errorMessage, stackTrace = '', extra = {}) {
  try {
    fetch(`${API_URL}/api/analytics/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error_message: errorMessage,
        stack_trace: stackTrace,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        session_id: SESSION_ID,
        ...extra,
      }),
    }).catch(() => {});
  } catch (e) {
    // Silent fail — don't cause more errors
  }
}

// ─── Report to Developer ───
export async function sendDeveloperReport(type, description, extra = {}) {
  try {
    const res = await fetch(`${API_URL}/api/developer-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        description,
        device_info: {
          screen: `${screen.width}x${screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          pixelRatio: window.devicePixelRatio,
          platform: navigator.platform,
          language: navigator.language,
          online: navigator.onLine,
          memory: navigator.deviceMemory || 'unknown',
        },
        browser_info: navigator.userAgent,
        timestamp: new Date().toISOString(),
        session_id: SESSION_ID,
        ...extra,
      }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ─── Content Report (Reel/Clip) ───
export async function sendContentReport(reelId, reportType, reason, details = '') {
  try {
    const res = await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reel_id: reelId,
        report_type: reportType,
        reason,
        details,
        reporter_device: navigator.userAgent,
        reporter_url: window.location.href,
        timestamp: new Date().toISOString(),
        session_id: SESSION_ID,
      }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ─── Initialize Global Tracking ───
export function initAnalytics() {
  // Global JS error handler
  window.addEventListener('error', (event) => {
    trackError(
      event.message || 'Unknown error',
      event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
    );
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    trackError(
      reason?.message || String(reason) || 'Unhandled Promise Rejection',
      reason?.stack || '',
    );
  });

  // Crash detection: flush events before page unloads
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });

  // Periodic flush
  flushTimer = setInterval(flushEvents, FLUSH_INTERVAL);

  // Track page load
  trackEvent('page_load', window.location.pathname);

  console.log('[Analytics] Tracker initialized, session:', SESSION_ID);
}

// ─── Cleanup ───
export function destroyAnalytics() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flushEvents();
}
