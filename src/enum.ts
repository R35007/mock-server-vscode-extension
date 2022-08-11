/* eslint-disable @typescript-eslint/naming-convention */

export enum Commands {
  TRANSFORM_TO_MOCK_SERVER_DB = "mockServer.transformToMockServerDB",
  GENERATE_MOCK_FILES = "mockServer.generateMockFiles",
  START_SERVER = "mockServer.startServer",
  STOP_SERVER = "mockServer.stopServer",
  RESET_SERVER = "mockServer.resetServer",
  RESET_AND_RESTART = "mockServer.resetAndRestart",
  START_WITH_NEW_PORT = "mockServer.startWithNewPort",
  SWITCH_ENVIRONMENT = "mockServer.switchEnvironment",
  GET_DB_SNAPSHOT = "mockServer.getDbSnapShot",
  HOMEPAGE = "mockServer.homePage",
  SET_PORT = "mockServer.setPort",
  SET_ROOT = "mockServer.setRoot"
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
