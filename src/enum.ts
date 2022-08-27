/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";

export enum Commands {
  TRANSFORM_TO_MOCK_SERVER_DB = "mock-server.transformToMockServerDB",
  GENERATE_MOCK_FILES = "mock-server.generateMockFiles",
  START_SERVER = "mock-server.startServer", // Will Restart if already running. If Full Reload it will reset and restart.
  STOP_SERVER = "mock-server.stopServer", // Will Reset
  START_WITH_NEW_PORT = "mock-server.startWithNewPort",
  SWITCH_ENVIRONMENT = "mock-server.switchEnvironment",
  GET_DB_SNAPSHOT = "mock-server.getDbSnapShot",
  OPEN_HOMEPAGE = "mock-server.openHomePage",
  SET_PORT = "mock-server.setPort",
  SET_ROOT = "mock-server.setRoot"
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

export const NO_ENV = {
  envName: "none",
  db: [],
  injectors: [],
  middlewares: [],
  label: "none",
  description: "",
  kind: vscode.QuickPickItemKind.Default
};
