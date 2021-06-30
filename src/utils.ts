import { MockServer } from "@r35007/mock-server";
import { HAR, TransformHARConfig } from "@r35007/mock-server/dist/model";
import axios from 'axios';
import { watch } from 'chokidar';
import * as fs from "fs";
import { FSWatcher } from 'node:fs';
import * as path from "path";
import * as vscode from "vscode";
import { generateMockID } from "./enum";
import { Prompt } from "./prompt";
import { Settings } from "./Settings";


export class Utils {
  protected mockServer: MockServer;
  protected environment = "none";
  protected output;

  watcher: FSWatcher | undefined;

  constructor() {
    const workSpaceFolderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "./";
    this.mockServer = new MockServer(undefined, { rootPath: workSpaceFolderPath, throwError: true });
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

      if ((action === generateMockID) && !editorProps.editorText.trim().length) {
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

  protected getJSON = async (mockPath: string) => {
    const environmentList = this.getEnvironmentList();
    const environment = this.environment.toLowerCase();
    if (!environment.trim().length || environment === "none" || !environmentList.find((e) => e.fileName === environment)) {
      Settings.environment = "none";
      return await this.getDataFromUrl(mockPath);
    }

    Settings.environment = environment;
    const mock = await this.getDataFromUrl(mockPath);
    const envPath = environmentList.find((e) => e.fileName === environment)!.filePath;
    const env = this.mockServer.getJSON(envPath, []);
    return { ...mock, ...env };
  };

  protected getDataFromUrl = async (mockPath: string) =>{
    if(mockPath.startsWith("http")){
      const data = await axios.get(mockPath).then(resp => resp.data).catch(_err => {});
      return data;
    }else{
      return this.mockServer.getJSON(mockPath);
    }
  }

  protected getEnvironmentList = () => {
    const filesList = this.convertHARtoMock();
    const envList = filesList.filter((f) => f.extension === ".json").map((f) => ({ ...f, fileName: f.fileName.toLowerCase() }));
    return envList;
  };

  protected convertHARtoMock = () => {
    const filesList = this.mockServer.getFilesList(Settings.envPath);
    const jsonList = filesList.map((f) => {
      if (f.extension === ".har") {
        try {
          const harPath = f.filePath;
          const newPath = f.filePath.replace(".har", ".json");
          const config: TransformHARConfig = {
            routesToLoop: Settings.routesToLoop,
            routesToGroup: Settings.routesToGroup,
            routeRewrite: Settings.routeRewrite,
            excludeRoutes: Settings.excludeRoutes
          }
          const newMock = this.mockServer.generateMockFromHAR(harPath, config, Settings.entryCallback, Settings.finalCallback);
          fs.writeFileSync(harPath, JSON.stringify(newMock, null, "\t"));
          fs.renameSync(harPath, newPath);
          return { ...f, extension: ".json", filePath: newPath };
        } catch (err) {
          console.log(err);
          return f;
        }
      }

      return f;
    });

    return jsonList;
  };

  protected restartOnChange = (restart: Function) => {
    if(!this.watcher) {
      const filesToWatch = ([
        Settings.mockPath || '',
        Settings.envPath || '',
        Settings.middlewarePath || '',
        Settings.injectorsPath || '',
        Settings.staticPath || ''
      ]).filter(p => !p.startsWith("http")).filter(Boolean);
  
      this.watcher = watch(filesToWatch);
      this.watcher.on('change', (event, path) => {
        restart();
      });
    }
  }

  protected stopWatchingChanges = async () => {
    this.watcher && await this.watcher.close();
    this.watcher = undefined;
  }
}
