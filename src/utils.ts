import { MockServer } from "@r35007/mock-server";
import { PathDetails, Routes } from '@r35007/mock-server/dist/server/model';
import { getJSON, getFilesList } from "@r35007/mock-server/dist/server/utils/fetch";
import axios from 'axios';
import { watch } from 'chokidar';
import * as fs from "fs";
import { FSWatcher } from 'node:fs';
import * as path from "path";
import * as vscode from "vscode";
import { GENERATE_ROUTES } from './enum';
import { Prompt } from "./prompt";
import { Settings } from "./Settings";


export class Utils {
  mockServer: MockServer;
  environment = "none";
  output;

  watcher: FSWatcher | undefined;

  constructor() {
    this.mockServer = new MockServer({ root: Settings.paths.root });
    this.output = vscode.window.createOutputChannel("Mock Server Log");
  }

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

  protected getWritable = async (extensions: string[], action: string) => {
    const editorProps = this.getEditorProps();

    if (editorProps) {
      const { editor, document, textRange, editorText } = editorProps;

      if ((action === GENERATE_ROUTES) && !editorProps.editorText.trim().length) {
        const extension = path.extname(path.resolve(document.fileName));
        if (extensions.indexOf(extension) < 0) return false;
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

  protected getValidRoutes = async (dbPath?: string) => {
    if(!dbPath) return;
    const environmentList = this.getEnvironmentList(Settings.paths.envDir);
    const environment = this.environment.toLowerCase();
    if (!environment.trim().length || environment === "none" || !environmentList.find((e) => e.fileName === environment)) {
      Settings.environment = "none";
      return await this.getDataFromUrl(dbPath);
    }

    Settings.environment = environment;
    const mock = await this.getDataFromUrl(dbPath);
    const envPath = environmentList.find((e) => e.fileName === environment)!.filePath;
    const env = getJSON(envPath, []);
    return { ...mock, ...env };
  };

  protected getDataFromUrl = async (mockPath: string) => {
    if (mockPath.startsWith("http")) {
      const data = await axios.get(mockPath).then(resp => resp.data).catch(_err => { });
      return data;
    } else {
      return getJSON(mockPath);
    }
  }

  protected getEnvironmentList = (envDir? : string) => {
    if (!envDir) return [];
    return this.getEnvFilesList(envDir).map((f) => ({ ...f, fileName: f.fileName.toLowerCase() }));
  };

  protected getEnvFilesList = (envDir: string) => {
    return getFilesList(envDir).map((f) => {
      if (![".har", ".json"].includes(f.extension)) return;
      try {
        const dbPath = f.filePath;
        const newDbPath = dbPath.replace(".har", ".json");
        const routes = this.mockServer.getValidRoutes(
          dbPath, 
          Settings.entryCallback, 
          Settings.finalCallback, 
          { reverse: Settings.reverse }
        );
        fs.writeFileSync(dbPath, JSON.stringify(routes, null, "\t"));
        fs.renameSync(dbPath, newDbPath);
        return { ...f, extension: ".json", filePath: newDbPath };
      } catch (err) {
        console.log(err);
        return;
      }
    }).filter(Boolean) as PathDetails[];
  };

  protected restartOnChange = (restart: Function) => {
    if (!this.watcher) {
      const filesToWatch = ([
        Settings.paths.db,
        Settings.paths.middleware,
        Settings.paths.injectors,
        Settings.paths.store,
        Settings.paths.rewriter,
        Settings.paths.staticDir,
        Settings.paths.envDir,
      ]).filter(p => !p?.startsWith("http")).filter(Boolean) as string[];

      this.watcher = watch(filesToWatch);
      this.watcher.on('change', (_event, _path) => {
        restart();
      });
    }
  }

  protected stopWatchingChanges = async () => {
    this.watcher && await this.watcher.close();
    this.watcher = undefined;
  }

  protected cleanRoutes = (routes: Routes) => {
    for(let key in routes){
      if(routes[key] && typeof routes[key] === 'object' && !Array.isArray(routes[key])){
        delete routes[key]._extension;
        delete routes[key]._isFile;
        delete routes[key]._request;
        delete routes[key]._id;
        delete routes[key].override;
      }
    }
  }
}
