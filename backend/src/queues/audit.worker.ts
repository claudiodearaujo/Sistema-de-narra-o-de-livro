/**
 * Audit Cleanup Worker
 * Purges old audit logs daily based on retention policy
 */
import { auditService } from '../services/audit.service';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the audit cleanup worker
 */
export function startAuditCleanupWorker(): void {
  if (cleanupInterval) {
    console.log('⚠️ Audit cleanup worker is already running');
    return;
  }

  console.log('🧹 Audit cleanup worker started (every 24 hours)');

  // Run cleanup immediately on start (with a small delay to avoid startup overload)
  setTimeout(() => {
    runCleanup();
  }, 30000); // 30 seconds delay

  // Schedule periodic cleanup
  cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
}

/**
 * Stop the audit cleanup worker
 */
export function stopAuditCleanupWorker(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Audit cleanup worker stopped');
  }
}

/**
 * Run the cleanup process
 */
async function runCleanup(): Promise<void> {
  const startTime = Date.now();
  console.log('[Maintenance] Starting daily audit log purge...');
  
  try {
    const deletedCount = await auditService.purgeByRetentionPolicy();
    
    const duration = Date.now() - startTime;
    console.log(`[Maintenance] Audit log purge completed. Removed ${deletedCount} logs in ${duration}ms`);
    
    // Log the maintenance action itself to the audit log (meta-audit)
    // We use a try-catch here to ensure even if logging fails, the process continues
    try {
      await auditService.log({
        action: 'SYSTEM_MAINTENANCE' as any,
        category: 'SYSTEM' as any,
        severity: 'LOW' as any,
        description: `Limpeza automática de logs concluída. Removidos: ${deletedCount}`,
        metadata: { deletedCount, duration, type: 'audit_purge' }
      });
    } catch (e) {
      console.error('[AUDIT] Failed to log maintenance action:', e);
    }

  } catch (error) {
    console.error('❌ Error in audit cleanup worker:', error);
  }
}

// Auto-start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startAuditCleanupWorker();
}
