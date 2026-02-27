/**
 * JSON Converter Utilities
 * Handles conversion from JSON to various formats
 */

/**
 * Convert JSON to YAML
 * @param {*} json - Parsed JSON object
 * @param {number} indent - Current indentation level
 * @returns {string} YAML string
 */
export const jsonToYAML = (json, indent = 0) => {
  const spaces = '  '.repeat(indent);
  
  if (json === null) {
    return 'null';
  }
  
  if (typeof json === 'boolean') {
    return json.toString();
  }
  
  if (typeof json === 'number') {
    return json.toString();
  }
  
  if (typeof json === 'string') {
    // Handle strings with special characters
    if (json.includes('\n') || json.includes(':') || json.includes('#') || json.includes('"')) {
      return `"${json.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    // Quote empty strings
    if (json === '') {
      return '""';
    }
    return json;
  }
  
  if (Array.isArray(json)) {
    if (json.length === 0) {
      return '[]';
    }
    return json.map(item => {
      if (typeof item === 'object' && item !== null) {
        return `-\n${jsonToYAML(item, indent + 1)}`;
      }
      return `- ${jsonToYAML(item)}`;
    }).join('\n' + spaces);
  }
  
  if (typeof json === 'object') {
    const keys = Object.keys(json);
    if (keys.length === 0) {
      return '{}';
    }
    return keys.map(key => {
      const value = json[key];
      if (typeof value === 'object' && value !== null) {
        const subYaml = jsonToYAML(value, indent + 1);
        if (subYaml.startsWith('-') || subYaml.startsWith('{') || subYaml.startsWith('[')) {
          return `${key}:\n${spaces}  ${subYaml.split('\n').join('\n' + spaces + '  ')}`;
        }
        return `${key}:\n${spaces}  ${subYaml.split('\n').join('\n' + spaces + '  ')}`;
      }
      return `${key}: ${jsonToYAML(value)}`;
    }).join('\n' + spaces);
  }
  
  return String(json);
};

/**
 * Convert JSON to XML
 * @param {*} json - Parsed JSON object
 * @param {string} rootName - Root element name
 * @returns {string} XML string
 */
export const jsonToXML = (json, rootName = 'root') => {
  const escapeXml = (str) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const isValidName = (name) => {
    // XML element names must start with letter or underscore
    return /^[a-zA-Z_][a-zA-Z0-9_\-.]*$/.test(name);
  };
  
  const convert = (obj, name) => {
    // Sanitize element name
    if (!isValidName(name)) {
      name = 'item';
    }
    
    if (obj === null) {
      return `<${name}/>`;
    }
    
    if (typeof obj !== 'object') {
      return `<${name}>${escapeXml(obj)}</${name}>`;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => convert(item, name)).join('\n');
    }
    
    const children = Object.entries(obj)
      .map(([key, value]) => convert(value, key))
      .join('\n');
    
    return `<${name}>\n${children}\n</${name}>`;
  };
  
  const xml = convert(json, rootName);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
};

/**
 * Convert JSON to TypeScript interface
 * @param {*} json - Parsed JSON object
 * @param {string} interfaceName - Name for the interface
 * @param {Set} processed - Set of processed objects (for recursion detection)
 * @returns {string} TypeScript interface string
 */
export const jsonToTypeScript = (json, interfaceName = 'Root', processed = new Set()) => {
  const interfaces = [];
  
  const getType = (obj, name, depth = 0) => {
    if (obj === null) {
      return 'null';
    }
    
    if (typeof obj !== 'object') {
      return typeof obj;
    }
    
    // Handle circular references
    if (depth > 10) {
      return 'any';
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return 'any[]';
      }
      
      // Check if all items are same type
      const types = new Set(obj.map(item => getType(item, 'Item', depth + 1)));
      
      if (types.size === 1) {
        const [type] = types;
        return `${type}[]`;
      }
      
      // Union type for mixed arrays
      return `(${Array.from(types).join(' | ')})[]`;
    }
    
    // Create interface for objects
    const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
    const properties = Object.entries(obj)
      .map(([key, value]) => {
        const type = getType(value, key, depth + 1);
        const optional = value === null ? '?' : '';
        // Handle keys with special characters
        const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `'${key}'`;
        return `  ${safeKey}${optional}: ${type};`;
      })
      .join('\n');
    
    interfaces.push(`interface ${interfaceName} {\n${properties}\n}`);
    
    return interfaceName;
  };
  
  const mainType = getType(json, interfaceName);
  
  // Remove duplicate interfaces
  const uniqueInterfaces = [...new Set(interfaces)];
  
  // Put main interface first
  const mainInterface = uniqueInterfaces.find(i => i.includes(`interface ${interfaceName}`));
  const otherInterfaces = uniqueInterfaces.filter(i => !i.includes(`interface ${interfaceName}`));
  
  const result = [];
  if (mainInterface) {
    result.push(mainInterface);
  }
  result.push(...otherInterfaces);
  
  return result.join('\n\n');
};

/**
 * Convert JSON to Python dataclass
 * @param {*} json - Parsed JSON object
 * @param {string} className - Name for the class
 * @returns {string} Python dataclass string
 */
export const jsonToPython = (json, className = 'Root') => {
  const classes = [];
  
  const getType = (obj, name) => {
    if (obj === null) {
      return 'Optional[Any]';
    }
    
    if (typeof obj === 'string') {
      return 'str';
    }
    
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'int' : 'float';
    }
    
    if (typeof obj === 'boolean') {
      return 'bool';
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return 'List[Any]';
      }
      const itemType = getType(obj[0], 'Item');
      return `List[${itemType}]`;
    }
    
    if (typeof obj === 'object') {
      const nestedClassName = name.charAt(0).toUpperCase() + name.slice(1);
      createClass(obj, nestedClassName);
      return nestedClassName;
    }
    
    return 'Any';
  };
  
  const createClass = (obj, name) => {
    const fields = Object.entries(obj)
      .map(([key, value]) => {
        const type = getType(value, key);
        const defaultVal = value === null ? ' = None' : '';
        return `    ${key}: ${type}${defaultVal}`;
      })
      .join('\n');
    
    classes.push(`@dataclass\nclass ${name}:\n${fields}`);
  };
  
  createClass(json, className);
  
  const imports = [
    'from dataclasses import dataclass',
    'from typing import Any, List, Optional'
  ];
  
  return `${imports.join('\n')}\n\n\n${classes.join('\n\n\n')}`;
};

/**
 * Generate JSON Schema from JSON
 * @param {*} json - Parsed JSON object
 * @param {string} title - Schema title
 * @returns {string} JSON Schema string
 */
export const jsonToSchema = (json, title = 'Root') => {
  const getSchema = (obj) => {
    if (obj === null) {
      return { type: 'null' };
    }
    
    if (typeof obj === 'string') {
      return { type: 'string' };
    }
    
    if (typeof obj === 'number') {
      return { 
        type: Number.isInteger(obj) ? 'integer' : 'number' 
      };
    }
    
    if (typeof obj === 'boolean') {
      return { type: 'boolean' };
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return { 
          type: 'array',
          items: {}
        };
      }
      
      // Check if all items have same schema
      const schemas = obj.map(getSchema);
      const firstSchema = JSON.stringify(schemas[0]);
      const allSame = schemas.every(s => JSON.stringify(s) === firstSchema);
      
      if (allSame) {
        return {
          type: 'array',
          items: schemas[0]
        };
      }
      
      // Use oneOf for mixed arrays
      return {
        type: 'array',
        items: {
          oneOf: schemas
        }
      };
    }
    
    if (typeof obj === 'object') {
      const properties = {};
      const required = [];
      
      for (const [key, value] of Object.entries(obj)) {
        properties[key] = getSchema(value);
        if (value !== null) {
          required.push(key);
        }
      }
      
      const schema = {
        type: 'object',
        properties
      };
      
      if (required.length > 0) {
        schema.required = required;
      }
      
      return schema;
    }
    
    return {};
  };
  
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    ...getSchema(json)
  };
  
  return JSON.stringify(schema, null, 2);
};
