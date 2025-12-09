/**
 * Brain Lane — Flowchart Engine
 * ==============================
 * Generates interactive flowcharts for:
 * - App architecture visualization
 * - File dependency graphs
 * - Data flow diagrams
 * - AI-recommended redesigns
 */

import { aiEngine } from './aiEngine';

// ============================================================================
// FLOWCHART TYPES
// ============================================================================

export const FlowchartType = {
  ARCHITECTURE: 'architecture',
  DEPENDENCIES: 'dependencies',
  DATA_FLOW: 'data_flow',
  COMPONENT_TREE: 'component_tree',
  API_ROUTES: 'api_routes',
  STATE_FLOW: 'state_flow',
  REDESIGN: 'redesign',
};

export const NodeType = {
  PAGE: 'page',
  COMPONENT: 'component',
  SERVICE: 'service',
  API: 'api',
  DATABASE: 'database',
  STORE: 'store',
  UTIL: 'util',
  CONFIG: 'config',
  EXTERNAL: 'external',
};

const NODE_STYLES = {
  [NodeType.PAGE]: { color: '#818cf8', shape: 'rectangle', icon: '📄' },
  [NodeType.COMPONENT]: { color: '#34d399', shape: 'rectangle', icon: '🧩' },
  [NodeType.SERVICE]: { color: '#fbbf24', shape: 'hexagon', icon: '⚙️' },
  [NodeType.API]: { color: '#f472b6', shape: 'diamond', icon: '🔌' },
  [NodeType.DATABASE]: { color: '#60a5fa', shape: 'cylinder', icon: '🗄️' },
  [NodeType.STORE]: { color: '#a78bfa', shape: 'parallelogram', icon: '📦' },
  [NodeType.UTIL]: { color: '#94a3b8', shape: 'rectangle', icon: '🔧' },
  [NodeType.CONFIG]: { color: '#fb923c', shape: 'rectangle', icon: '⚙️' },
  [NodeType.EXTERNAL]: { color: '#e879f9', shape: 'cloud', icon: '☁️' },
};

// ============================================================================
// FLOWCHART ENGINE CLASS
// ============================================================================

class FlowchartEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate flowchart data from project files
   */
  async generateFlowchart(files, type = FlowchartType.ARCHITECTURE) {
    const cacheKey = `${type}-${files.length}`;
    
    switch (type) {
      case FlowchartType.ARCHITECTURE:
        return this._generateArchitecture(files);
      case FlowchartType.DEPENDENCIES:
        return this._generateDependencies(files);
      case FlowchartType.DATA_FLOW:
        return this._generateDataFlow(files);
      case FlowchartType.COMPONENT_TREE:
        return this._generateComponentTree(files);
      case FlowchartType.API_ROUTES:
        return this._generateApiRoutes(files);
      case FlowchartType.STATE_FLOW:
        return this._generateStateFlow(files);
      case FlowchartType.REDESIGN:
        return this._generateRedesign(files);
      default:
        throw new Error(`Unknown flowchart type: ${type}`);
    }
  }

  /**
   * Generate app architecture diagram
   */
  async _generateArchitecture(files) {
    const nodes = [];
    const edges = [];
    const layers = {
      pages: [],
      components: [],
      services: [],
      stores: [],
      utils: [],
    };

    // Categorize files into layers
    for (const file of files) {
      const node = this._fileToNode(file);
      nodes.push(node);

      if (file.path.includes('/pages/')) layers.pages.push(node.id);
      else if (file.path.includes('/components/')) layers.components.push(node.id);
      else if (file.path.includes('/services/')) layers.services.push(node.id);
      else if (file.path.includes('/store/')) layers.stores.push(node.id);
      else if (file.path.includes('/utils/') || file.path.includes('/lib/')) layers.utils.push(node.id);
    }

    // Generate edges from imports
    for (const file of files) {
      const imports = this._extractImports(file.content || '');
      for (const imp of imports) {
        const targetFile = files.find(f => 
          f.path.includes(imp) || f.name === imp + '.js' || f.name === imp + '.jsx'
        );
        if (targetFile) {
          edges.push({
            id: `${file.path}->${targetFile.path}`,
            source: file.path,
            target: targetFile.path,
            animated: false,
          });
        }
      }
    }

    return {
      type: FlowchartType.ARCHITECTURE,
      nodes,
      edges,
      layers,
      layout: 'horizontal',
    };
  }

  /**
   * Generate file dependency graph
   */
  async _generateDependencies(files) {
    const nodes = [];
    const edges = [];
    const cyclicPaths = [];

    // Build dependency graph
    const graph = new Map();
    
    for (const file of files) {
      const node = this._fileToNode(file);
      nodes.push(node);
      
      const imports = this._extractImports(file.content || '');
      graph.set(file.path, imports);
      
      for (const imp of imports) {
        const targetFile = files.find(f => 
          f.path.includes(imp) || f.name === `${imp}.js` || f.name === `${imp}.jsx` || f.name === `${imp}.ts`
        );
        if (targetFile) {
          edges.push({
            id: `${file.path}->${targetFile.path}`,
            source: file.path,
            target: targetFile.path,
            type: 'dependency',
          });
        }
      }
    }

    // Detect cycles
    const visited = new Set();
    const recursionStack = new Set();
    
    const detectCycle = (path, currentPath = []) => {
      if (recursionStack.has(path)) {
        const cycleStart = currentPath.indexOf(path);
        cyclicPaths.push(currentPath.slice(cycleStart).concat(path));
        return true;
      }
      if (visited.has(path)) return false;
      
      visited.add(path);
      recursionStack.add(path);
      
      const deps = graph.get(path) || [];
      for (const dep of deps) {
        const targetFile = files.find(f => f.path.includes(dep));
        if (targetFile) {
          detectCycle(targetFile.path, [...currentPath, path]);
        }
      }
      
      recursionStack.delete(path);
      return false;
    };

    for (const file of files) {
      detectCycle(file.path);
    }

    // Mark cyclic edges
    for (const edge of edges) {
      for (const cycle of cyclicPaths) {
        const sourceIdx = cycle.indexOf(edge.source);
        const targetIdx = cycle.indexOf(edge.target);
        if (sourceIdx !== -1 && targetIdx !== -1 && targetIdx === sourceIdx + 1) {
          edge.type = 'cyclic';
          edge.style = { stroke: '#ef4444' };
        }
      }
    }

    return {
      type: FlowchartType.DEPENDENCIES,
      nodes,
      edges,
      cyclicPaths,
      stats: {
        totalFiles: files.length,
        totalDependencies: edges.length,
        circularDeps: cyclicPaths.length,
      },
    };
  }

  /**
   * Generate data flow diagram
   */
  async _generateDataFlow(files) {
    const nodes = [];
    const edges = [];

    // Find stores
    const stores = files.filter(f => 
      f.path.includes('/store/') || f.name.includes('Store.') || f.content?.includes('create(')
    );

    // Find components that use stores
    const consumers = files.filter(f => 
      f.content?.includes('useStore') || f.content?.includes('useProjectStore') || f.content?.includes('useTaskStore')
    );

    // Add store nodes
    for (const store of stores) {
      nodes.push({
        id: store.path,
        type: NodeType.STORE,
        label: store.name.replace(/\.[jt]sx?$/, ''),
        ...NODE_STYLES[NodeType.STORE],
        data: { filePath: store.path },
      });
    }

    // Add consumer nodes and edges
    for (const consumer of consumers) {
      if (!nodes.find(n => n.id === consumer.path)) {
        nodes.push(this._fileToNode(consumer));
      }

      // Find which stores this component uses
      for (const store of stores) {
        const storeName = store.name.replace(/\.[jt]sx?$/, '');
        if (consumer.content?.includes(storeName) || consumer.content?.includes('useStore')) {
          edges.push({
            id: `${store.path}->${consumer.path}`,
            source: store.path,
            target: consumer.path,
            label: 'subscribes',
            type: 'dataflow',
          });
        }
      }
    }

    return {
      type: FlowchartType.DATA_FLOW,
      nodes,
      edges,
      layout: 'radial',
    };
  }

  /**
   * Generate component tree
   */
  async _generateComponentTree(files) {
    const components = files.filter(f => 
      f.path.includes('/components/') || f.path.includes('/pages/')
    );

    const nodes = [];
    const edges = [];
    const rootComponents = [];

    for (const comp of components) {
      const node = this._fileToNode(comp);
      nodes.push(node);

      // Parse for child components
      const childRefs = this._extractComponentRefs(comp.content || '');
      
      for (const childName of childRefs) {
        const childFile = components.find(f => 
          f.name.replace(/\.[jt]sx?$/, '') === childName
        );
        if (childFile) {
          edges.push({
            id: `${comp.path}->${childFile.path}`,
            source: comp.path,
            target: childFile.path,
            type: 'contains',
          });
        }
      }
    }

    // Find root components (not referenced by others)
    const referenced = new Set(edges.map(e => e.target));
    for (const node of nodes) {
      if (!referenced.has(node.id)) {
        rootComponents.push(node.id);
      }
    }

    return {
      type: FlowchartType.COMPONENT_TREE,
      nodes,
      edges,
      rootComponents,
      layout: 'tree',
    };
  }

  /**
   * Generate API routes diagram
   */
  async _generateApiRoutes(files) {
    const nodes = [];
    const edges = [];

    // Find API files
    const apiFiles = files.filter(f => 
      f.path.includes('/api/') || f.name.includes('api') || f.name.includes('route')
    );

    // Add API node
    nodes.push({
      id: 'api-gateway',
      type: NodeType.EXTERNAL,
      label: 'API Gateway',
      ...NODE_STYLES[NodeType.EXTERNAL],
    });

    for (const apiFile of apiFiles) {
      const routes = this._extractApiRoutes(apiFile.content || '', apiFile.path);
      
      for (const route of routes) {
        const nodeId = `${apiFile.path}:${route.method}:${route.path}`;
        nodes.push({
          id: nodeId,
          type: NodeType.API,
          label: `${route.method} ${route.path}`,
          ...NODE_STYLES[NodeType.API],
          data: { 
            filePath: apiFile.path,
            method: route.method,
            endpoint: route.path,
          },
        });

        edges.push({
          id: `api-gateway->${nodeId}`,
          source: 'api-gateway',
          target: nodeId,
          label: route.method,
        });
      }
    }

    // Find services these APIs call
    const services = files.filter(f => f.path.includes('/services/'));
    for (const service of services) {
      const serviceNode = this._fileToNode(service);
      serviceNode.type = NodeType.SERVICE;
      Object.assign(serviceNode, NODE_STYLES[NodeType.SERVICE]);
      nodes.push(serviceNode);

      // Check if any API uses this service
      for (const apiFile of apiFiles) {
        if (apiFile.content?.includes(service.name.replace(/\.[jt]sx?$/, ''))) {
          edges.push({
            id: `${apiFile.path}->${service.path}`,
            source: apiFile.path,
            target: service.path,
            label: 'calls',
          });
        }
      }
    }

    return {
      type: FlowchartType.API_ROUTES,
      nodes,
      edges,
      layout: 'hierarchical',
    };
  }

  /**
   * Generate state flow diagram
   */
  async _generateStateFlow(files) {
    const nodes = [];
    const edges = [];

    // Find state management files
    const storeFiles = files.filter(f => 
      f.content?.includes('create(') || 
      f.content?.includes('createSlice') ||
      f.content?.includes('useReducer') ||
      f.path.includes('/store/')
    );

    for (const store of storeFiles) {
      const storeNode = {
        id: store.path,
        type: NodeType.STORE,
        label: store.name.replace(/\.[jt]sx?$/, ''),
        ...NODE_STYLES[NodeType.STORE],
        data: { filePath: store.path },
      };
      nodes.push(storeNode);

      // Extract state shape
      const stateShape = this._extractStateShape(store.content || '');
      
      for (const prop of stateShape) {
        const propId = `${store.path}:${prop}`;
        nodes.push({
          id: propId,
          type: 'state-prop',
          label: prop,
          color: '#64748b',
          shape: 'ellipse',
        });
        edges.push({
          id: `${store.path}->${propId}`,
          source: store.path,
          target: propId,
          type: 'contains',
        });
      }

      // Find actions
      const actions = this._extractActions(store.content || '');
      for (const action of actions) {
        const actionId = `${store.path}:action:${action}`;
        nodes.push({
          id: actionId,
          type: 'action',
          label: action,
          color: '#22c55e',
          shape: 'diamond',
        });
        edges.push({
          id: `${actionId}->${store.path}`,
          source: actionId,
          target: store.path,
          label: 'mutates',
          style: { stroke: '#22c55e' },
        });
      }
    }

    return {
      type: FlowchartType.STATE_FLOW,
      nodes,
      edges,
      layout: 'force',
    };
  }

  /**
   * Generate AI-recommended redesign
   */
  async _generateRedesign(files) {
    // First, generate current architecture
    const current = await this._generateArchitecture(files);

    // Use AI to suggest improvements
    const filesSummary = files.map(f => ({
      path: f.path,
      type: this._inferFileType(f.path),
      hasTests: f.name.includes('.test.') || f.name.includes('.spec.'),
    }));

    const prompt = `Analyze this project structure and suggest architectural improvements:

Files:
${JSON.stringify(filesSummary, null, 2)}

Current Issues Detected:
- ${current.edges.length > files.length * 2 ? 'High coupling between modules' : 'Normal coupling'}
- ${!filesSummary.some(f => f.hasTests) ? 'No test files detected' : 'Tests present'}

Provide a JSON response with:
1. suggestedNodes: New files/modules to add
2. suggestedEdges: New connections
3. removals: Files to refactor/remove
4. recommendations: Array of improvement suggestions`;

    try {
      const response = await aiEngine.invoke({
        prompt,
        type: 'analysis',
        model: 'gpt-4o',
      });

      const suggestions = JSON.parse(response.text || '{}');

      return {
        type: FlowchartType.REDESIGN,
        current,
        suggested: {
          nodes: suggestions.suggestedNodes || [],
          edges: suggestions.suggestedEdges || [],
          removals: suggestions.removals || [],
        },
        recommendations: suggestions.recommendations || [],
        layout: 'comparison',
      };
    } catch (error) {
      console.error('AI redesign analysis failed:', error);
      return {
        type: FlowchartType.REDESIGN,
        current,
        suggested: { nodes: [], edges: [], removals: [] },
        recommendations: ['AI analysis unavailable - displaying current architecture'],
        layout: 'comparison',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  _fileToNode(file) {
    const type = this._inferNodeType(file.path);
    return {
      id: file.path,
      type,
      label: file.name.replace(/\.[jt]sx?$/, ''),
      ...NODE_STYLES[type],
      data: {
        filePath: file.path,
        size: file.size || 0,
      },
    };
  }

  _inferNodeType(path) {
    if (path.includes('/pages/')) return NodeType.PAGE;
    if (path.includes('/components/')) return NodeType.COMPONENT;
    if (path.includes('/services/')) return NodeType.SERVICE;
    if (path.includes('/api/')) return NodeType.API;
    if (path.includes('/store/')) return NodeType.STORE;
    if (path.includes('/utils/') || path.includes('/lib/')) return NodeType.UTIL;
    if (path.includes('/config')) return NodeType.CONFIG;
    return NodeType.COMPONENT;
  }

  _inferFileType(path) {
    if (path.includes('/pages/')) return 'page';
    if (path.includes('/components/')) return 'component';
    if (path.includes('/services/')) return 'service';
    if (path.includes('/api/')) return 'api';
    if (path.includes('/store/')) return 'store';
    if (path.includes('/utils/')) return 'util';
    return 'other';
  }

  _extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:[\w{},\s*]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const path = match[1];
      // Only track local imports
      if (path.startsWith('.') || path.startsWith('@/')) {
        imports.push(path.replace(/^@\//, '').replace(/^\.\//, '').replace(/^\.\.\//, ''));
      }
    }
    return imports;
  }

  _extractComponentRefs(content) {
    const refs = [];
    // Match JSX component usage
    const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
    let match;
    while ((match = jsxRegex.exec(content)) !== null) {
      if (!['React', 'Fragment'].includes(match[1])) {
        refs.push(match[1]);
      }
    }
    return [...new Set(refs)];
  }

  _extractApiRoutes(content, filePath) {
    const routes = [];
    
    // Express-style routes
    const expressRegex = /(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match;
    while ((match = expressRegex.exec(content)) !== null) {
      routes.push({ method: match[1].toUpperCase(), path: match[2] });
    }

    // Next.js API routes
    if (filePath.includes('/api/')) {
      const pathParts = filePath.split('/api/')[1];
      if (pathParts) {
        const apiPath = '/api/' + pathParts.replace(/\.[jt]sx?$/, '').replace('/route', '');
        if (content.includes('export async function GET')) routes.push({ method: 'GET', path: apiPath });
        if (content.includes('export async function POST')) routes.push({ method: 'POST', path: apiPath });
        if (content.includes('export async function PUT')) routes.push({ method: 'PUT', path: apiPath });
        if (content.includes('export async function DELETE')) routes.push({ method: 'DELETE', path: apiPath });
      }
    }

    return routes;
  }

  _extractStateShape(content) {
    const props = [];
    
    // Match zustand initial state
    const stateMatch = content.match(/create\([^)]*\(\s*\(set[^)]*\)\s*=>\s*\(\s*{([^}]+)}/);
    if (stateMatch) {
      const stateBlock = stateMatch[1];
      const propRegex = /(\w+)\s*:/g;
      let match;
      while ((match = propRegex.exec(stateBlock)) !== null) {
        props.push(match[1]);
      }
    }

    return props.slice(0, 10); // Limit for visualization
  }

  _extractActions(content) {
    const actions = [];
    
    // Match zustand actions (functions in store)
    const actionRegex = /(\w+)\s*:\s*\([^)]*\)\s*=>\s*(?:set|{)/g;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      const name = match[1];
      if (!['get', 'set'].includes(name)) {
        actions.push(name);
      }
    }

    return actions.slice(0, 10); // Limit for visualization
  }

  /**
   * Export flowchart to Mermaid format
   */
  toMermaid(flowchart) {
    let mermaid = 'flowchart TD\n';

    for (const node of flowchart.nodes) {
      const label = node.label.replace(/[^a-zA-Z0-9]/g, '_');
      const shape = this._getMermaidShape(node.type);
      mermaid += `    ${label}${shape.open}"${node.label}"${shape.close}\n`;
    }

    for (const edge of flowchart.edges) {
      const source = edge.source.split('/').pop()?.replace(/\.[jt]sx?$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const target = edge.target.split('/').pop()?.replace(/\.[jt]sx?$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const arrow = edge.type === 'cyclic' ? '-.->|cyclic|' : '-->';
      mermaid += `    ${source} ${arrow} ${target}\n`;
    }

    return mermaid;
  }

  _getMermaidShape(type) {
    switch (type) {
      case NodeType.DATABASE: return { open: '[(', close: ')]' };
      case NodeType.API: return { open: '{', close: '}' };
      case NodeType.SERVICE: return { open: '{{', close: '}}' };
      case NodeType.EXTERNAL: return { open: '((', close: '))' };
      default: return { open: '[', close: ']' };
    }
  }

  /**
   * Export flowchart to JSON for React Flow
   */
  toReactFlow(flowchart) {
    const nodes = flowchart.nodes.map((node, index) => ({
      id: node.id,
      type: 'default',
      data: { 
        label: `${node.icon || ''} ${node.label}`,
        ...node.data,
      },
      position: { 
        x: (index % 4) * 200, 
        y: Math.floor(index / 4) * 100,
      },
      style: {
        background: node.color,
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: 10,
      },
    }));

    const edges = flowchart.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.animated || edge.type === 'cyclic',
      style: edge.style,
    }));

    return { nodes, edges };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const flowchartEngine = new FlowchartEngine();
export default flowchartEngine;
