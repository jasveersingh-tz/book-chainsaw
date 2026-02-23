const fs = require('fs').promises;
const { parse } = require('@typescript-eslint/parser');

/**
 * Call Graph Analyzer
 * Tracks actual function/method calls to detect runtime breaking changes
 */
class CallGraphAnalyzer {
  constructor() {
    this.callGraph = new Map(); // function -> call sites
    this.functionSignatures = new Map(); // function -> signature
  }

  /**
   * Build call graph for all files
   */
  async buildCallGraph(files) {
    console.log(`Building call graph for ${files.length} files...`);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        await this.analyzeFile(content, file);
      } catch (error) {
        console.warn(`Failed to analyze ${file}: ${error.message}`);
      }
    }

    console.log(`Call graph built: ${this.callGraph.size} functions tracked`);
  }

  /**
   * Analyze file for function calls
   */
  async analyzeFile(content, filePath) {
    try {
      const ast = parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        loc: true,
        range: true,
      });

      this.traverseAST(ast, filePath);
    } catch (error) {
      // Fallback to regex if AST parsing fails
      this.analyzeFileRegex(content, filePath);
    }
  }

  /**
   * Traverse AST to find function calls
   */
  traverseAST(node, filePath, context = {}) {
    if (!node || typeof node !== 'object') return;

    // Track function declarations
    if (node.type === 'FunctionDeclaration' && node.id) {
      const signature = this.extractFunctionSignature(node);
      this.functionSignatures.set(`${filePath}:${node.id.name}`, signature);
    }

    // Track method definitions
    if (node.type === 'MethodDefinition' && node.key) {
      const signature = this.extractMethodSignature(node);
      this.functionSignatures.set(`${filePath}:${node.key.name}`, signature);
    }

    // Track function calls
    if (node.type === 'CallExpression') {
      const callInfo = this.extractCallInfo(node, filePath);
      if (callInfo) {
        const key = callInfo.functionName;
        if (!this.callGraph.has(key)) {
          this.callGraph.set(key, []);
        }
        this.callGraph.get(key).push(callInfo);
      }
    }

    // Recurse through AST
    for (const key in node) {
      if (key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach((c) => this.traverseAST(c, filePath, context));
      } else if (typeof child === 'object') {
        this.traverseAST(child, filePath, context);
      }
    }
  }

  /**
   * Extract function signature from AST
   */
  extractFunctionSignature(node) {
    return {
      name: node.id?.name,
      params: node.params.map((p) => ({
        name: this.getParamName(p),
        type: this.inferType(p),
        optional: p.optional || false,
        defaultValue: p.type === 'AssignmentPattern',
      })),
      async: node.async || false,
      returnType: this.inferReturnType(node),
      line: node.loc?.start.line,
    };
  }

  /**
   * Extract method signature from AST
   */
  extractMethodSignature(node) {
    return {
      name: node.key?.name,
      kind: node.kind,
      static: node.static || false,
      params:
        node.value?.params.map((p) => ({
          name: this.getParamName(p),
          type: this.inferType(p),
          optional: p.optional || false,
        })) || [],
      async: node.value?.async || false,
      line: node.loc?.start.line,
    };
  }

  /**
   * Extract call information from CallExpression
   */
  extractCallInfo(node, filePath) {
    let functionName = null;
    let callee = node.callee;

    // Direct function call: foo()
    if (callee.type === 'Identifier') {
      functionName = callee.name;
    }
    // Method call: obj.method()
    else if (callee.type === 'MemberExpression') {
      if (callee.property?.name) {
        functionName = callee.property.name;
      }
    }

    if (!functionName) return null;

    return {
      functionName,
      file: filePath,
      line: node.loc?.start.line,
      arguments: node.arguments.map((arg) => this.inferArgumentType(arg)),
      code: this.getCodeSnippet(node),
    };
  }

  /**
   * Get parameter name from various node types
   */
  getParamName(param) {
    if (param.type === 'Identifier') return param.name;
    if (param.type === 'AssignmentPattern' && param.left?.name) return param.left.name;
    if (param.type === 'RestElement' && param.argument?.name) return `...${param.argument.name}`;
    return 'unknown';
  }

  /**
   * Infer type from parameter
   */
  inferType(param) {
    if (param.typeAnnotation?.typeAnnotation) {
      return this.stringifyType(param.typeAnnotation.typeAnnotation);
    }
    if (param.type === 'AssignmentPattern' && param.left?.typeAnnotation) {
      return this.stringifyType(param.left.typeAnnotation.typeAnnotation);
    }
    return 'any';
  }

  /**
   * Infer return type
   */
  inferReturnType(node) {
    if (node.returnType?.typeAnnotation) {
      return this.stringifyType(node.returnType.typeAnnotation);
    }
    return 'unknown';
  }

  /**
   * Infer argument type from AST node
   */
  inferArgumentType(arg) {
    switch (arg.type) {
      case 'Literal':
        return typeof arg.value;
      case 'StringLiteral':
        return 'string';
      case 'NumericLiteral':
        return 'number';
      case 'BooleanLiteral':
        return 'boolean';
      case 'ObjectExpression':
        return 'object';
      case 'ArrayExpression':
        return 'array';
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return 'function';
      case 'Identifier':
        return 'variable';
      default:
        return 'unknown';
    }
  }

  /**
   * Stringify TypeScript type
   */
  stringifyType(typeNode) {
    if (!typeNode) return 'unknown';

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
   * Get code snippet (placeholder)
   */
  getCodeSnippet(node) {
    // Would need actual source code range extraction
    return `function call at line ${node.loc?.start.line}`;
  }

  /**
   * Regex-based fallback analysis
   */
  analyzeFileRegex(content, filePath) {
    const lines = content.split('\n');

    // Find function calls: functionName(...)
    const callRegex = /(\w+)\s*\(/g;
    let match;

    lines.forEach((line, index) => {
      let lineMatch;
      while ((lineMatch = callRegex.exec(line)) !== null) {
        const functionName = lineMatch[1];

        if (!this.callGraph.has(functionName)) {
          this.callGraph.set(functionName, []);
        }

        this.callGraph.get(functionName).push({
          functionName,
          file: filePath,
          line: index + 1,
          arguments: [],
          code: line.trim(),
        });
      }
    });
  }

  /**
   * Analyze call sites for a changed function
   */
  async analyzeCallSites(changedFunction, newSignature) {
    const callSites = this.callGraph.get(changedFunction) || [];
    const incompatibilities = [];

    for (const call of callSites) {
      const validation = this.validateCall(call, newSignature);
      if (!validation.valid) {
        incompatibilities.push({
          file: call.file,
          line: call.line,
          reason: validation.reason,
          currentCall: call.code,
          suggestion: validation.suggestion,
          severity: validation.severity,
        });
      }
    }

    return {
      changedFunction,
      totalCallSites: callSites.length,
      incompatibleCalls: incompatibilities.length,
      incompatibilities,
      risk: this.assessRisk(callSites.length, incompatibilities.length),
    };
  }

  /**
   * Validate function call against new signature
   */
  validateCall(call, newSignature) {
    const issues = [];

    // Check argument count
    const argCount = call.arguments.length;
    const requiredParams = newSignature.params.filter((p) => !p.optional && !p.defaultValue).length;
    const totalParams = newSignature.params.length;

    if (argCount < requiredParams) {
      issues.push(`Missing required arguments (expected ${requiredParams}, got ${argCount})`);
    }

    if (argCount > totalParams) {
      issues.push(`Too many arguments (expected max ${totalParams}, got ${argCount})`);
    }

    // Check argument types (basic)
    for (let i = 0; i < Math.min(argCount, newSignature.params.length); i++) {
      const expectedType = newSignature.params[i].type;
      const actualType = call.arguments[i];

      if (expectedType !== 'any' && actualType !== 'variable' && expectedType !== actualType) {
        issues.push(
          `Argument ${i + 1} type mismatch (expected ${expectedType}, got ${actualType})`,
        );
      }
    }

    if (issues.length === 0) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: issues.join('; '),
      suggestion: this.generateCallFixSuggestion(call, newSignature),
      severity: argCount < requiredParams ? 'CRITICAL' : 'HIGH',
    };
  }

  /**
   * Generate suggestion for fixing call
   */
  generateCallFixSuggestion(call, newSignature) {
    const paramNames = newSignature.params.map((p) => p.name).join(', ');
    return `Update call to: ${call.functionName}(${paramNames})`;
  }

  /**
   * Assess risk based on call sites
   */
  assessRisk(totalCalls, incompatibleCalls) {
    if (incompatibleCalls === 0) return 'NONE';
    if (incompatibleCalls > 10) return 'CRITICAL';
    if (incompatibleCalls > 5) return 'HIGH';
    if (incompatibleCalls > 0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate call graph report
   */
  generateReport(analyses) {
    const totalIncompatible = analyses.reduce((sum, a) => sum + a.incompatibleCalls, 0);
    const criticalIssues = analyses.filter((a) => a.risk === 'CRITICAL').length;

    return {
      summary: {
        functionsAnalyzed: analyses.length,
        totalCallSites: analyses.reduce((sum, a) => sum + a.totalCallSites, 0),
        incompatibleCalls: totalIncompatible,
        criticalIssues,
      },
      analyses,
      recommendation: totalIncompatible > 0 ? 'BLOCK_MERGE' : 'APPROVE',
    };
  }
}

module.exports = CallGraphAnalyzer;
