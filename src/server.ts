import { MockServer } from "@r35007/mock-server";
import { HAR } from '@r35007/mock-server/dist/server/types/common.types';
import * as ValidTypes from "@r35007/mock-server/dist/server/types/valid.types";
import { cleanDb, createSampleFiles, extractDbFromHAR } from '@r35007/mock-server/dist/server/utils';
import { requireData } from '@r35007/mock-server/dist/server/utils/fetch';
import * as fs from 'fs';
import * as path from 'path';
import { Commands } from './enum';
import { Prompt } from './prompt';
import { Settings } from './Settings';
import { StatusbarUi } from './StatusBarUI';
import { Utils } from './utils';

export default class MockServerExt extends Utils {
  mockServer!: MockServer;

  constructor() {
    super();
    this.output.appendLine('\nMock Server Server Initiated');
    this.createServer();
    StatusbarUi.init();
  }

  createServer = () => {
    this.mockServer = new MockServer({ root: Settings.rootPath });
  };

  destroyServer = async () => {
    await MockServer.Destroy(this.mockServer);
  };

  resetServer = async (isRestarting?: boolean) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Reset initiated`);
    this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Resetting`);
    try {
      StatusbarUi.working('Resetting...');
      await this.destroyServer();
      this.createServer();
      !isRestarting && StatusbarUi.startServer(150, () => Prompt.showPopupMessage('Server Reset Done', 'info'));
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Reset Done`);
    } catch (err: any) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Reset`);
      this.output.appendLine(err);
      const statsMsg = `Server Failed to Reset. \n${err.message}`;
      StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage(statsMsg, 'error'));
    }
  };

  transformToMockServerDB = async (args?: any) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Data Transform initiated`);
    const writable = await this.getWritable(['.json'], Commands.TRANSFORM_TO_MOCK_SERVER_DB, args?.fsPath);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Data Transforming...`);
      const { fileName, editor, document, textRange } = writable;
      try {
        const options = {
          reverse: Settings.reverse,
          isSnapshot: true,
        };
        const userData = requireData(args?.fsPath || document?.uri?.fsPath) as HAR;
        const db = extractDbFromHAR(
          userData,
          Settings._harEntryCallback,
          Settings._harDbCallback
        ) || userData;
        cleanDb(db);
        this.writeFile(
          JSON.stringify(db, null, '\t'),
          fileName,
          'Data Transformed Successfully',
          editor,
          document,
          textRange
        );
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Data Transformed Successfully`);
      } catch (err: any) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to Transform Data`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to Transform Data. \n${err.message}`, 'error');
      }
    }
  };

  setPort = async (_args?: any) => {
    const port = await Prompt.showInputBox('Enter Port Number', Settings.port);
    if (port) {
      Settings.port = parseInt(port);
      Prompt.showPopupMessage(`Port Number Set to ${port}`, 'info')
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Port Number Set to ${port}`);
    }
  };

  setRoot = async (args?: any) => {
    if (!args?.fsPath) { return; }
    const stat = fs.statSync(args.fsPath);
    const rootPath = stat.isFile() ? path.dirname(args.fsPath) : args.fsPath;
    Settings.rootPath = rootPath;
    Prompt.showPopupMessage(`Root Path Set to ${rootPath}`, 'info')
    this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Root Path Set to ${rootPath}`);
  };

  startServer = async (txt: 'Start' | 'Restart', dbPath?: string) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server ${txt} initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server ${txt}ing...`);
      StatusbarUi.working(`${txt}ing...`);

      const paths = Settings.paths;
      const _dbPath = dbPath || paths.db;
      const db = (await this.getDbWithEnv(_dbPath?.replace(/\\/g, '/'))) as ValidTypes.Db;

      this.mockServer.setConfig(Settings.config);

      await this.mockServer.launchServer(db, paths.injectors, paths.middleware, paths.rewriters, paths.store);

      this.restartOnChange(this.restartServer);

      const statusMsg = `Server is ${txt}ed at port : ${Settings.port}`;
      StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, 'info'));
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is ${txt}ed at port : ${Settings.port}`);
    } catch (err: any) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to ${txt}`);
      this.output.appendLine(err);
      const statusMsg = `Server Failed to ${txt}. \n ${err.message}`;
      StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, 'error'));
    }
  };

  stopServer = async (isRestarting?: boolean) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
    this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Stopping`);
    try {
      if (this.mockServer.server) {
        StatusbarUi.working('Stopping...');
        await this.mockServer.stopServer();
        await this.stopWatchingChanges();
        !isRestarting && StatusbarUi.startServer(150, () => Prompt.showPopupMessage('Server is Stopped', 'info'));
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is Stopped`);
      } else {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] No Server to Stop`);
        Prompt.showPopupMessage('No Server to Stop', 'error');
        StatusbarUi.startServer(150, () => Prompt.showPopupMessage('No Server to Stop', 'error'));
      }
    } catch (err: any) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Stop`);
      this.output.appendLine(err);
      const statsMsg = `Server Failed to Stop. \n${err.message}`;
      StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage(statsMsg, 'error'));
    }
  };

  restartServer = async (args?: any, shouldResetServer?: boolean) => {
    if (this.mockServer.server) {
      shouldResetServer ? await this.resetServer(true) : await this.stopServer(true);
      await this.startServer('Restart', args?.fsPath);
    } else {
      await this.startServer('Start', args?.fsPath);
    }
  };

  switchEnvironment = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Switch Environment initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Switching Environment...`);
      const envDir = Settings.paths.envDir;
      if (envDir?.length) {
        const envList = this.getEnvironmentList(envDir);
        if (envList && envList.length) {
          const environmentList = [...new Set(['none', ...envList.map((e) => e.fileName)])];

          // making the selected environment to appear in first of the list
          const selectedEnvIndex = environmentList.findIndex((e) => e === Settings.environment.toLowerCase());
          if (selectedEnvIndex >= 0) {
            environmentList.splice(selectedEnvIndex, 1);
            environmentList.unshift(Settings.environment.toLowerCase());
          } else {
            Settings.environment = 'none';
          }

          const env = await Prompt.getEnvironment(environmentList);
          if (env) {
            this.environment = env.toLowerCase();
            this.output.appendLine(
              `[${new Date().toLocaleTimeString()}] [Done] Environment Switched to ${this.environment}`
            );
            this.restartServer();
          }
        } else {
          this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] No Environment Found`);
          Prompt.showPopupMessage('No Environment Found', 'error');
        }
      } else {
        this.output.appendLine(
          `[${new Date().toLocaleTimeString()}] 'mock-server.settings.paths.envPath' - Please provide a valid path here`
        );
        Prompt.showPopupMessage(`'mock-server.settings.paths.envPath' - Please provide a valid path here`, 'error');
      }
    } catch (err: any) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Something went wrong`);
      this.output.appendLine(err);
      Prompt.showPopupMessage(`Something went wrong`, 'error');
    }
  };

  getDbSnapshot = async (_args?: any) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Db Snapshot initiated`);
    const writable = await this.getWritable(['.json'], Commands.TRANSFORM_TO_MOCK_SERVER_DB, true);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Getting Db Snapshot..`);
      const { editor, document, textRange } = writable;
      try {
        const db = JSON.parse(JSON.stringify(this.mockServer.db));
        cleanDb(db);
        const snapShotPath = path.join(Settings.paths.snapshotDir || 'snapshots', `/db-${Date.now()}.json`);
        this.writeFile(
          JSON.stringify(db, null, '\t'),
          snapShotPath,
          'Db Snapshot retrieved Successfully',
          editor,
          document,
          textRange
        );
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Db Snapshot retrieved Successfully`);
      } catch (err: any) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to get Db Snapshot`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to get Db Snapshot. \n${err.message}`, 'error');
      }
    }
  };

  generateMockFiles = async (args?: any) => {
    this.output.appendLine('\nCreating Samples...');
    createSampleFiles(args?.fsPath || Settings.rootPath);
    this.output.appendLine('Sample files created !');
  };
}
