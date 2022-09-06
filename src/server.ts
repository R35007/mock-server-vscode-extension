import { MockServer } from "@r35007/mock-server";
import { HAR, KIBANA } from '@r35007/mock-server/dist/server/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/server/types/user.types";
import { extractDbFromHAR, extractDbFromKibana, getCleanDb } from '@r35007/mock-server/dist/server/utils';
import { requireData } from '@r35007/mock-server/dist/server/utils/fetch';
import * as fs from 'fs';
import * as fsx from "fs-extra";
import * as path from 'path';
import * as vscode from "vscode";
import { Commands, PromptAction } from './enum';
import HomePage from './HomePage';
import { Prompt } from './prompt';
import { Settings } from './Settings';
import { Utils } from './utils';

const delay = (milliSeconds: number) => new Promise(resolve => setTimeout(() => resolve(true), milliSeconds));

export default class MockServerExt extends Utils {

  constructor(context: vscode.ExtensionContext, output: Function, clearLog: Function) {
    super(context, output, clearLog);
    this.createServer();
  }

  createServer = () => {
    this.mockServer = new MockServer({ root: Settings.root });
    this.clearLog();
    this.log('Mock Server Server Initiated', "\n");
    this.log("Paths - mock-server.settings.paths: ", "\n");
    this.log(JSON.stringify(Settings.paths, null, 2), "", true);
    this.log("Server Configs: ", "\n");
    this.log(JSON.stringify(Settings.config, null, 2), "", true);
  };

  destroyServer = async () => {
    await MockServer.Destroy(this.mockServer);
    await this.stopWatchingChanges();
  };

  resetServer = async () => {
    await this.destroyServer();
    this.createServer();
    HomePage.currentPanel?.update();
  };

  transformToMockServerDB = async (args?: any) => {
    await delay(1000);
    const { document } = this.getEditorProps(args);
    const currentFilePath = args?.fsPath || document?.uri?.fsPath;

    if (!currentFilePath) throw Error("Invalid File or path");

    const userData = requireData(currentFilePath);
    const middlewares = await this.getDataFromUrl(Settings.paths.middleware);

    const db = extractDbFromHAR(
      userData as HAR,
      middlewares?._harEntryCallback,
      middlewares?._harDbCallback,
      Settings.iterateDuplicateRoutes,
    ) || extractDbFromKibana(
      userData as KIBANA,
      middlewares?._kibanaHitsCallback,
      middlewares?._kibanaDbCallback,
      Settings.iterateDuplicateRoutes
    ) || {};
    const cleanDb = getCleanDb(db as UserTypes.Db, Settings.dbMode);
    if (!Object.keys(cleanDb).length) throw Error("Invalid Data");
    await this.writeFile(currentFilePath, cleanDb, 'Data Transformed Successfully');
  };

  setPort = async (_args?: any) => {
    const port = await Prompt.showInputBox('Set Port Number', 'Set 0 if you want random port.', Settings.port);

    if (typeof port === 'undefined') return;

    Settings.port = parseInt(port);
    Prompt.showPopupMessage(`Port Number Set to ${port}`);
    this.log(`[Done] Port Number Set to ${port}`);
    return parseInt(port);
  };

  setRoot = async (args?: any) => {
    if (!args?.fsPath) return;
    const stat = fs.statSync(args.fsPath);
    const root = stat.isFile() ? path.dirname(args.fsPath) : args.fsPath;
    Settings.root = root;
    Prompt.showPopupMessage(`Root Path Set to ${root}`);
    this.log(`[Done] Root Path Set to ${root}`);
  };

  startServer = async (fsPath?: string, port: number = Settings.port) => {
    const paths = Settings.paths;
    const dbPath = fsPath || paths.db;

    const mockServer = this.mockServer;
    const app = mockServer.app;
    const log = true;

    const config = { ...Settings.config, port };
    mockServer.setConfig(config, { log });

    const rewriters = await this.getDataFromUrl(paths.rewriters, { mockServer });
    mockServer.setRewriters(rewriters, { log });

    const rewriter = mockServer.rewriter();
    app.use(rewriter);

    const defaults = mockServer.defaults();
    app.use(defaults);

    const middlewares = await this.getDataFromUrl(paths.middleware, { mockServer });
    mockServer.setMiddlewares(middlewares, { log });

    mockServer.middlewares._globals?.length && app.use(mockServer.middlewares._globals);

    const injectors = await this.getDataFromUrl(paths.injectors, { mockServer, isList: true });
    mockServer.setInjectors(injectors, { log });

    const store = await this.getDataFromUrl(paths.store, { mockServer });
    mockServer.setStore(store, { log });

    if (Settings.homePage) {
      const homePage = mockServer.homePage({ log });
      app.use(mockServer.config.base, homePage);
    }

    const env = await this.getEnvData(mockServer);
    const envResources = mockServer.resources(env.db, {
      injectors: env.injectors,
      middlewares: env.middlewares,
      log: "Environment Resource"
    });
    app.use(mockServer.config.base, envResources);

    const dbData = await this.getDbData(dbPath, mockServer);
    const dbResources = mockServer.resources(dbData, { log });
    app.use(mockServer.config.base, dbResources);

    app.use(mockServer.pageNotFound);
    app.use(mockServer.errorHandler);

    await mockServer.startServer();

    this.restartOnChange(mockServer.db);
    HomePage.currentPanel?.update();
  };

  stopServer = async () => {
    if (this.mockServer.server) {
      await this.mockServer.stopServer();
      await this.stopWatchingChanges();
    } else {
      throw Error("No Server to Stop");
    }
    HomePage.currentPanel?.update();
  };

  switchEnvironment = async () => {
    this.log(`[Running] Switch Environment initiated`, "\n");
    this.log(`Switching Environment...`);
    try {
      const environmentList = await this.getEnvironmentList(this.mockServer);
      const selectedEnv = await Prompt.getEnvironment(environmentList);
      if (!selectedEnv) return;
      this.storageManager.setValue("environment", selectedEnv);
      this.log(`[Done] Environment Switched to ${selectedEnv.envName}`);
      vscode.commands.executeCommand(Commands.START_SERVER); // Restarts the server
    } catch (err: any) {
      this.log(`[Error] Something went wrong`);
      this.log(err);
      Prompt.showPopupMessage(`Something went wrong`, PromptAction.ERROR);
    }
  };

  getDbSnapshot = async (_args?: any) => {
    await delay(1000);
    const snapShotPath = path.resolve(Settings.paths.snapshots || './snapshots', `./db-${Date.now()}.json`);
    await this.writeFile(snapShotPath, getCleanDb(this.mockServer.db), 'Db Snapshot retrieved Successfully');
  };

  generateMockFiles = async (args?: any) => {
    await delay(1000);
    fsx.copySync(path.join(__dirname, '../samples'), args?.fsPath || Settings.root);
  };
}
