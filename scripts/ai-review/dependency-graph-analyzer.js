const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@typescript-eslint/parser');

/**
 * Dependency Graph Analyzer
 * Builds a complete map of file dependencies and detects breaking changes
 */
class DependencyGraphAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.graph = new Map(); // file -> dependencies
    this.reverseGraph = new Map(); // file -> dependents
    this.publicAPIs = new Map(); // file -> exported symbols
  }

  /**
   * Build complete dependency graph for the project
   */
  async buildGraph(files) {
    console.log(`Building dependency graph for ${files.length} files...`);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const imports = await this.extractImports(content, file);
        const exports = await this.extractExports(content, file);

        this.graph.set(file, imports);
        this.publicAPIs.set(file, exports);

        // Build reverse dependencies
        for (const imported of imports) {
          if (!this.reverseGraph.has(imported)) {
            this.reverseGraph.set(imported, []);
          }
          this.reverseGraph.get(imported).push(file);
        }
      } catch (error) {
        console.warn(`Failed to analyze ${file}: ${error.message}`);
      }
    }

    console.log(`Graph built: ${this.graph.size} files, ${this.reverseGraph.size} dependencies`);
  }

  /**
   * Extract import statements from file content
   */
  async extractImports(content, filePath) {
    const imports = [];
    const fileDir = path.dirname(filePath);

    // Match ES6 imports: import ... from '...'
    const es6ImportRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(importPath, fileDir);
      if (resolvedPath) {
        imports.push(resolvedPath);
      }
    }

    // Match CommonJS requires: require('...')
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(importPath, fileDir);
      if (resolvedPath) {
        imports.push(resolvedPath);
      }
    }

    return [...new Set(imports)]; // Deduplicate
  }

  /**
   * Extract exported symbols from file content
   */
  async extractExports(content, filePath) {
    const exports = {
      functions: [],
      classes: [],
      variables: [],
      interfaces: [],
      types: [],
      default: null,
    };

    try {
      // Parse TypeScript/JavaScript AST
      const ast = parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        loc: true,
        range: true,
      });

      // Traverse AST to find exports
      if (ast.body) {
        for (const node of ast.body) {
          if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration) {
              const exportInfo = this.extractDeclarationInfo(node.declaration);
              if (exportInfo) {
                exports[exportInfo.type].push(exportInfo);
              }
            }
          } else if (node.type === 'ExportDefaultDeclaration') {
            exports.default = this.extractDeclarationInfo(node.declaration);
          }
        }
      }
    } catch (error) {
      // Fallback to regex-based extraction if AST parsing fails
      this.extractExportsRegex(content, exports);
    }

    return exports;
  }

  /**
   * Extract declaration information from AST node
   */
  extractDeclarationInfo(node) {
    if (!node) return null;

    switch (node.type) {
      case 'FunctionDeclaration':
        return {
          type: 'functions',
          name: node.id?.name,
          params: node.params.map((p) => ({
            name: p.name || 'unknown',
            type: this.inferParamType(p),
            optional: p.optional || false,
          })),
          async: node.async || false,
          line: node.loc?.start.line,
        };

      case 'ClassDeclaration':
        return {
          type: 'classes',
          name: node.id?.name,
          methods: this.extractClassMethods(node),
          properties: this.extractClassProperties(node),
          line: node.loc?.start.line,
        };

      case 'VariableDeclaration':
        const declarations = node.declarations.map((d) => ({
          type: 'variables',
          name: d.id?.name,
          kind: node.kind, // const, let, var
          line: d.loc?.start.line,
        }));
        return declarations[0]; // Return first declaration

      case 'TSInterfaceDeclaration':
        return {
          type: 'interfaces',
          name: node.id?.name,
          properties: this.extractInterfaceProperties(node),
          line: node.loc?.start.line,
        };

      case 'TSTypeAliasDeclaration':
        return {
          type: 'types',
          name: node.id?.name,
          line: node.loc?.start.line,
        };

      default:
        return null;
    }
  }

  /**
   * Fallback regex-based export extraction
   */
  extractExportsRegex(content, exports) {
    // Export functions
    const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      exports.functions.push({
        name: match[1],
        params: match[2].split(',').map((p) => ({ name: p.trim() })),
      });
    }

    // Export classes
    const classRegex = /export\s+class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      exports.classes.push({ name: match[1] });
    }

    // Export const/let/var
    const varRegex = /export\s+(?:const|let|var)\s+(\w+)/g;
    while ((match = varRegex.exec(content)) !== null) {
      exports.variables.push({ name: match[1] });
    }

    // Export interfaces
    const interfaceRegex = /export\s+interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      exports.interfaces.push({ name: match[1] });
    }

    // Export types
    const typeRegex = /export\s+type\s+(\w+)/g;
    while ((match = typeRegex.exec(content)) !== null) {
      exports.types.push({ name: match[1] });
    }

    // Export default
    const defaultRegex = /export\s+default\s+(\w+)/;
    const defaultMatch = content.match(defaultRegex);
    if (defaultMatch) {
      exports.default = { name: defaultMatch[1] };
    }
  }

  /**
   * Extract class methods from AST
   */
  extractClassMethods(classNode) {
    if (!classNode.body || !classNode.body.body) return [];

    return classNode.body.body
      .filter((member) => member.type === 'MethodDefinition')
      .map((method) => ({
        name: method.key?.name,
        kind: method.kind, // method, get, set, constructor
        static: method.static || false,
        async: method.value?.async || false,
        params:
          method.value?.params.map((p) => ({
            name: p.name || 'unknown',
            type: this.inferParamType(p),
          })) || [],
      }));
  }

  /**
   * Extract class properties from AST
   */
  extractClassProperties(classNode) {
    if (!classNode.body || !classNode.body.body) return [];

    return classNode.body.body
      .filter((member) => member.type === 'PropertyDefinition')
      .map((prop) => ({
        name: prop.key?.name,
        static: prop.static || false,
      }));
  }

  /**
   * Extract interface properties from AST
   */
  extractInterfaceProperties(interfaceNode) {
    if (!interfaceNode.body || !interfaceNode.body.body) return [];

    return interfaceNode.body.body.map((prop) => ({
      name: prop.key?.name,
      optional: prop.optional || false,
    }));
  }

  /**
   * Infer parameter type from AST node
   */
  inferParamType(param) {
    if (param.typeAnnotation?.typeAnnotation?.type) {
      const typeNode = param.typeAnnotation.typeAnnotation;
      return this.stringifyType(typeNode);
    }
    return 'any';
  }

  /**
   * Convert TypeScript type AST to string
   */
  stringifyType(typeNode) {
    switch (typeNode.type) {
      case 'TSStringKeyword':
        return 'string';
      case 'TSNumberKeyword':
        return 'number';
      case 'TSBooleanKeyword':
        return 'boolean';
      case 'TSAnyKeyword':
        return 'any';
      case 'TSVoidKeyword':
        return 'void';
      case 'TSArrayType':
        return `${this.stringifyType(typeNode.elementType)}[]`;
      case 'TSTypeReference':
        return typeNode.typeName?.name || 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Resolve import path to absolute file path
   */
  resolveImportPath(importPath, fromDir) {
    // Skip node_modules
    if (!importPath.startsWith('.')) {
      return null;
    }

    let resolved = path.resolve(fromDir, importPath);

    // Try different extensions
    const extensions = ['.ts', '.js', '.tsx', '.jsx', ''];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      try {
        if (require('fs').existsSync(withExt)) {
          return path.relative(this.projectPath, withExt);
        }
      } catch (e) {
        // Continue trying
      }
    }

    // Try index files
    for (const ext of ['.ts', '.js']) {
      const indexPath = path.join(resolved, `index${ext}`);
      try {
        if (require('fs').existsSync(indexPath)) {
          return path.relative(this.projectPath, indexPath);
        }
      } catch (e) {
        // Continue trying
      }
    }

    return null;
  }

  /**
   * Analyze impact of changed files
   */
  async analyzeImpact(changedFiles) {
    const impacts = [];

    for (const file of changedFiles) {
      // Get dependents
      const directDependents = this.reverseGraph.get(file) || [];
      const allDependents = this.getAllDependents(file);

      // Get API changes
      const apiChanges = await this.detectAPIChanges(file);

      if (apiChanges.length > 0 || allDependents.length > 0) {
        impacts.push({
          changedFile: file,
          apiChanges: apiChanges,
          directlyAffected: directDependents.length,
          totalAffected: allDependents.length,
          affectedFiles: allDependents,
          severity: this.calculateSeverity(apiChanges, allDependents.length),
          recommendation: this.generateRecommendation(apiChanges, allDependents),
        });
      }
    }

    return impacts;
  }

  /**
   * Get all transitive dependents of a file
   */
  getAllDependents(file, visited = new Set()) {
    if (visited.has(file)) return [];
    visited.add(file);

    const direct = this.reverseGraph.get(file) || [];
    const transitive = direct.flatMap((dep) => this.getAllDependents(dep, visited));

    return [...new Set([...direct, ...transitive])];
  }

  /**
   * Detect API changes in a file (requires git diff)
   */
  async detectAPIChanges(file) {
    const changes = [];

    try {
      // Get old version from git
      const { execSync } = require('child_process');
      const oldContent = execSync(`git show HEAD:${file}`, { encoding: 'utf-8' });
      const newContent = await fs.readFile(file, 'utf-8');

      const oldAPI = await this.extractExports(oldContent, file);
      const newAPI = await this.extractExports(newContent, file);

      // Check removed exports
      for (const type of ['functions', 'classes', 'variables', 'interfaces', 'types']) {
        const oldItems = oldAPI[type] || [];
        const newItems = newAPI[type] || [];
        const oldNames = new Set(oldItems.map((i) => i.name));
        const newNames = new Set(newItems.map((i) => i.name));

        // Removed items
        for (const oldItem of oldItems) {
          if (!newNames.has(oldItem.name)) {
            changes.push({
              type: 'REMOVED',
              category: type,
              name: oldItem.name,
              severity: 'CRITICAL',
              breaking: true,
              oldSignature: oldItem,
            });
          }
        }

        // Added items
        for (const newItem of newItems) {
          if (!oldNames.has(newItem.name)) {
            changes.push({
              type: 'ADDED',
              category: type,
              name: newItem.name,
              severity: 'INFO',
              breaking: false,
              newSignature: newItem,
            });
          }
        }

        // Modified items
        for (const newItem of newItems) {
          const oldItem = oldItems.find((i) => i.name === newItem.name);
          if (oldItem && !this.signaturesMatch(oldItem, newItem)) {
            const details = this.compareSignatures(oldItem, newItem);
            changes.push({
              type: 'MODIFIED',
              category: type,
              name: newItem.name,
              severity: this.getModificationSeverity(details),
              breaking: details.some((d) => d.breaking),
              oldSignature: oldItem,
              newSignature: newItem,
              details: details,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Could not detect API changes for ${file}: ${error.message}`);
    }

    return changes;
  }

  /**
   * Compare two signatures
   */
  signaturesMatch(oldSig, newSig) {
    // Deep comparison of signatures
    return JSON.stringify(oldSig) === JSON.stringify(newSig);
  }

  /**
   * Compare signatures and return differences
   */
  compareSignatures(oldSig, newSig) {
    const differences = [];

    // For functions: compare parameters
    if (oldSig.params && newSig.params) {
      // Parameter count changed
      if (oldSig.params.length !== newSig.params.length) {
        differences.push({
          aspect: 'PARAMETER_COUNT',
          old: oldSig.params.length,
          new: newSig.params.length,
          breaking: newSig.params.length < oldSig.params.length,
        });
      }

      // Parameter types changed
      const minLength = Math.min(oldSig.params.length, newSig.params.length);
      for (let i = 0; i < minLength; i++) {
        if (oldSig.params[i].type !== newSig.params[i].type) {
          differences.push({
            aspect: 'PARAMETER_TYPE',
            parameter: oldSig.params[i].name,
            oldType: oldSig.params[i].type,
            newType: newSig.params[i].type,
            breaking: !this.isTypeCompatible(oldSig.params[i].type, newSig.params[i].type),
          });
        }

        // Optional changed to required
        if (!oldSig.params[i].optional && newSig.params[i].optional) {
          differences.push({
            aspect: 'PARAMETER_OPTIONAL',
            parameter: newSig.params[i].name,
            breaking: false,
          });
        } else if (oldSig.params[i].optional && !newSig.params[i].optional) {
          differences.push({
            aspect: 'PARAMETER_REQUIRED',
            parameter: newSig.params[i].name,
            breaking: true,
          });
        }
      }
    }

    // For classes: compare methods
    if (oldSig.methods && newSig.methods) {
      const oldMethods = new Set(oldSig.methods.map((m) => m.name));
      const newMethods = new Set(newSig.methods.map((m) => m.name));

      for (const oldMethod of oldSig.methods) {
        if (!newMethods.has(oldMethod.name)) {
          differences.push({
            aspect: 'METHOD_REMOVED',
            method: oldMethod.name,
            breaking: true,
          });
        }
      }
    }

    return differences;
  }

  /**
   * Check if two types are compatible
   */
  isTypeCompatible(oldType, newType) {
    if (oldType === newType) return true;
    if (oldType === 'any' || newType === 'any') return true;

    // Widening is safe: specific -> general
    // Narrowing is breaking: general -> specific
    const hierarchy = {
      any: 5,
      unknown: 4,
      object: 3,
      string: 2,
      number: 2,
      boolean: 2,
    };

    return (hierarchy[newType] || 0) >= (hierarchy[oldType] || 0);
  }

  /**
   * Get severity of modification based on differences
   */
  getModificationSeverity(differences) {
    if (differences.some((d) => d.breaking)) return 'HIGH';
    if (differences.length > 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate severity of impact
   */
  calculateSeverity(apiChanges, affectedCount) {
    const criticalChanges = apiChanges.filter((c) => c.severity === 'CRITICAL').length;
    const breakingChanges = apiChanges.filter((c) => c.breaking).length;

    if (criticalChanges > 0 && affectedCount > 10) return 'CRITICAL';
    if (breakingChanges > 0 && affectedCount > 5) return 'HIGH';
    if (apiChanges.length > 0 && affectedCount > 0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendation based on impact
   */
  generateRecommendation(apiChanges, affectedFiles) {
    const breakingChanges = apiChanges.filter((c) => c.breaking);
    const removedAPIs = apiChanges.filter((c) => c.type === 'REMOVED');

    if (breakingChanges.length === 0) {
      return {
        action: 'APPROVE',
        reason: 'No breaking changes detected',
      };
    }

    if (removedAPIs.length > 0 && affectedFiles.length > 0) {
      return {
        action: 'BLOCK_MERGE',
        reason: `Removing APIs affects ${affectedFiles.length} files`,
        suggestions: [
          'Add deprecation warnings instead of removing',
          'Update all affected files in this PR',
          'Create migration guide for breaking changes',
        ],
      };
    }

    if (affectedFiles.length > 10) {
      return {
        action: 'BLOCK_MERGE',
        reason: `Breaking changes affect ${affectedFiles.length} files`,
        suggestions: [
          'Use function overloading for backward compatibility',
          'Create new methods instead of modifying existing ones',
          'Update all affected files in this PR',
        ],
      };
    }

    return {
      action: 'WARN',
      reason: `Breaking changes detected affecting ${affectedFiles.length} files`,
      suggestions: ['Review all affected files carefully', 'Consider backward compatibility'],
    };
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (file, path = []) => {
      if (recursionStack.has(file)) {
        // Found cycle
        const cycleStart = path.indexOf(file);
        const cycle = [...path.slice(cycleStart), file];
        cycles.push(cycle);
        return;
      }

      if (visited.has(file)) return;

      visited.add(file);
      recursionStack.add(file);
      path.push(file);

      const dependencies = this.graph.get(file) || [];
      for (const dep of dependencies) {
        dfs(dep, [...path]);
      }

      recursionStack.delete(file);
    };

    for (const file of this.graph.keys()) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }

    return cycles;
  }

  /**
   * Generate analysis report
   */
  generateReport(impacts) {
    const report = {
      summary: {
        totalFiles: this.graph.size,
        analyzedFiles: impacts.length,
        totalImpacts: impacts.reduce((sum, i) => sum + i.totalAffected, 0),
        criticalIssues: impacts.filter((i) => i.severity === 'CRITICAL').length,
        highIssues: impacts.filter((i) => i.severity === 'HIGH').length,
        breakingChanges: impacts.filter((i) => i.apiChanges.some((c) => c.breaking)).length,
      },
      impacts: impacts,
      circularDependencies: this.detectCircularDependencies(),
      recommendation: this.getOverallRecommendation(impacts),
    };

    return report;
  }

  /**
   * Get overall recommendation
   */
  getOverallRecommendation(impacts) {
    const critical = impacts.filter((i) => i.severity === 'CRITICAL').length;
    const blocking = impacts.filter((i) => i.recommendation.action === 'BLOCK_MERGE').length;

    if (critical > 0 || blocking > 0) {
      return {
        action: 'BLOCK_MERGE',
        reason: `${critical} critical issues and ${blocking} blocking changes detected`,
      };
    }

    const warnings = impacts.filter((i) => i.recommendation.action === 'WARN').length;
    if (warnings > 0) {
      return {
        action: 'WARN',
        reason: `${warnings} files with potential breaking changes`,
      };
    }

    return {
      action: 'APPROVE',
      reason: 'No breaking changes detected',
    };
  }
}

module.exports = DependencyGraphAnalyzer;
