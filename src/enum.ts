/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";

export enum Commands {
  TRANSFORM_TO_MOCK_SERVER_DB = "mock-server.transformToMockServerDB",
  GENERATE_MOCK_FILES = "mock-server.generateMockFiles",
  MOCK_IT = "mock-server.mockIt", // Alias for Start Server. Shows up only on context menus.
  START_SERVER = "mock-server.startServer", // Will Restart if already running. If Full Reload it will reset and restart.
  STOP_SERVER = "mock-server.stopServer", // Will Reset
  START_WITH_NEW_PORT = "mock-server.startWithNewPort",
  SWITCH_ENVIRONMENT = "mock-server.switchEnvironment",
  GET_DB_SNAPSHOT = "mock-server.getDbSnapShot",
  OPEN_HOMEPAGE = "mock-server.openHomePage",
  SET_PORT = "mock-server.setPort",
  SET_CONFIG = "mock-server.setConfig",
  PASTE_CONFIG = "mock-server.pasteConfig"
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
