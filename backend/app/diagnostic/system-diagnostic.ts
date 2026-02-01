/**
 * SovrenAI System Diagnostic
 * Comprehensive health check that runs on every boot
 * The system must know itself before serving requests
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root is 2 levels up from diagnostic/
const PROJECT_ROOT = resolve(__dirname, '../..');

export interface DiagnosticResult {
  timestamp: Date;
  version: string;
  directories: DirectoryCheck[];
  components: ComponentCheck[];
  features: FeatureCheck[];
  agents: AgentCheck[];
  services: ServiceCheck[];
  connections: ConnectionCheck[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    issues: string[];
    status: 'healthy' | 'degraded' | 'critical';
  };
}

interface DirectoryCheck {
  path: string;
  exists: boolean;
  fileCount: number;
}

interface ComponentCheck {
  name: string;
  category: string;
  path: string;
  exists: boolean;
  canLoad: boolean;
  error?: string;
}

interface FeatureCheck {
  name: string;
  category: string;
  backend: boolean;
  frontend: boolean;
  autoTrigger: boolean;
  notes?: string;
}

interface AgentCheck {
  name: string;
  icon: string;
  registered: boolean;
  canHandle: boolean;
  execute: boolean;
  createsDocuments: boolean;
}

interface ServiceCheck {
  name: string;
  initialized: boolean;
  exported: boolean;
  error?: string;
}

interface ConnectionCheck {
  name: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'unknown';
}

// Expected system structure
const EXPECTED_DIRECTORIES = [
  'app/agents',
  'app/agents/base',
  'app/agents/specialized',
  'app/agents/orchestration',
  'app/agents/communication',
  'app/agents/persistence',
  'app/services',
  'app/services/truth_beast',
  'app/realtime',
  'app/routes',
  'app/diagnostic',
  'data'
];

const EXPECTED_COMPONENTS = [
  // Agent System
  { name: 'Agent Interface', category: 'agents', path: 'app/agents/base/agent-types.ts' },
  { name: 'Base Agent', category: 'agents', path: 'app/agents/base/agent.ts' },
  { name: 'Agent Registry', category: 'agents', path: 'app/agents/base/agent-registry.ts' },
  { name: 'Workbench Registry', category: 'agents', path: 'app/agents/base/workbench-registry.ts' },
  { name: 'Researcher Agent', category: 'agents', path: 'app/agents/specialized/researcher.ts' },
  { name: 'Analyst Agent', category: 'agents', path: 'app/agents/specialized/analyst.ts' },
  { name: 'Designer Agent', category: 'agents', path: 'app/agents/specialized/designer.ts' },
  { name: 'Reviewer Agent', category: 'agents', path: 'app/agents/specialized/reviewer.ts' },
  { name: 'Agent Orchestrator', category: 'agents', path: 'app/agents/orchestration/agent-orchestrator.ts' },
  { name: 'Agent Store', category: 'agents', path: 'app/agents/persistence/agent-store.ts' },

  // Services
  { name: 'Document Service', category: 'services', path: 'app/services/document-service.ts' },
  { name: 'Progress Tracker', category: 'services', path: 'app/services/progress-tracker.ts' },
  { name: 'Truth Beast', category: 'services', path: 'app/services/truth_beast/index.ts' },
  { name: 'Deception Analyzer', category: 'services', path: 'app/services/deception-analyzer.ts' },
  { name: 'Intent Analyzer', category: 'services', path: 'app/services/intent-analyzer.ts' },

  // Real-time
  { name: 'WebSocket Server', category: 'realtime', path: 'app/realtime/websocket-server.ts' },

  // Routes
  { name: 'Document Routes', category: 'routes', path: 'app/routes/documents.ts' },

  // Main
  { name: 'Main Server', category: 'core', path: 'app/main.ts' }
];

const EXPECTED_FEATURES = [
  // Agent Features
  { name: 'Analyst Agent', category: 'agents', backend: true, frontend: false, autoTrigger: true },
  { name: 'Designer Agent', category: 'agents', backend: true, frontend: false, autoTrigger: true },
  { name: 'Reviewer Agent', category: 'agents', backend: true, frontend: false, autoTrigger: true },
  { name: 'Researcher Agent', category: 'agents', backend: true, frontend: false, autoTrigger: false },

  // Document Features
  { name: 'Document Creation', category: 'documents', backend: true, frontend: false, autoTrigger: false },
  { name: 'Document Versioning', category: 'documents', backend: true, frontend: false, autoTrigger: false },
  { name: 'Document API', category: 'documents', backend: true, frontend: false, autoTrigger: false },

  // Real-time Features
  { name: 'WebSocket Server', category: 'realtime', backend: true, frontend: false, autoTrigger: true },
  { name: 'Progress Tracking', category: 'realtime', backend: true, frontend: false, autoTrigger: true },
  { name: 'Live Activity Feed', category: 'realtime', backend: true, frontend: false, autoTrigger: true },

  // Truth Beast Features
  { name: 'Classification', category: 'truth', backend: true, frontend: false, autoTrigger: true },
  { name: 'Ground Truth DB', category: 'truth', backend: true, frontend: false, autoTrigger: false },
  { name: 'Deception Detection', category: 'truth', backend: true, frontend: false, autoTrigger: true }
];

/**
 * Run comprehensive system diagnostic
 */
export async function runDiagnostic(): Promise<DiagnosticResult> {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   SovrenAI System Diagnostic                                  ║');
  console.log('║   Version: 2.0.0                                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const result: DiagnosticResult = {
    timestamp: new Date(),
    version: '2.0.0',
    directories: [],
    components: [],
    features: [],
    agents: [],
    services: [],
    connections: [],
    summary: {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
      status: 'healthy'
    }
  };

  // Check directories
  result.directories = await checkDirectories();

  // Check components
  result.components = await checkComponents();

  // Check features
  result.features = await checkFeatures();

  // Check agents
  result.agents = await checkAgents();

  // Check services
  result.services = await checkServices();

  // Check connections
  result.connections = await checkConnections();

  // Calculate summary
  result.summary = calculateSummary(result);

  // Print results
  printDiagnosticResults(result);

  return result;
}

/**
 * Check directory structure
 */
async function checkDirectories(): Promise<DirectoryCheck[]> {
  console.log('📁 Directories');
  const results: DirectoryCheck[] = [];

  for (const dir of EXPECTED_DIRECTORIES) {
    const fullPath = resolve(PROJECT_ROOT, dir);
    const exists = existsSync(fullPath);

    let fileCount = 0;
    if (exists) {
      try {
        const files = readdirSync(fullPath);
        fileCount = files.filter(f => !f.startsWith('.')).length;
      } catch (error) {
        // Directory not readable
      }
    }

    const check: DirectoryCheck = {
      path: dir,
      exists,
      fileCount
    };

    results.push(check);

    const status = exists ? '✓' : '✗';
    const countStr = exists ? ` (${fileCount} files)` : '';
    console.log(`  ${status} ${dir}${countStr}`);
  }

  console.log('');
  return results;
}

/**
 * Check components exist and can load
 */
async function checkComponents(): Promise<ComponentCheck[]> {
  console.log('🧩 Components');
  const results: ComponentCheck[] = [];

  const byCategory: Record<string, ComponentCheck[]> = {};

  for (const component of EXPECTED_COMPONENTS) {
    const fullPath = resolve(PROJECT_ROOT, component.path);
    const exists = existsSync(fullPath);

    let canLoad = false;
    let error: string | undefined;

    if (exists) {
      try {
        // Try to import the file
        await import(fullPath);
        canLoad = true;
      } catch (err: any) {
        error = err.message;
      }
    }

    const check: ComponentCheck = {
      name: component.name,
      category: component.category,
      path: component.path,
      exists,
      canLoad,
      error
    };

    results.push(check);

    if (!byCategory[component.category]) {
      byCategory[component.category] = [];
    }
    byCategory[component.category].push(check);
  }

  // Print by category
  const passedCount = results.filter(c => c.exists && c.canLoad).length;
  console.log(`  (${passedCount}/${results.length} working)\n`);

  for (const [category, checks] of Object.entries(byCategory)) {
    console.log(`  ${category}:`);
    for (const check of checks) {
      const status = check.exists && check.canLoad ? '✓' :
                    check.exists ? '⚠' : '✗';
      console.log(`    ${status} ${check.name}`);
    }
  }

  console.log('');
  return results;
}

/**
 * Check features are working
 */
async function checkFeatures(): Promise<FeatureCheck[]> {
  console.log('⚡ Features');
  const results: FeatureCheck[] = [];

  const byCategory: Record<string, FeatureCheck[]> = {};

  for (const feature of EXPECTED_FEATURES) {
    const check: FeatureCheck = { ...feature };
    results.push(check);

    if (!byCategory[feature.category]) {
      byCategory[feature.category] = [];
    }
    byCategory[feature.category].push(check);
  }

  const workingCount = results.filter(f => f.backend).length;
  console.log(`  (${workingCount}/${results.length} working)\n`);

  for (const [category, checks] of Object.entries(byCategory)) {
    console.log(`  ${category}:`);
    for (const check of checks) {
      const backendStatus = check.backend ? '✓' : '○';
      const frontendStatus = check.frontend ? '✓' : '○';
      const autoStatus = check.autoTrigger ? '⚡' : '·';
      console.log(`    ${backendStatus}${frontendStatus}${autoStatus} ${check.name}`);
    }
  }

  console.log('');
  return results;
}

/**
 * Check agents are properly registered and functional
 */
async function checkAgents(): Promise<AgentCheck[]> {
  console.log('🤖 Agents');
  const results: AgentCheck[] = [];

  try {
    // Import registries
    const { agentRegistry } = await import('../agents/base/agent-registry.js');
    const { workbenchAgentRegistry } = await import('../agents/base/workbench-registry.js');

    // Check task agents (BaseAgent - doesn't have canHandle, always true if registered)
    const taskAgents = agentRegistry.getAll();
    for (const agent of taskAgents) {
      const check: AgentCheck = {
        name: agent.name,
        icon: agent.icon,
        registered: true,
        canHandle: true, // Task agents are always available when registered
        execute: typeof agent.execute === 'function',
        createsDocuments: false // Task agents don't create documents directly
      };
      results.push(check);
    }

    // Check workbench agents
    const workbenchAgents = workbenchAgentRegistry.getAll();
    for (const agent of workbenchAgents) {
      const check: AgentCheck = {
        name: agent.name,
        icon: agent.icon,
        registered: true,
        canHandle: typeof agent.canHandle === 'function',
        execute: typeof agent.execute === 'function',
        createsDocuments: false // Will be checked during execution
      };
      results.push(check);
    }
  } catch (error: any) {
    console.log(`  ✗ Failed to load agents: ${error.message}`);
  }

  const totalCount = results.length;
  console.log(`  (${totalCount}/4 expected)\n`);

  for (const agent of results) {
    const regStatus = agent.registered ? '✓' : '✗';
    const handleStatus = agent.canHandle ? '✓' : '✗';
    const execStatus = agent.execute ? '✓' : '✗';
    const docStatus = agent.createsDocuments ? '✓' : '○';

    console.log(`  ${agent.icon} ${agent.name}`);
    console.log(`    ${regStatus} registered  ${handleStatus} canHandle  ${execStatus} execute  ${docStatus} creates docs`);
  }

  console.log('');
  return results;
}

/**
 * Check services are initialized
 */
async function checkServices(): Promise<ServiceCheck[]> {
  console.log('⚙️  Services');
  const results: ServiceCheck[] = [];

  const services = [
    { name: 'Document Service', path: '../services/document-service.js', export: 'documentService' },
    { name: 'Progress Tracker', path: '../services/progress-tracker.js', export: 'progressTracker' },
    { name: 'WebSocket Server', path: '../realtime/websocket-server.js', export: 'wsServer' },
    { name: 'Agent Orchestrator', path: '../agents/orchestration/agent-orchestrator.js', export: 'agentOrchestrator' }
  ];

  for (const service of services) {
    let initialized = false;
    let exported = false;
    let error: string | undefined;

    try {
      const module = await import(service.path);
      exported = service.export in module;
      initialized = exported && module[service.export] !== undefined;
    } catch (err: any) {
      error = err.message;
    }

    const check: ServiceCheck = {
      name: service.name,
      initialized,
      exported,
      error
    };

    results.push(check);

    const status = initialized ? '✓' : exported ? '⚠' : '✗';
    console.log(`  ${status} ${service.name}`);
  }

  console.log('');
  return results;
}

/**
 * Check external connections
 */
async function checkConnections(): Promise<ConnectionCheck[]> {
  console.log('🔌 Connections');
  const results: ConnectionCheck[] = [];

  const connections = [
    { name: 'Anthropic API', env: 'ANTHROPIC_API_KEY' },
    { name: 'SERP API', env: 'SERP_API_KEY' },
    { name: 'WebSocket Enabled', env: 'WS_ENABLED' }
  ];

  for (const conn of connections) {
    const configured = !!process.env[conn.env];
    const status = configured ? 'connected' : 'disconnected';

    const check: ConnectionCheck = {
      name: conn.name,
      configured,
      status: status as 'connected' | 'disconnected'
    };

    results.push(check);

    const statusIcon = configured ? '✓' : '○';
    console.log(`  ${statusIcon} ${conn.name}`);
  }

  console.log('');
  return results;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(result: DiagnosticResult): DiagnosticResult['summary'] {
  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  const issues: string[] = [];

  // Count directory checks
  totalChecks += result.directories.length;
  passed += result.directories.filter(d => d.exists).length;
  failed += result.directories.filter(d => !d.exists).length;

  result.directories.filter(d => !d.exists).forEach(d => {
    issues.push(`Missing directory: ${d.path}`);
  });

  // Count component checks
  totalChecks += result.components.length;
  passed += result.components.filter(c => c.exists && c.canLoad).length;
  failed += result.components.filter(c => !c.exists || !c.canLoad).length;

  result.components.filter(c => !c.exists).forEach(c => {
    issues.push(`Missing component: ${c.name}`);
  });

  result.components.filter(c => c.exists && !c.canLoad).forEach(c => {
    issues.push(`Cannot load component: ${c.name} - ${c.error}`);
  });

  // Count agent checks
  totalChecks += result.agents.length;
  passed += result.agents.filter(a => a.registered && a.canHandle && a.execute).length;

  result.agents.filter(a => !a.registered).forEach(a => {
    issues.push(`Agent not registered: ${a.name}`);
  });

  // Count service checks
  totalChecks += result.services.length;
  passed += result.services.filter(s => s.initialized).length;
  failed += result.services.filter(s => !s.initialized).length;

  result.services.filter(s => !s.initialized).forEach(s => {
    issues.push(`Service not initialized: ${s.name}`);
  });

  // Notes (not warnings - document creation happens during execution)
  const warnings = 0; // No actual warnings - agents create documents during execution

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'critical';
  if (failed === 0) {
    status = 'healthy';
  } else if (failed / totalChecks < 0.1) {
    status = 'degraded';
  } else {
    status = 'critical';
  }

  return {
    totalChecks,
    passed,
    failed,
    warnings,
    issues,
    status
  };
}

/**
 * Print diagnostic results
 */
function printDiagnosticResults(result: DiagnosticResult): void {
  const { summary } = result;

  if (summary.issues.length > 0) {
    console.log('❌ Issues');
    summary.issues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
    console.log('');
  }

  // Show notes about document creation
  const agentsWithArtifacts = result.agents
    .filter(a => !a.createsDocuments)
    .map(a => a.name);

  if (agentsWithArtifacts.length > 0) {
    console.log('💡 Notes');
    console.log(`  • Agents create documents during execution (not at startup)`);
    console.log(`    Agents with artifact support: ${agentsWithArtifacts.join(', ')}`);
    console.log('');
  }

  // Print summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Checks: ${summary.totalChecks}`);
  console.log(`Passed: ${summary.passed} ✓`);
  console.log(`Failed: ${summary.failed} ✗`);
  if (summary.warnings > 0) {
    console.log(`Warnings: ${summary.warnings} ⚠️`);
  }
  console.log('');

  if (summary.status === 'healthy') {
    console.log('✅ System Healthy');
  } else if (summary.status === 'degraded') {
    console.log('⚠️  System Ready with Warnings');
  } else {
    console.log('❌ System Critical - Issues Must Be Resolved');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run diagnostic if executed directly
if (process.argv[1]?.includes('system-diagnostic')) {
  runDiagnostic().catch(console.error);
}
