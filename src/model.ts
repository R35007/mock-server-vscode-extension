import { Config, Injectors } from "@r35007/mock-server/dist/model";

export interface ExtensionProperties {
  saveAsNewFile: boolean;
  showOnStatusbar: boolean;
  filterSchema: object;
  generateMock: {
    resourceTypeFilters: string[];
    callback: any;
  };
  config: Config;
  paths: Paths;

  injectors: Injectors[];
  globals: object;
}

export interface Paths {
  rootPath: string;
  mockPath: string;
  envPath: string;
  injectorsPath: string;
  callBackPath: string;
}

export interface EnvironmentFileStats {
  fileName: string;
  filePath: string;
}
