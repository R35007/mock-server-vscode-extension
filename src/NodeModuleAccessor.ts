export enum NodeModulesKeys {
  public,
}

export interface NodeModulesValue {
  sourcePath: string[];
  destinationPath: string[];
  fileName: string;
  includeFolder?: boolean;
}

export class NodeModulesAccessor {
  static readonly outputPath = 'dist';

  private static readonly pathMapping = new Map<NodeModulesKeys, NodeModulesValue>([
    [
      NodeModulesKeys.public,
      {
        sourcePath: ['node_modules', '@r35007/', 'mock-server', 'public'],
        destinationPath: ['../', 'public'],
        fileName: 'index.html',
        includeFolder: true
      },
    ]
  ]);

  static getPathToOutputFile(key: NodeModulesKeys): string[] {
    const path = this.getMappedValue(key);
    return [this.outputPath, ...path.destinationPath, path.fileName];
  }

  static getPathToNodeModulesFile(key: NodeModulesKeys): NodeModulesValue {
    return this.getMappedValue(key);
  }

  private static getMappedValue(key: NodeModulesKeys): NodeModulesValue {
    const value = this.pathMapping.get(key);
    if (!value) {
      throw Error(`Path to "${key}" is not mapped.`);
    }
    return value;
  }
}
