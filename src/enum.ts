/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";

export enum Commands {
  TRANSFORM_TO_MOCK_SERVER_DB = "mock-server.transformToMockDB",
  CREATE_ADVANCED_EXAMPLES = "mock-server.createAdvancedExamples",
  START_SERVER = "mock-server.startServer",
  STOP_SERVER = "mock-server.stopServer",
  START_WITH_NEW_PORT = "mock-server.startWithNewPort",
  SWITCH_ENVIRONMENT = "mock-server.switchEnvironment",
  GET_DB_SNAPSHOT = "mock-server.getDbSnapShot",
  MAKE_REQUEST = "mock-server.makeRequest",
  OPEN_HOMEPAGE = "mock-server.openHomePage",
  SET_PORT = "mock-server.setPort",
  SET_ROOT = "mock-server.setRoot",
  SET_CONFIG = "mock-server.setConfig",
  PASTE_CONFIG = "mock-server.pasteConfig",
  CREATE_DB = "mock-server.createDb",
  CREATE_SERVER = "mock-server.createServer",
}

export enum ServerStatus {
  LOAD = 'Load',
  START = 'Start',
  STOP = 'Stop',
  RESTART = 'Restart',
  RESET = 'Reset'
}

export enum PromptAction {
  INFO = 'info',
  ERROR = 'error',
  WARNING = 'warning'
}

export const Recently_Used = {
  envName: "",
  label: "recently used",
  db: [],
  injectors: [],
  middlewares: [],
  description: "",
  kind: vscode.QuickPickItemKind.Separator
};

export const NO_ENV = {
  envName: "none",
  db: [],
  injectors: [],
  middlewares: [],
  label: "none",
  description: "",
  kind: vscode.QuickPickItemKind.Default
};

export type Environment = vscode.QuickPickItem & {
  envName: string,
  db: string[],
  injectors: string[],
  middlewares: string[],
};
