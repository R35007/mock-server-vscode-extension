import { MockServer } from "@r35007/mock-server";
import { HAR, KIBANA } from '@r35007/mock-server/dist/server/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/server/types/user.types";
import { cleanDb, createSampleFiles, extractDbFromHAR, extractDbFromKibana } from '@r35007/mock-server/dist/server/utils';
import { requireData } from '@r35007/mock-server/dist/server/utils/fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { Commands } from './enum';
import { Prompt } from './prompt';
import { Settings } from './Settings';
import { StatusbarUi } from './StatusBarUI';
import { Utils } from './utils';

export default class MockServerExt extends Utils {

  constructor(context: vscode.ExtensionContext, output: Function) {
    super(context, output);
    this.createServer();
    StatusbarUi.init();
    this.log('Mock Server Server Initiated', "\n");
  }

  createServer = () => {
    this.mockServer = new MockServer({ root: Settings.rootPath });
  };

  destroyServer = async () => {
    await MockServer.Destroy(this.mockServer);
  };

  resetServer = async () => {
    StatusbarUi.working('Resetting...');
    await this.destroyServer();
    this.createServer();
    StatusbarUi.startServer(150, () => Prompt.showPopupMessage('Server Reset Done', 'info'));
  };

  transformToMockServerDB = async (args?: any) => {
    const writable = await this.getWritable(['.json'], Commands.TRANSFORM_TO_MOCK_SERVER_DB, args?.fsPath);
    if (writable) {
      const { fileName, editor, document, textRange } = writable;
      const userData = requireData(args?.fsPath || document?.uri?.fsPath);
      const db = extractDbFromHAR(
        userData as HAR,
        Settings.callbacks?._harEntryCallback,
        Settings.callbacks?._harDbCallback,
        Settings.iterateDuplicateRoutes,
      ) || extractDbFromKibana(
        userData as KIBANA,
        Settings.callbacks?._kibanaHitsCallback,
        Settings.callbacks?._kibanaDbCallback,
        Settings.iterateDuplicateRoutes
      ) || userData;

      cleanDb(db as UserTypes.Db);
      this.writeFile(
        JSON.stringify(db, null, '\t'),
        fileName,
        'Data Transformed Successfully',
        editor,
        document,
        textRange
      );
    } else {
      throw Error("Invalid File or path");
    }
  };

  setPort = async (_args?: any) => {
    const port = await Prompt.showInputBox('Enter Port Number', Settings.port);
    if (port) {
      Settings.port = parseInt(port);
      Prompt.showPopupMessage(`Port Number Set to ${port}`, 'info');
      this.log(`[Done] Port Number Set to ${port}`);
    }
  };

  setRoot = async (args?: any) => {
    if (!args?.fsPath) { return; }
    const stat = fs.statSync(args.fsPath);
    const rootPath = stat.isFile() ? path.dirname(args.fsPath) : args.fsPath;
    Settings.rootPath = rootPath;
    Prompt.showPopupMessage(`Root Path Set to ${rootPath}`, 'info');
    this.log(`[Done] Root Path Set to ${rootPath}`);
  };

  startServer = async (dbPath?: string) => {
    const paths = Settings.paths;
    const _dbPath = dbPath || paths.db;

    const db = (await this.getDbWithEnv(_dbPath?.replace(/\\/g, '/')));
    const injectors = await this.getDataFromUrl(paths.injectors, true);
    const middlewares = await this.getDataFromUrl(paths.middleware);
    const rewriters = await this.getDataFromUrl(paths.rewriters);
    const store = await this.getDataFromUrl(paths.store);

    this.mockServer.setConfig(Settings.config);
    await this.mockServer.launchServer(db, injectors, middlewares, rewriters, store);
    this.restartOnChange(this.restartServer, db);
  };

  stopServer = async (isRestarting?: boolean) => {
    if (this.mockServer.server) {
      await this.mockServer.stopServer();
      await this.stopWatchingChanges();
    } else {
      throw Error("No Server to Stop");
    }
  };

  restartServer = async (args?: any) => {
    if (this.mockServer.server) {
      try {
        StatusbarUi.working('Restarting...');
        this.log(`[Running] Server Restart initiated`, '\n');
        this.log(`Server Restarting...`);
        await this.stopServer(true);
        await this.startServer(args?.fsPath);
        const statusMsg = `Server Restarted at port : [${Settings.port}](http://${Settings.host}:${Settings.port})`;
        StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, 'info'));
        this.log(`[Done] ${statusMsg}`);
      } catch (error: any) {
        const statusMsg = `Server Failed to Restart. \n${error.message}`;
        StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, 'error'));
        this.log(`[Done] Server Failed to Restart`);
        this.log(error);
      }
    } else {
      try {
        StatusbarUi.working('Staring...');
        this.log(`[Running] Server Start initiated`, '\n');
        this.log(`Server Starting...`);
        await this.startServer(args?.fsPath);
        const statusMsg = `Server Started at port : [${Settings.port}](http://${Settings.host}:${Settings.port})`;
        StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, 'info'));
        this.log(`[Done] ${statusMsg}`);
      } catch (error: any) {
        const statusMsg = `Server Failed to Start. \n${error.message}`;
        StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, 'error'));
        this.log(`[Done] Server Failed to Start`);
        this.log(error);
      }
    }
  };

  switchEnvironment = async () => {
    this.log(`[Running] Switch Environment initiated`, "\n");
    this.log(`Switching Environment...`);
    try {
      const envDir = Settings.paths.envDir;
      if (envDir?.length) {
        const envList = this.getEnvironmentList(envDir);
        if (envList && envList.length) {
          const environmentList = [...new Set(['none', ...envList.map((e) => e.fileName)])];

          const mockEnv = this.storageManager.getValue("mockEnv", "none");

          // making the selected environment to appear in first of the list
          const selectedEnvIndex = environmentList.findIndex((e) => e === mockEnv);
          if (selectedEnvIndex >= 0) {
            environmentList.splice(selectedEnvIndex, 1);
            environmentList.unshift(mockEnv);
          } else {
            this.storageManager.setValue("mockEnv", "none");
          }

          const selectedMockEnv = await Prompt.getEnvironment(environmentList);
          if (selectedMockEnv) {
            this.storageManager.setValue("mockEnv", selectedMockEnv);
            this.log(`[Done] Environment Switched to ${selectedMockEnv}`);
            this.restartServer();
          }
        } else {
          this.log(`[Done] No Environment Found`);
          Prompt.showPopupMessage('No Environment Found', 'error');
        }
      } else {
        this.log(`'mock-server.settings.paths.envPath' - Please provide a valid path here`);
        Prompt.showPopupMessage(`'mock-server.settings.paths.envPath' - Please provide a valid path here`, 'error');
      }
    } catch (err: any) {
      this.log(`[Done] Something went wrong`);
      this.log(err);
      Prompt.showPopupMessage(`Something went wrong`, 'error');
    }
  };

  getDbSnapshot = async (_args?: any) => {
    const writable = await this.getWritable(['.json'], Commands.TRANSFORM_TO_MOCK_SERVER_DB, true);
    if (writable) {
      const { editor, document, textRange } = writable;
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
    } else {
      throw Error("Invalid File or path");
    }
  };

  generateMockFiles = async (args?: any) => {
    await createSampleFiles(args?.fsPath || Settings.rootPath);
  };
}
