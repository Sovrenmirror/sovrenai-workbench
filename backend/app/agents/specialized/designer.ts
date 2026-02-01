/**
 * Designer Agent
 * Specialized agent for visual creation, diagrams, and charts
 */

import type { Agent, AgentContext, AgentResult, Artifact } from '../base/agent-types.js';
import type { ClassificationResult } from '../../services/truth_beast/index.js';

export class DesignerAgent implements Agent {
  name = 'Designer';
  icon = '🎨';

  canHandle(context: AgentContext): boolean {
    const { classificationResult } = context;

    // Trigger on visual/diagram requests
    const designTriggers = [
      'diagram', 'visual', 'chart', 'flow', 'image', 'design',
      'layout', 'wireframe', 'mockup', 'illustration', 'graph',
      'timeline', 'roadmap', 'architecture', 'schema', 'map',
      'flowchart', 'sequence', 'tree', 'hierarchy', 'structure'
    ];

    const tokens = classificationResult.tokens_matched || [];
    const hasDesignTrigger = tokens.some((t: any) =>
      designTriggers.includes(t.symbol?.toLowerCase() || '')
    );

    const reasoning = classificationResult.reasoning || '';
    const hasDesignIntent =
      reasoning.includes('visual') ||
      reasoning.includes('diagram') ||
      reasoning.includes('chart') ||
      reasoning.includes('design');

    return hasDesignTrigger || hasDesignIntent;
  }

  async execute(context: AgentContext, input: any): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // 1. Determine visual type needed
      const visualType = this.determineVisualType(context.classificationResult, input);

      // 2. Extract data/structure for visualization
      const visualData = this.extractVisualData(context, input);

      // 3. Generate visual specification
      const visual = await this.generateVisual(visualType, visualData, context);

      // Create artifact
      const artifacts: Artifact[] = [{
        type: 'diagram',
        title: `${visualType} - ${visualData.title || 'Diagram'}`,
        content: visual.content,
        format: visual.format,
        createdBy: this.name,
        metadata: {
          visualType,
          nodeCount: visualData.nodes?.length || 0,
          generated: new Date().toISOString()
        }
      }];

      return {
        success: true,
        output: {
          visual,
          type: visualType,
          format: visual.format
        },
        trace: {
          step: 'designer',
          agent: this.name,
          icon: this.icon,
          duration: Date.now() - startTime,
          details: `Created ${visualType} visualization`
        },
        artifacts
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        trace: {
          step: 'designer',
          agent: this.name,
          icon: this.icon,
          duration: Date.now() - startTime,
          details: '',
          error: error.message
        }
      };
    }
  }

  /**
   * Determine which type of visual to create
   */
  private determineVisualType(classification: ClassificationResult, input: any): string {
    if (input.requestedType) return input.requestedType;

    const tokens = classification.tokens_matched || [];

    // Check for specific diagram types
    if (tokens.some((t: any) => ['flow', 'flowchart', 'process', 'workflow', 'steps'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'flowchart';
    }
    if (tokens.some((t: any) => ['sequence', 'interaction', 'timeline'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'sequence';
    }
    if (tokens.some((t: any) => ['compare', 'vs', 'versus', 'comparison'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'comparison-table';
    }
    if (tokens.some((t: any) => ['timeline', 'schedule', 'roadmap', 'gantt'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'timeline';
    }
    if (tokens.some((t: any) => ['architecture', 'structure', 'system', 'component'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'architecture';
    }
    if (tokens.some((t: any) => ['tree', 'hierarchy', 'org', 'organization'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'tree';
    }

    // Default to flowchart
    return 'flowchart';
  }

  /**
   * Extract data for visualization
   */
  private extractVisualData(context: AgentContext, input: any): any {
    const { classificationResult, provenance, previousSteps } = context;

    // Extract entities that could be nodes
    const tokens = classificationResult.tokens_matched || [];
    const entities = tokens.map((t: any) => t.symbol);

    // Check if previous agent (Analyst) produced structured data
    const analystOutput = previousSteps.find(step => step.agent === 'Analyst');
    let structuredData = null;
    if (analystOutput && input.previousAgentOutputs) {
      structuredData = input.previousAgentOutputs.find((o: any) => o.agent === 'Analyst');
    }

    return {
      title: input.title || 'Generated Diagram',
      nodes: this.extractNodes(entities, provenance),
      connections: this.extractConnections(provenance),
      labels: entities.slice(0, 10),
      structuredData
    };
  }

  /**
   * Extract nodes from entities and data
   */
  private extractNodes(entities: string[], provenance: any): any[] {
    const nodes = [];

    // Use entities as nodes
    for (let i = 0; i < Math.min(entities.length, 8); i++) {
      nodes.push({
        id: `node${i}`,
        label: entities[i],
        type: i === 0 ? 'start' : 'process'
      });
    }

    // If we have SERP results, add them as nodes
    if (provenance.serp_results && provenance.serp_results.length > 0) {
      const sources = provenance.serp_results.slice(0, 3);
      sources.forEach((source: any, i: number) => {
        nodes.push({
          id: `source${i}`,
          label: source.title.substring(0, 30) + '...',
          type: 'data'
        });
      });
    }

    return nodes;
  }

  /**
   * Extract connections between nodes
   */
  private extractConnections(provenance: any): any[] {
    const connections = [];

    // Create simple sequential connections
    // In a real implementation, this would use NLP to determine relationships
    connections.push({ from: 'node0', to: 'node1', label: 'leads to' });
    if (provenance.serp_results && provenance.serp_results.length > 0) {
      connections.push({ from: 'node1', to: 'source0', label: 'references' });
    }

    return connections;
  }

  /**
   * Generate visual based on type
   */
  private async generateVisual(type: string, data: any, context: AgentContext): Promise<any> {
    switch (type) {
      case 'flowchart':
        return this.generateMermaidFlowchart(data);
      case 'sequence':
        return this.generateMermaidSequence(data);
      case 'comparison-table':
        return this.generateComparisonTable(data, context);
      case 'timeline':
        return this.generateTimeline(data);
      case 'architecture':
        return this.generateArchitectureDiagram(data);
      case 'tree':
        return this.generateTreeDiagram(data);
      default:
        return this.generateGenericDiagram(data);
    }
  }

  /**
   * Generate Mermaid flowchart
   */
  private generateMermaidFlowchart(data: any): any {
    let mermaid = 'flowchart LR\n';

    // Add nodes
    if (data.nodes && data.nodes.length > 0) {
      data.nodes.forEach((node: any) => {
        const shape = node.type === 'start' ? '[' + node.label + ']' :
                     node.type === 'process' ? '(' + node.label + ')' :
                     '{' + node.label + '}';
        mermaid += `  ${node.id}${shape}\n`;
      });

      // Add connections
      if (data.connections && data.connections.length > 0) {
        data.connections.forEach((conn: any) => {
          mermaid += `  ${conn.from} --> ${conn.to}\n`;
        });
      } else {
        // Default sequential flow
        for (let i = 0; i < data.nodes.length - 1; i++) {
          mermaid += `  ${data.nodes[i].id} --> ${data.nodes[i + 1].id}\n`;
        }
      }
    } else {
      // Default example flowchart
      mermaid += '  Start[Start] --> Process[Process]\n';
      mermaid += '  Process --> Decision{Decision?}\n';
      mermaid += '  Decision -->|Yes| ActionA[Action A]\n';
      mermaid += '  Decision -->|No| ActionB[Action B]\n';
      mermaid += '  ActionA --> End[End]\n';
      mermaid += '  ActionB --> End\n';
    }

    return {
      format: 'mermaid',
      content: mermaid
    };
  }

  /**
   * Generate Mermaid sequence diagram
   */
  private generateMermaidSequence(data: any): any {
    let mermaid = 'sequenceDiagram\n';

    if (data.nodes && data.nodes.length >= 2) {
      const participants = data.nodes.slice(0, 4);
      participants.forEach((node: any) => {
        mermaid += `  participant ${node.id} as ${node.label}\n`;
      });

      // Add interactions
      for (let i = 0; i < participants.length - 1; i++) {
        mermaid += `  ${participants[i].id}->> ${participants[i + 1].id}: Request\n`;
        mermaid += `  ${participants[i + 1].id}-->> ${participants[i].id}: Response\n`;
      }
    } else {
      mermaid += '  participant A as Client\n';
      mermaid += '  participant B as Server\n';
      mermaid += '  A->>B: Request\n';
      mermaid += '  B-->>A: Response\n';
    }

    return {
      format: 'mermaid',
      content: mermaid
    };
  }

  /**
   * Generate comparison table
   */
  private generateComparisonTable(data: any, context: AgentContext): any {
    // Check if Analyst provided structured data
    if (data.structuredData && data.structuredData.table) {
      return {
        format: 'table',
        content: data.structuredData.table
      };
    }

    // Generate basic comparison table
    const entities = data.labels || [];
    const table = {
      headers: ['Item', 'Category', 'Source'],
      rows: entities.slice(0, 5).map((entity: string, i: number) => {
        const tierDist: any = context.classificationResult.tier_distribution || {};
        const provenance: any = context.provenance.serp_results || [];
        return [
          entity,
          tierDist[entity]?.tier ? `T${tierDist[entity].tier}` : 'Unknown',
          provenance[i]?.url || 'Internal'
        ];
      })
    };

    return {
      format: 'table',
      content: table
    };
  }

  /**
   * Generate timeline
   */
  private generateTimeline(data: any): any {
    let mermaid = 'gantt\n';
    mermaid += '  title Project Timeline\n';
    mermaid += '  dateFormat  YYYY-MM-DD\n';
    mermaid += '  section Phase 1\n';
    mermaid += '  Task 1: 2024-01-01, 7d\n';
    mermaid += '  Task 2: 2024-01-08, 5d\n';
    mermaid += '  section Phase 2\n';
    mermaid += '  Task 3: 2024-01-13, 10d\n';

    return {
      format: 'mermaid',
      content: mermaid
    };
  }

  /**
   * Generate architecture diagram
   */
  private generateArchitectureDiagram(data: any): any {
    let mermaid = 'graph TB\n';
    mermaid += '  A[Client] --> B[API Gateway]\n';
    mermaid += '  B --> C[Service Layer]\n';
    mermaid += '  C --> D[(Database)]\n';
    mermaid += '  C --> E[Cache]\n';

    return {
      format: 'mermaid',
      content: mermaid
    };
  }

  /**
   * Generate tree diagram
   */
  private generateTreeDiagram(data: any): any {
    let mermaid = 'graph TD\n';

    if (data.nodes && data.nodes.length > 0) {
      const root = data.nodes[0];
      mermaid += `  ${root.id}[${root.label}]\n`;

      // Add children
      for (let i = 1; i < Math.min(data.nodes.length, 7); i++) {
        const node = data.nodes[i];
        mermaid += `  ${root.id} --> ${node.id}[${node.label}]\n`;
      }
    } else {
      mermaid += '  Root[Root]\n';
      mermaid += '  Root --> A[Child A]\n';
      mermaid += '  Root --> B[Child B]\n';
      mermaid += '  A --> A1[Child A1]\n';
      mermaid += '  A --> A2[Child A2]\n';
    }

    return {
      format: 'mermaid',
      content: mermaid
    };
  }

  /**
   * Generate generic diagram
   */
  private generateGenericDiagram(data: any): any {
    return this.generateMermaidFlowchart(data);
  }
}
