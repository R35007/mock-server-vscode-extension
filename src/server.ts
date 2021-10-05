import { Db } from '@r35007/mock-server/dist/server/model';
import { createSampleFiles, getDbSnapShot } from '@r35007/mock-server/dist/server/utils';
import { TRANSFORM_TO_MOCK_SERVER_DB } from './enum';
import { Prompt } from './prompt';
import { Settings } from './Settings';
import { StatusbarUi } from './StatusBarUI';
import { Utils } from './utils';
import * as path from 'path';

export default class MockServer extends Utils {
  constructor() {
    super();
    this.output.appendLine('\nMock Server Server Initiated');
    StatusbarUi.init();
  }

  transformToMockServerDB = async (args?: any) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Data Transform initiated`);
    const writable = await this.getWritable(['.json'], TRANSFORM_TO_MOCK_SERVER_DB, args?.fsPath);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Data Transforming...`);
      const { fileName, editor, document, textRange } = writable;
      try {
        const options = {
          reverse: Settings.reverse,
          isSnapshot: true,
        };
        const db = this.mockServer.getValidDb(
          args?.fsPath || document?.uri?.fsPath,
          [],
          options,
          Settings.entryCallback,
          Settings.finalCallback
        );
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

  startServer = async (txt: string, dbPath?: string) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server ${txt} initiated`);
    try {
      const paths = Settings.paths;
      const _dbPath = dbPath || paths.db;
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server ${txt}ing...`);
      StatusbarUi.working(`${txt}ing...`);

      const db = (await this.getDbWithEnv(_dbPath)) as Db;
      this.mockServer.setConfig(Settings.config);
      await this.mockServer.launchServer(db, paths.middleware, paths.injectors, paths.rewriters, paths.store);
      this.restartOnChange(this.restartServer);
      const statusMsg = `Server is ${txt}ed at port : ${Settings.port}`;
      StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, 'info'));
      this.output.appendLine(
        `[${new Date().toLocaleTimeString()}] [Done] Server is ${txt}ed at port : ${Settings.port}`
      );
    } catch (err: any) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to ${txt}`);
      this.output.appendLine(err);
      const statusMsg = `Server Failed to ${txt}. \n ${err.message}`;
      StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, 'error'));
    }
  };

  stopServer = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Stopping`);
      if (this.mockServer.server) {
        StatusbarUi.working('Stopping...');
        await this.mockServer.stopServer();
        await this.stopWatchingChanges();
        StatusbarUi.startServer(150, () => Prompt.showPopupMessage('Server is Stopped', 'info'));
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

  restartServer = async (args?: any) => {
    if (this.mockServer.server) {
      try {
        this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Stopping`);
        StatusbarUi.working('Stopping...');
        await this.mockServer.stopServer();
        await this.stopWatchingChanges();
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Stopped`);
        await this.startServer('Restart', args?.fsPath);
      } catch (err: any) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Stop`);
        StatusbarUi.stopServer(0, Settings.port);
        this.output.appendLine(err);
      }
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

  getDbSnapshot = async (args?: any) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Db Snapshot initiated`);
    const writable = await this.getWritable(['.json'], TRANSFORM_TO_MOCK_SERVER_DB, true);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Getting Db Snapshot..`);
      const { editor, document, textRange } = writable;
      try {
        const db = JSON.parse(JSON.stringify(this.mockServer.db));
        const snapShot = getDbSnapShot(db);
        const snapShotPath =
          args?.fsPath || path.join(Settings.paths.snapshotDir || 'snapshots', `/db-${Date.now()}.json`);
        this.writeFile(
          JSON.stringify(snapShot, null, '\t'),
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
    createSampleFiles(args?.fsPath || Settings.paths.root);
    this.output.appendLine('Sample files created !');
  };
}
