import { MockServer } from "@r35007/mock-server";
import { HAR, KIBANA, PathDetails } from '@r35007/mock-server/dist/server/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/server/types/user.types";
import { cleanDb, createSampleFiles, extractDbFromHAR, extractDbFromKibana } from '@r35007/mock-server/dist/server/utils';
import { requireData } from '@r35007/mock-server/dist/server/utils/fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { Commands, PromptAction } from './enum';
import HomePage from './HomePage';
import { Prompt } from './prompt';
import { Settings } from './Settings';
import { Utils } from './utils';

export default class MockServerExt extends Utils {

  constructor(context: vscode.ExtensionContext, output: Function) {
    super(context, output);
    this.createServer();
    this.log('Mock Server Server Initiated', "\n");
  }

  createServer = () => {
    this.mockServer = new MockServer({ root: Settings.rootPath });
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
    const editorProps = this.getEditorProps();
    if (!editorProps) throw Error("Invalid File or path");

    const { editor, document, textRange } = editorProps;

    const userData = requireData(args?.fsPath || document?.uri?.fsPath);
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

    cleanDb(db as UserTypes.Db, Settings.dbMode);

    if (!Object.keys(db).length) throw Error("Invalid Data");

    this.writeFile(
      JSON.stringify(db, null, '\t'),
      'Data Transformed Successfully',
      editor,
      document,
      textRange
    );
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
    const rootPath = stat.isFile() ? path.dirname(args.fsPath) : args.fsPath;
    Settings.rootPath = rootPath;
    Prompt.showPopupMessage(`Root Path Set to ${rootPath}`);
    this.log(`[Done] Root Path Set to ${rootPath}`);
  };

  startServer = async (fsPath?: string, port: number = Settings.port) => {
    const paths = Settings.paths;
    const dbPath = fsPath || paths.db;

    const mockServer = this.mockServer;
    const app = mockServer.app;
    const log = true;

    const config = { ...Settings.config, port };
    mockServer.setConfig(config, { log });

    const rewriters = await this.getDataFromUrl(paths.rewriters, mockServer);
    mockServer.setRewriters(rewriters, { log });

    const rewriter = mockServer.rewriter();
    app.use(rewriter);

    const defaults = mockServer.defaults();
    app.use(defaults);

    const middlewares = await this.getDataFromUrl(paths.middleware, mockServer);
    mockServer.setMiddlewares(middlewares, { log });

    mockServer.middlewares._globals?.length && app.use(mockServer.middlewares._globals);

    const injectors = await this.getDataFromUrl(paths.injectors, mockServer, true);
    mockServer.setInjectors(injectors, { log });

    const store = await this.getDataFromUrl(paths.store, mockServer);
    mockServer.setStore(store, { log });

    if (Settings.homePage) {
      const homePage = mockServer.homePage({ log });
      app.use(mockServer.config.base, homePage);
    }

    const envData = await this.getEnvData(mockServer);
    const envResources = mockServer.resources(envData, { log });
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
      const envDir = Settings.paths.envDir;
      if (envDir?.length) {
        const environmentList = [{ fileName: "none" }, ...this.getEnvironmentList(envDir)] as PathDetails[];
        if (environmentList?.length) {

          // making the selected environment to appear in first of the list
          const selectedEnv = this.storageManager.getValue("mockEnv", { fileName: "none" }) as PathDetails;
          const selectedEnvIndex = environmentList.findIndex((e) => e.fileName === selectedEnv.fileName);
          if (selectedEnvIndex >= 0) {
            environmentList.splice(selectedEnvIndex, 1);
            environmentList.unshift(selectedEnv);
          } else {
            this.storageManager.setValue("mockEnv", { fileName: "none" });
          }

          const selectedMockEnv = await Prompt.getEnvironment(environmentList);
          if (selectedMockEnv) {
            this.storageManager.setValue("mockEnv", selectedMockEnv);
            this.log(`[Done] Environment Switched to ${selectedMockEnv.fileName}`);
            vscode.commands.executeCommand(Commands.START_SERVER); // Restarts the server
          }
        } else {
          this.log(`[Error] No Environment Found`);
          Prompt.showPopupMessage('No Environment Found', PromptAction.ERROR);
        }
      } else {
        this.log(`[Error] 'mock-server.settings.paths.envDir' - Please provide a valid path here`);
        Prompt.showPopupMessage(`mock-server.settings.paths.envDir - Please provide a valid path here`, PromptAction.ERROR);
      }
    } catch (err: any) {
      this.log(`[Error] Something went wrong`);
      this.log(err);
      Prompt.showPopupMessage(`Something went wrong`, PromptAction.ERROR);
    }
  };

  getDbSnapshot = async (_args?: any) => {
    const editorProps = this.getEditorProps();
    if (!editorProps) throw Error("Invalid File or path");

    const { editor, document, textRange } = editorProps;

    const db = JSON.parse(JSON.stringify(this.mockServer.db));
    cleanDb(db);

    const snapShotPath = path.join(Settings.paths.snapshotDir || 'snapshots', `/db-${Date.now()}.json`);

    this.writeFile(
      JSON.stringify(db, null, '\t'),
      'Db Snapshot retrieved Successfully',
      editor,
      document,
      textRange,
      snapShotPath
    );
  };

  generateMockFiles = async (args?: any) => {
    await createSampleFiles(args?.fsPath || Settings.rootPath);
  };
}
