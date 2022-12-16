import { lodash as _, MockServer } from "@r35007/mock-server";
import { HAR, KIBANA } from '@r35007/mock-server/dist/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/types/user.types";
import { extractDbFromHAR, extractDbFromKibana, getCleanDb } from '@r35007/mock-server/dist/utils';
import { requireData } from '@r35007/mock-server/dist/utils/fetch';
import * as jsonc from 'comment-json';
import * as fs from 'fs';
import * as fsx from "fs-extra";
import * as path from 'path';
import * as vscode from "vscode";
import { Commands, Environment, PromptAction } from './enum';
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

    const userData = jsonc.parse(fs.readFileSync(currentFilePath, "utf-8"), undefined, false) as any;

    if (!_.isPlainObject(userData) || _.isEmpty(userData)) throw Error("Invalid or empty Object");
    const isHar = userData?.log?.entries?.length > 0;
    const isKibana = userData?.rawResponse?.hits?.hits?.length > 0;
    if (!isHar && !isKibana) throw Error("Please select a HAR or Kibana object to transform");

    let transformedDb: any = {};
    const middlewares = await this.getDataFromUrl(Settings.paths.middlewares);

    if (isHar) {
      transformedDb = extractDbFromHAR(
        userData as HAR,
        middlewares?.harEntryCallback,
        middlewares?.harDbCallback,
        Settings.duplicates,
      ) || {};
    }

    if (isKibana) {
      transformedDb = extractDbFromKibana(
        userData as KIBANA,
        middlewares?.kibanaHitsCallback,
        middlewares?.kibanaDbCallback,
        Settings.duplicates
      ) || {};
    }

    const cleanDb = getCleanDb(transformedDb as UserTypes.Db, Settings.dbMode);
    if (!Object.keys(cleanDb).length) throw Error("No Routes Found");
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

  setConfig = async (args?: any) => {
    if (!args?.fsPath) return;
    const config = requireData(args.fsPath);

    if (!_.isPlainObject(config)) return Prompt.showPopupMessage(`Invalid Config File`, PromptAction.ERROR);

    const cleanObject = (obj: any) => {
      const cleanObj: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'undefined' || (_.isPlainObject(value) && _.isEmpty(value))) return;
        cleanObj[key] = value;
      });
      return cleanObj;
    };

    const paths: any = cleanObject({
      root: config.paths?.root || config.root,
      db: config.paths?.db || config.db,
      middlewares: config.paths?.middlewares || config.middlewares,
      rewriters: config.paths?.rewriters || config.rewriters,
      store: config.paths?.store || config.store,
      static: config.paths?.static || config.static,
      environment: config.paths?.environment || config.environment,
      snapshots: config.paths?.snapshots || config.snapshots,
    });

    const defaults: any = cleanObject({
      noGzip: config.defaults?.noGzip || config.noGzip,
      noCors: config.defaults?.noCors || config.noCors,
      readOnly: config.defaults?.readOnly || config.readOnly,
      logger: config.defaults?.logger || config.logger,
      bodyParser: config.defaults?.bodyParser || config.bodyParser,
      cookieParser: config.defaults?.cookieParser || config.cookieParser
    });

    const statusBar: any = cleanObject({
      show: config.statusBar?.show,
      position: config.statusBar?.position,
      priority: config.statusBar?.priority
    });

    const serverConfig = {
      // Mock Server configs
      port: config.port,
      host: config.host,
      base: config.base,
      id: config.id,
      dbMode: config.dbMode,
      reverse: config.reverse,
      log: config.log,
      defaults: _.isEmpty(defaults) ? undefined : defaults,

      // CLI configs
      paths: _.isEmpty(paths) ? undefined : paths,
      watch: config.watch,

      // VSCode Extension configs
      watchFiles: config.watchFiles,
      ignoreFiles: config.ignoreFiles,
      duplicates: config.duplicates,
      homePage: config.homePage,
      openInside: config.openInside,
      showInfoMsg: config.showInfoMsg,
      statusBar: _.isEmpty(statusBar) ? undefined : statusBar
    };

    Object.entries(serverConfig).forEach(([key, value]) => {
      Settings.setSettings(key, value, false);
    });

    Prompt.showPopupMessage(`Server Config is Set`);
    this.log(`[Done] Server Config is Set`);
    this.log("Server Configs: ", "\n");
    this.log(JSON.stringify(Settings.config, null, 2), "", true);
  };

  pasteConfig = async (args?: any) => {
    const { document, editor, textRange } = this.getEditorProps(args);
    const currentFilePath = args?.fsPath || document?.uri?.fsPath;

    if (!currentFilePath) return Prompt.showPopupMessage(`Invalid File`, PromptAction.ERROR);

    const serverConfig = {
      // Mock Server configs
      root: Settings.getSettings("paths.root"),
      port: Settings.getSettings("port"),
      host: Settings.getSettings("host"),
      base: Settings.getSettings("base"),
      id: Settings.getSettings("id"),
      dbMode: Settings.getSettings("dbMode"),
      reverse: Settings.getSettings("reverse"),
      log: Settings.getSettings("log"),
      ...Settings.defaults,

      // CLI configs
      db: Settings.getSettings("paths.db"),
      middlewares: Settings.getSettings("paths.middlewares"),
      injectors: Settings.getSettings("paths.injectors"),
      store: Settings.getSettings("paths.store"),
      rewriters: Settings.getSettings("paths.rewriters"),
      static: Settings.getSettings("paths.static"),
      environment: Settings.getSettings("paths.environment"),
      snapshots: Settings.getSettings("paths.snapshots"),
      watch: Settings.watch,

      // VSCode Extension configs
      watchFiles: Settings.getSettings("watchFiles"),
      ignoreFiles: Settings.getSettings("ignoreFiles"),
      duplicates: Settings.duplicates,
      homePage: Settings.homePage,
      openInside: Settings.openInside,
      showInfoMsg: Settings.showInfoMsg,
      statusBar: Settings.getSettings("statusBar"),
    };

    const config = [".js", ".ts"].includes(path.extname(currentFilePath))
      ? `module.exports = ${JSON.stringify(serverConfig, null, 2)}`
      : JSON.stringify(serverConfig, null, 2);

    await new Promise((resolve) => editor?.edit((editBuilder) => {
      editBuilder.replace(textRange, config);
      resolve(true);
    }));

    Prompt.showPopupMessage('Config Pasted Successfully');
  };

  startServer = async (fsPath?: string, port: number = Settings.port) => {
    const paths = Settings.paths;
    const dbPath = paths.db;

    const mockServer = this.mockServer;
    const app = mockServer.app;
    const log = true;

    const config = { ...Settings.config, port };
    mockServer.setConfig(config, { log });

    const rewriters = await this.getDataFromUrl(paths.rewriters, { mockServer });

    const rewriter = mockServer.rewriter(rewriters, { log });
    app.use(rewriter);

    const defaults = mockServer.defaults();
    app.use(defaults);

    const middlewares = await this.getDataFromUrl(paths.middlewares, { mockServer });
    mockServer.setMiddlewares(middlewares, { log });

    app.use(mockServer.middlewares.globals);

    const injectors = await this.getDataFromUrl(paths.injectors, { mockServer, isList: true });
    mockServer.setInjectors(injectors, { log });

    const store = await this.getDataFromUrl(paths.store, { mockServer });
    mockServer.setStore(store, { log });

    if (Settings.homePage) {
      const homePage = mockServer.homePage({ log });
      app.use(mockServer.config.base, homePage);
    }

    if (fsPath) {
      const environment = {
        envName: path.basename(fsPath),
        label: path.basename(fsPath),
        description: Settings.paths.environment ? path.relative(Settings.paths.environment, fsPath).replace(/\\/g, "/") : fsPath,
        db: [fsPath],
        injectors: [],
        middlewares: [],
      } as Environment;

      await this.storageManager.setValue("environment", environment);
    }
    const env = await this.getEnvData(mockServer);
    const envResources = mockServer.resources(env.db, {
      injectors: [...mockServer.injectors, ...env.injectors],
      middlewares: { ...mockServer.middlewares, ...env.middlewares },
      log: "Environment Resource"
    });
    app.use(mockServer.config.base, envResources.router);

    const dbData = await this.getDbData(dbPath, mockServer);
    const dbResources = mockServer.resources(dbData, { log });
    app.use(mockServer.config.base, dbResources.router);

    app.use(mockServer.pageNotFound);
    app.use(mockServer.errorHandler);

    await mockServer.startServer();

    this.restartOnChange(mockServer.db);
    HomePage.currentPanel?.update();
  };

  switchEnvironment = async () => {
    this.log(`[Running] Switch Environment initiated`, "\n");
    this.log(`Switching Environment...`);
    try {
      const environmentList = await this.getEnvironmentList(this.mockServer);
      const selectedEnv = await Prompt.getEnvironment(environmentList);
      if (!selectedEnv) return;
      await this.storageManager.setValue("environment", selectedEnv);
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
