import { HAR } from '@r35007/mock-server/dist/server/types/common.types';
import { Db } from '@r35007/mock-server/dist/server/types/valid.types';
import { extractDbFromHAR } from '@r35007/mock-server/dist/server/utils';
import { getFilesList, requireData } from "@r35007/mock-server/dist/server/utils/fetch";
import axios from 'axios';
import { watch } from 'chokidar';
import * as fs from "fs";
import { FSWatcher } from 'node:fs';
import * as path from "path";
import * as vscode from "vscode";
import { Commands } from './enum';
import { Prompt } from "./prompt";
import { Settings } from "./Settings";


export class Utils {
  environment = "none";

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

  protected getWritable = async (extensions: string[], action: string, noPrompt: boolean = false) => {
    const editorProps = this.getEditorProps();

    if (editorProps) {
      const { editor, document, textRange, editorText } = editorProps;

      if ((action === Commands.TRANSFORM_TO_MOCK_SERVER_DB) && !editorProps.editorText.trim().length) {
        const extension = path.extname(path.resolve(document.fileName));
        if (extensions.indexOf(extension) < 0) { return false; }
      }

      if (noPrompt) {
        return { editorText, fileName: "", editor, document, textRange };
      }

      const shouldSaveAsNewFile = await Prompt.shouldSaveAsNewFile();

      if (shouldSaveAsNewFile) {
        if (shouldSaveAsNewFile === "yes") {
          const fileName = await Prompt.getFilePath(extensions);
          if (fileName && fileName.length) {
            return { editorText, fileName, editor, document, textRange };
          }
          return false;
        } else {
          return { editorText, fileName: "", editor, document, textRange };
        }
      }
      return false;
    }
    return false;
  };

  protected writeFile = async (
    data: any,
    fileName: string,
    notificationText: string,
    editor: vscode.TextEditor,
    document: vscode.TextDocument,
    textRange: vscode.Range
  ) => {
    if (fileName.length) {
      const filePath = path.resolve(path.dirname(document.fileName), fileName);
      const folderPath = path.dirname(filePath) || "/";
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, data);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc, undefined, true);
      Prompt.showPopupMessage(notificationText, "info");
    } else {
      editor.edit((editBuilder) => {
        editBuilder.replace(textRange, data);
        Prompt.showPopupMessage(notificationText, "info");
      });
    }
  };

  protected getDbWithEnv = async (dbPath?: string) => {
    if (!dbPath) { return; }
    const environmentList = this.getEnvironmentList(Settings.paths.envDir);
    const environment = this.environment.toLowerCase();

    if (!environment.trim().length || environment === "none" || !environmentList.find((e) => e.fileName === environment)) {
      Settings.environment = "none";
      return await this.getDataFromUrl(dbPath);
    }

    Settings.environment = environment;

    const dbData = await this.getDataFromUrl(dbPath);
    const envPath = environmentList.find((e) => e.fileName === environment)!.filePath;

    const userData = requireData(envPath, Settings.rootPath) as HAR;
    let envData = extractDbFromHAR(userData, Settings._harEntryCallback, Settings._harDbCallback) || userData;
    envData = this.isPlainObject(envData) ? envData : {};

    return { ...dbData, ...envData };
  };

  protected getDataFromUrl = async (mockPath: string) => {
    if (mockPath.startsWith("http")) {
      const data = await axios.get(mockPath).then(resp => resp.data).catch(_err => { });
      return data;
    } else {
      return requireData(mockPath, Settings.rootPath);
    }
  };

  protected getEnvironmentList = (envDir: string = '') => getFilesList(envDir)
    .filter(file => [".har", ".json"].includes(file.extension))
    .map(file => ({ ...file, fileName: file.fileName.toLowerCase() }));

  protected restartOnChange = (restart: Function, db: Db = {}) => {

    const fetchPaths = Object.entries(db).map(([_key, obj]) => obj.fetch)
      .filter(Boolean)
      .filter(fetch => typeof fetch === 'string')

    const additionPaths = [...Settings.watchForChanges, ...fetchPaths]
      .filter(fetchPath => fs.existsSync(fetchPath as string || ''))
      .filter(fetchPath => fs.statSync(fetchPath as string).isFile()) as string[]

    if (!this.watcher) {
      const filesToWatch = ([
        Settings.paths.db,
        Settings.paths.middleware,
        Settings.paths.injectors,
        Settings.paths.rewriters,
        Settings.paths.store,
        Settings.paths.staticDir,
        Settings.paths.envDir,
        ...additionPaths,
      ]).filter(p => !p?.startsWith("http")).filter(Boolean) as string[];
      this.watcher = watch(filesToWatch);
      this.watcher.on('change', (_event, _path) => {
        restart();
      });
    }
  };

  protected stopWatchingChanges = async () => {
    this.watcher && await this.watcher.close();
    this.watcher = undefined;
  };

  protected isPlainObject = (obj: any) => {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  };
}

