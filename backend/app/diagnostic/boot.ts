/**
 * Boot Wrapper
 * Runs system diagnostic before starting the server
 * The system must know itself before serving requests
 */

import { runDiagnostic } from './system-diagnostic.js';
import type { DiagnosticResult } from './system-diagnostic.js';

// Store last diagnostic result
let lastDiagnostic: DiagnosticResult | null = null;

/**
 * Get last diagnostic result (for API endpoint)
 */
export function getLastDiagnostic(): DiagnosticResult | null {
  return lastDiagnostic;
}

/**
 * Boot sequence: Diagnostic → Start Server
 */
async function boot(): Promise<void> {
  console.log('🚀 SovrenAI Boot Sequence Starting...\n');

  try {
    // Run system diagnostic
    console.log('Step 1/2: Running system diagnostic...\n');
    lastDiagnostic = await runDiagnostic();

    // Check if system is healthy enough to start
    if (lastDiagnostic.summary.status === 'critical') {
      console.error('❌ System is in CRITICAL state. Please resolve issues before starting.');
      console.error('Issues found:');
      lastDiagnostic.summary.issues.forEach(issue => {
        console.error(`  • ${issue}`);
      });
      process.exit(1);
    }

    if (lastDiagnostic.summary.status === 'degraded') {
      console.warn('⚠️  System has warnings but will start anyway.');
      console.warn('Consider resolving warnings for optimal performance.\n');
    }

    // Import and start server
    console.log('Step 2/2: Starting HTTP and WebSocket servers...\n');

    // Dynamic import to avoid circular dependencies
    const { startServer } = await import('../main.js');
    await startServer();

    console.log('✅ Boot sequence complete!\n');
  } catch (error: any) {
    console.error('❌ Boot sequence failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Start boot sequence if this file is executed directly
if (process.argv[1]?.includes('boot')) {
  boot().catch(error => {
    console.error('Fatal error during boot:', error);
    process.exit(1);
  });
}

export { boot };
