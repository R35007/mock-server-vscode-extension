/* eslint-disable curly */
import { MockServer } from '@r35007/mock-server';
import { PathDetails } from '@r35007/mock-server/dist/server/types/common.types';
import { Db } from '@r35007/mock-server/dist/server/types/valid.types';
import { normalizeDb } from '@r35007/mock-server/dist/server/utils';
import { getFilesList, requireData } from "@r35007/mock-server/dist/server/utils/fetch";
import axios from 'axios';
import { watch } from 'chokidar';
import * as fs from "fs";
import { FSWatcher } from 'node:fs';
import * as path from "path";
import * as vscode from "vscode";
import { Commands, NO_ENV } from './enum';
import { LocalStorageService } from './LocalStorageService';
import { Prompt } from "./prompt";
import { Settings } from "./Settings";

export class Utils {
  storageManager!: LocalStorageService;
  mockServer!: MockServer;
  log!: Function;
  clearLog!: Function;

  constructor(context: vscode.ExtensionContext, output: Function, clearLog: Function) {
    this.log = output;
    this.clearLog = clearLog;
    if (!this.storageManager) {
      this.storageManager = new LocalStorageService(context.workspaceState);
      this.storageManager.setValue("mockEnv", "none");
    }
  }

  watcher: FSWatcher | undefined;

  protected getEditorProps = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
      const editorText = document.getText(textRange);
      const selectedText = document.getText(selection);
      return { editor, document, selection, textRange, editorText, selectedText };
    }

    return false;
  };

  protected writeFile = async (
    data: any,
    notificationText: string,
    editor: vscode.TextEditor,
    document: vscode.TextDocument,
    textRange: vscode.Range,
    fileName?: string,
  ) => {
    if (fileName) {
      const filePath = path.resolve(path.dirname(document.fileName), fileName);
      const folderPath = path.dirname(filePath) || "/";
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, data);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc, undefined, true);
      Prompt.showPopupMessage(notificationText);
    } else {
      editor.edit((editBuilder) => {
        editBuilder.replace(textRange, data);
        Prompt.showPopupMessage(notificationText);
      });
    }
  };

  protected getDbData = async (dbPath?: string, mockServer?: MockServer) => {
    const userData = await this.getDataFromUrl(dbPath?.replace(/\\/g, '/'), { mockServer });
    const dbData = this.isPlainObject(userData) ? normalizeDb(userData, Settings.dbMode) : {};
    return dbData;
  };

  protected getEnvData = async (mockServer?: MockServer) => {
    const environment = this.storageManager.getValue("environment", NO_ENV);
    if (environment.envName === NO_ENV.envName) return {};

    const result: any = {};
    const rootPath = Settings.paths.envDir;

    if (environment.db.length) {
      try {
        const promises = environment.db.map(dbPath => this.getDataFromUrl(dbPath, { mockServer, rootPath }));
        const dbList = await Promise.all(promises);
        const db = dbList.reduce((res, dbObj) => ({ ...res, ...dbObj }), {});
        result.db = db;
      } catch (err) {
        console.log(err);
      }
    }

    if (environment.injectors.length) {
      try {
        const promises = environment.injectors.map(injectorPath => this.getDataFromUrl(injectorPath, { mockServer, rootPath, isList: true }));
        const injectorsList = await Promise.all(promises);
        const injectors = injectorsList.reduce((res, injectorList) => ([...res, ...injectorList]), []);
        result.injectors = injectors;
      } catch (err) {
        console.log(err);
      }
    }

    if (environment.middlewares.length) {
      try {
        const promises = environment.middlewares.map(middlewaresPath => this.getDataFromUrl(middlewaresPath, { mockServer, rootPath }));
        const middlewaresList = await Promise.all(promises);
        const middlewares = middlewaresList.reduce((res, middlewareObj) => ({ ...res, ...middlewareObj }), {});
        result.middlewares = middlewares;
      } catch (err) {
        console.log(err);
      }
    }

    return result;
  };

  protected getDataFromUrl = async (mockPath?: string, {
    mockServer,
    isList = false,
    rootPath = Settings.rootPath
  }: { mockServer?: MockServer, isList?: boolean, rootPath?: string } = {}) => {
    if (!mockPath) return;
    if (mockPath.startsWith("http")) {
      const data = await axios.get(mockPath).then(resp => resp.data).catch(_err => { });
      return data;
    } else {
      const data = requireData(mockPath, rootPath, isList);
      const env = this.storageManager.getValue("mockEnv", NO_ENV);
      return typeof data === 'function' ? await data(mockServer, env) : data;
    }
  };

  protected getEnvironmentList = async (mockServer?: MockServer) => {
    const envDir = Settings.paths.envDir;
    if (!envDir) return [NO_ENV];

    const envFilesList = getFilesList(envDir, [], true, false)
      .filter(file => [".har", ".json", ".js"].includes(file.extension))
      .map((file: any) => ({
        envName: file.fileName,
        db: [].concat(file.filePath).filter(Boolean),
        injectors: [],
        middlewares: [],
        label: file.fileName,
        description: Settings.paths.envDir ? path.relative(Settings.paths.envDir, file.filePath) : '',
        kind: vscode.QuickPickItemKind.Default
      }))
      .filter(file =>
        !["injectors", "middlewares", "env.config"].includes(file.envName) &&
        !file.description.startsWith("injectors\\") &&
        !file.description.startsWith("middlewares\\")
      );

    let envConfig = await this.getDataFromUrl("./env.config.json", { mockServer, rootPath: envDir });
    envConfig = this.isPlainObject(envConfig) ? envConfig : {};

    const envConfigList = Object.entries(envConfig).map(([envName, envConfig]: [string, any]) => ({
      envName,
      db: [].concat(envConfig.db).filter(Boolean),
      injectors: [].concat(envConfig.injectors).filter(Boolean),
      middlewares: [].concat(envConfig.middlewares).filter(Boolean),
      label: envName,
      description: envConfig.description || "env.config.json",
      kind: vscode.QuickPickItemKind.Default
    }));

    const environmentList = [NO_ENV, ...envConfigList, ...envFilesList];

    // making the selected environment to appear in first of the list
    const selectedEnv = this.storageManager.getValue("environment", NO_ENV);
    const selectedEnvIndex = environmentList.findIndex((environment) => JSON.stringify(environment) === JSON.stringify(selectedEnv));

    if (selectedEnvIndex >= 0) {
      const existing = environmentList.splice(selectedEnvIndex, 1);
      environmentList.unshift(existing[0]);
      environmentList.unshift({
        envName: "",
        label: "recently used",
        db: [],
        injectors: [],
        middlewares: [],
        description: "",
        kind: vscode.QuickPickItemKind.Separator
      });
    } else {
      this.storageManager.setValue("environment", NO_ENV);
    }

    return environmentList;
  };

  protected restartOnChange = (db: Db = {}) => {
    // If watcher is already watching then do nothing
    if (this.watcher) return;

    const fetchPaths = Object.entries(db).map(([_key, obj]) => obj.fetch)
      .filter(Boolean)
      .filter(fetch => typeof fetch === 'string' && !fetch.startsWith("http")) as string[];

    const filesToWatch = [
      Settings.paths.db,
      Settings.paths.middleware,
      Settings.paths.injectors,
      Settings.paths.rewriters,
      Settings.paths.store,
      Settings.paths.staticDir,
      Settings.paths.envDir,
      ...Settings.watchFiles,
      ...fetchPaths
    ]
      .filter(p => !p?.startsWith("http")).filter(Boolean)
      .reduce((paths, p) => [...paths, ...getFilesList(p!)], [] as PathDetails[])
      .filter(p => p.isFile)
      .map(p => p.filePath);

    this.watcher = watch([...new Set(filesToWatch)], { ignored: Settings.ignoreFiles });
    this.watcher.on('change', (_event, _path) => {
      if (!Settings.shouldWatch) return;
      vscode.commands.executeCommand(Commands.START_SERVER); // Restarts the server
    });
  };

  protected stopWatchingChanges = async () => {
    this.watcher && await this.watcher.close();
    this.watcher = undefined;
  };

  protected isPlainObject = (obj: any) => {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  };
}

