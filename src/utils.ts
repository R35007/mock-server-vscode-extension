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
import { Commands } from './enum';
import { LocalStorageService } from './LocalStorageService';
import { Prompt } from "./prompt";
import { Settings } from "./Settings";


export class Utils {
  storageManager!: LocalStorageService;
  mockServer!: MockServer;
  log!: Function;

  constructor(context: vscode.ExtensionContext, output: Function) {
    this.log = output;
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
    const userData = await this.getDataFromUrl(dbPath?.replace(/\\/g, '/'), mockServer);
    const dbData = this.isPlainObject(userData) ? normalizeDb(userData, Settings.dbMode) : {};
    return dbData;
  };

  protected getEnvData = async (mockServer?: MockServer) => {
    const environment = this.storageManager.getValue("mockEnv", "none");
    if (environment === "none") return {};

    const environmentList = this.getEnvironmentList(Settings.paths.envDir);
    const envPath = environmentList.find((e) => e.fileName === environment)!.filePath;

    const userData = await this.getDataFromUrl(envPath, mockServer);
    const envData = this.isPlainObject(userData) ? normalizeDb(userData, Settings.dbMode) : {};
    return envData;
  };

  protected getDataFromUrl = async (mockPath?: string, mockServer?: MockServer, isList: boolean = false) => {
    if (!mockPath) return;
    if (mockPath.startsWith("http")) {
      const data = await axios.get(mockPath).then(resp => resp.data).catch(_err => { });
      return data;
    } else {
      const data = requireData(mockPath, Settings.rootPath, isList);
      const env = this.storageManager.getValue("mockEnv", "none");
      return typeof data === 'function' ? await data(mockServer, env) : data;
    }
  };

  protected getEnvironmentList = (envDir: string = '') => getFilesList(envDir, [], true, false)
    .filter(file => [".har", ".json", ".js"].includes(file.extension))
    .map(file => ({ ...file, fileName: file.fileName.toLowerCase() }));

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

