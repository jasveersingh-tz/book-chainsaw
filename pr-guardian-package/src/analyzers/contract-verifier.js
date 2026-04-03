const fs = require('fs').promises;
const { parse } = require('@typescript-eslint/parser');

/**
 * Contract Verifier
 * Validates that changes don't violate contracts/interfaces
 */
class ContractVerifier {
  constructor() {
    this.interfaces = new Map(); // interface name -> definition
    this.implementations = new Map(); // class name -> implemented interfaces
    this.typeAliases = new Map(); // type name -> definition
  }

  /**
   * Build contract map for all files
   */
  async buildContracts(files) {
    console.log(`Building contract map for ${files.length} files...`);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        await this.analyzeContracts(content, file);
      } catch (error) {
        console.warn(`Failed to analyze ${file}: ${error.message}`);
      }
    }

    console.log(
      `Contracts: ${this.interfaces.size} interfaces, ${this.implementations.size} implementations`,
    );
  }

  /**
   * Analyze contracts in a file
   */
  async analyzeContracts(content, filePath) {
    try {
      const ast = parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        loc: true,
      });

      this.traverseAST(ast, filePath);
    } catch (error) {
      // Fallback to regex
      this.analyzeContractsRegex(content, filePath);
    }
  }

  /**
   * Traverse AST for contracts
   */
  traverseAST(node, filePath) {
    if (!node || typeof node !== 'object') return;

    // Track interface declarations
    if (node.type === 'TSInterfaceDeclaration' && node.id) {
      const interfaceDef = this.extractInterface(node, filePath);
      this.interfaces.set(node.id.name, interfaceDef);
    }

    // Track type aliases
    if (node.type === 'TSTypeAliasDeclaration' && node.id) {
      const typeDef = this.extractTypeAlias(node, filePath);
      this.typeAliases.set(node.id.name, typeDef);
    }

    // Track class implementations
    if (node.type === 'ClassDeclaration' && node.id) {
      const implInfo = this.extractImplementation(node, filePath);
      if (implInfo.implements.length > 0) {
        this.implementations.set(node.id.name, implInfo);
      }
    }

    // Recurse
    for (const key in node) {
      if (key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach((c) => this.traverseAST(c, filePath));
      } else if (typeof child === 'object') {
        this.traverseAST(child, filePath);
      }
    }
  }

  /**
   * Extract interface definition
   */
  extractInterface(node, filePath) {
    const properties = [];

    if (node.body && node.body.body) {
      for (const member of node.body.body) {
        if (member.type === 'TSPropertySignature' && member.key) {
          properties.push({
            name: member.key.name,
            type: this.stringifyType(member.typeAnnotation?.typeAnnotation),
            optional: member.optional || false,
            readonly: member.readonly || false,
          });
        } else if (member.type === 'TSMethodSignature' && member.key) {
          properties.push({
            name: member.key.name,
            type: 'method',
            params:
              member.parameters?.map((p) => this.stringifyType(p.typeAnnotation?.typeAnnotation)) ||
              [],
            returnType: this.stringifyType(member.typeAnnotation?.typeAnnotation),
            optional: member.optional || false,
          });
        }
      }
    }

    return {
      name: node.id.name,
      file: filePath,
      properties,
      extends: node.extends?.map((e) => e.expression?.name) || [],
      line: node.loc?.start.line,
    };
  }

  /**
   * Extract type alias definition
   */
  extractTypeAlias(node, filePath) {
    return {
      name: node.id.name,
      file: filePath,
      type: this.stringifyType(node.typeAnnotation),
      line: node.loc?.start.line,
    };
  }

  /**
   * Extract class implementation info
   */
  extractImplementation(node, filePath) {
    const methods = [];
    const properties = [];

    if (node.body && node.body.body) {
      for (const member of node.body.body) {
        if (member.type === 'MethodDefinition' && member.key) {
          methods.push(member.key.name);
        } else if (member.type === 'PropertyDefinition' && member.key) {
          properties.push(member.key.name);
        }
      }
    }

    return {
      className: node.id.name,
      file: filePath,
      implements: node.implements?.map((i) => i.expression?.name) || [],
      methods,
      properties,
      line: node.loc?.start.line,
    };
  }

  /**
   * Stringify type
   */
  stringifyType(typeNode) {
    if (!typeNode) return 'any';

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
      case 'TSUnionType':
        return typeNode.types?.map((t) => this.stringifyType(t)).join(' | ') || 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Regex fallback
   */
  analyzeContractsRegex(content, filePath) {
    // Extract interfaces
    const interfaceRegex = /interface\s+(\w+)\s*{([^}]*)}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1];
      this.interfaces.set(name, {
        name,
        file: filePath,
        properties: [],
        extends: [],
      });
    }

    // Extract implementations
    const classRegex = /class\s+(\w+)\s+implements\s+([\w\s,]+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const interfaces = match[2].split(',').map((i) => i.trim());

      this.implementations.set(className, {
        className,
        file: filePath,
        implements: interfaces,
        methods: [],
        properties: [],
      });
    }
  }

  /**
   * Verify contracts for changed files
   */
  async verifyContracts(changedFiles) {
    const violations = [];

    for (const file of changedFiles) {
      // Check interface changes
      for (const [name, interfaceDef] of this.interfaces.entries()) {
        if (interfaceDef.file === file) {
          const implViolations = await this.checkImplementations(interfaceDef);
          violations.push(...implViolations);
        }
      }

      // Check implementation completeness
      for (const [className, impl] of this.implementations.entries()) {
        if (impl.file === file) {
          const implViolations = this.checkImplementationCompleteness(impl);
          violations.push(...implViolations);
        }
      }
    }

    return violations;
  }

  /**
   * Check if implementations satisfy interface
   */
  async checkImplementations(interfaceDef) {
    const violations = [];

    for (const [className, impl] of this.implementations.entries()) {
      if (impl.implements.includes(interfaceDef.name)) {
        // Check required properties
        const requiredProps = interfaceDef.properties.filter((p) => !p.optional);

        for (const prop of requiredProps) {
          const hasProperty =
            impl.properties.includes(prop.name) || impl.methods.includes(prop.name);

          if (!hasProperty) {
            violations.push({
              type: 'INCOMPLETE_IMPLEMENTATION',
              interface: interfaceDef.name,
              class: className,
              file: impl.file,
              missing: prop.name,
              severity: 'CRITICAL',
              message: `Class "${className}" does not implement required "${prop.name}" from interface "${interfaceDef.name}"`,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Check implementation completeness
   */
  checkImplementationCompleteness(impl) {
    const violations = [];

    for (const interfaceName of impl.implements) {
      const interfaceDef = this.interfaces.get(interfaceName);

      if (!interfaceDef) {
        violations.push({
          type: 'INTERFACE_NOT_FOUND',
          class: impl.className,
          interface: interfaceName,
          file: impl.file,
          severity: 'HIGH',
          message: `Interface "${interfaceName}" not found in project`,
        });
        continue;
      }

      // Check all required members
      const requiredMembers = interfaceDef.properties.filter((p) => !p.optional);

      for (const member of requiredMembers) {
        const hasProperty =
          impl.properties.includes(member.name) || impl.methods.includes(member.name);

        if (!hasProperty) {
          violations.push({
            type: 'MISSING_MEMBER',
            class: impl.className,
            interface: interfaceName,
            member: member.name,
            file: impl.file,
            severity: 'CRITICAL',
            message: `Missing required member "${member.name}"`,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Generate verification report
   */
  generateReport(violations) {
    const critical = violations.filter((v) => v.severity === 'CRITICAL').length;
    const high = violations.filter((v) => v.severity === 'HIGH').length;

    return {
      summary: {
        totalViolations: violations.length,
        criticalViolations: critical,
        highViolations: high,
        interfacesTracked: this.interfaces.size,
        implementationsTracked: this.implementations.size,
      },
      violations,
      recommendation: critical > 0 ? 'BLOCK_MERGE' : high > 0 ? 'WARN' : 'APPROVE',
    };
  }
}

module.exports = ContractVerifier;
