import { MockServer, lodash as _, axios, watcher } from "@r35007/mock-server";
import { PathDetails } from "@r35007/mock-server/dist/types/common.types";
import { Db, Injectors, Middlewares } from "@r35007/mock-server/dist/types/valid.types";
import { normalizeDb } from "@r35007/mock-server/dist/utils";
import { getFilesList, getStats, requireData } from "@r35007/mock-server/dist/utils/fetch";
import * as fsx from "fs-extra";
import { FSWatcher } from "node:fs";
import { performance } from "node:perf_hooks";
import * as path from "path";
import * as vscode from "vscode";
import { LocalStorageService } from "./LocalStorageService";
import { Settings } from "./Settings";
import { Commands, Environment, NO_ENV, Recently_Used } from "./enum";
import { Prompt } from "./prompt";

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
      this.storageManager.setValue("environment", NO_ENV);
    }
  }

  watcher: FSWatcher | undefined;

  protected getVariables = (filePath?: string) => {
    const file = filePath;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./";
    const pathDetail = file ? path.parse(file) : ({} as any);

    const variables = {
      workspaceFolder,
      workspaceFolderBasename: path.basename(workspaceFolder),
      currentFile: undefined,
      file,
      fileWorkspaceFolder: workspaceFolder,
      relativeFile: file ? path.relative(workspaceFolder, file) : undefined,
      relativeFileDirname: pathDetail.dir ? path.basename(pathDetail.dir) : undefined,
      fileBasename: pathDetail.base,
      fileBasenameNoExtension: pathDetail.name,
      fileDirname: pathDetail.dir,
      fileExtname: pathDetail.ext,
      pathSeparator: "/",
    };

    return variables;
  };

  protected getEditorProps = (args: any) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
      const editorText = document.getText(textRange);
      const selectedText = document.getText(selection);
      const variables = this.getVariables(document.fileName);
      return { editor, document, selection, textRange, editorText, selectedText, variables };
    }
    return { variables: this.getVariables(args?.fsPath) };
  };

  protected writeFile = async (filePath: string, data: any = {}, notificationText: string) => {
    fsx.ensureFileSync(filePath);
    fsx.writeFileSync(filePath, JSON.stringify(data, null, vscode.window.activeTextEditor?.options.tabSize || "\t"));
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, undefined, true);
    Prompt.showPopupMessage(notificationText);
  };

  protected getDbData = async (dbPath?: string, mockServer?: MockServer) => {
    const userData = await this.getDataFromUrl(dbPath?.replace(/\\/g, "/"), { mockServer });
    const dbData = _.isPlainObject(userData) ? normalizeDb(userData, Settings.dbMode) : {};
    return dbData;
  };

  protected getEnvData = async (mockServer?: MockServer) => {
    const selectedEnv = this.storageManager.getValue("environment", NO_ENV);
    const result = {
      db: {},
      injectors: [] as Injectors,
      middlewares: {} as Middlewares,
    };

    if (selectedEnv.envName === NO_ENV.envName) return result;

    const root = Settings.paths.environment;

    if (selectedEnv.db.length) {
      try {
        const promises = selectedEnv.db.map((dbPath) => this.getDataFromUrl(dbPath, { mockServer, root }));
        const dbList = await Promise.all(promises);
        const db = dbList.filter(Boolean).reduce((res, dbObj) => ({ ...res, ...dbObj }), {});
        result.db = db;
      } catch (err) {
        console.log(err);
      }
    }

    if (selectedEnv.injectors.length) {
      try {
        const promises = selectedEnv.injectors.map((injectorPath) => this.getDataFromUrl(injectorPath, { mockServer, root, isList: true }));
        const injectorsList = await Promise.all(promises);
        const injectors = injectorsList.filter(Boolean).reduce((res, injectorList) => [...res, ...injectorList], []);
        result.injectors = injectors;
      } catch (err) {
        console.log(err);
      }
    }

    if (selectedEnv.middlewares.length) {
      try {
        const promises = selectedEnv.middlewares.map((middlewaresPath) => this.getDataFromUrl(middlewaresPath, { mockServer, root }));
        const middlewaresList = await Promise.all(promises);
        const middlewares = middlewaresList.filter(Boolean).reduce((res, middlewareObj) => ({ ...res, ...middlewareObj }), {});
        result.middlewares = middlewares;
      } catch (err) {
        console.log(err);
      }
    }

    return result;
  };

  protected getDataFromUrl = async (
    mockPath?: string,
    { mockServer, isList = false, root = Settings.root }: { mockServer?: MockServer; isList?: boolean; root?: string } = {}
  ) => {
    if (!mockPath) return;
    if (mockPath.startsWith("http")) {
      const data = await axios
        .get(mockPath)
        .then((resp) => resp.data)
        .catch((_err) => {});
      return data;
    } else {
      const stat = getStats(mockPath);
      if (!stat) return {};
      let data = {};
      if (stat.isFile && stat.extension.endsWith("js")) {
        data = await import(`${mockPath}?update=${Date.now()}`)
          .then((data) => data?.default || data)
          .catch((_) => requireData(mockPath, { root, isList }));
      } else {
        data = requireData(mockPath, { root, isList });
      }
      const env = this.storageManager.getValue("environment", NO_ENV);
      return typeof data === "function" ? await data(mockServer, env) : data;
    }
  };

  protected getEnvironmentList = async (mockServer?: MockServer): Promise<Environment[]> => {
    const environmentFolderPath = Settings.paths.environment;
    const selectedEnv = this.storageManager.getValue("environment", NO_ENV);

    if (!environmentFolderPath) {
      if (selectedEnv.envName !== NO_ENV.envName) return [Recently_Used, selectedEnv, NO_ENV];
      return [Recently_Used, NO_ENV];
    }

    const defaultInjectors = [
      "./injectors/index.js",
      "./injectors/index.json",
      "./injectors/index.jsonc",
      "./injectors.js",
      "./injectors.json",
      "./injectors.jsonc",
    ];
    const defaultMiddlewares = ["./middlewares/index.js", "./middlewares.js"];

    const envFilesList = getFilesList(environmentFolderPath, { onlyIndex: false })
      .filter((file) => [".har", ".json", ".jsonc", ".js"].includes(file.extension))
      .map((file: any) => ({
        envName: file.fileName,
        db: [].concat(file.filePath).filter(Boolean),
        injectors: defaultInjectors,
        middlewares: defaultMiddlewares,
        description: Settings.paths.environment
          ? path.relative(Settings.paths.environment, file.filePath).replace(/\\/g, "/")
          : file.fileName,
        label: file.fileName + file.extension,
        kind: vscode.QuickPickItemKind.Default,
      }))
      .filter(
        (file) =>
          !["injectors", "middlewares", "env-config"].includes(file.envName) &&
          !file.description.startsWith("injectors") &&
          !file.description.startsWith("middlewares")
      );

    envFilesList.unshift({
      envName: "",
      label: "Db Files",
      db: [],
      injectors: [],
      middlewares: [],
      description: "",
      kind: vscode.QuickPickItemKind.Separator,
    });

    let envConfigJson = await this.getDataFromUrl("./env-config.json", { mockServer, root: environmentFolderPath });
    envConfigJson = _.isPlainObject(envConfigJson) ? envConfigJson : {};
    let envConfigJsonc = await this.getDataFromUrl("./env-config.jsonc", { mockServer, root: environmentFolderPath });
    envConfigJsonc = _.isPlainObject(envConfigJsonc) ? envConfigJsonc : {};
    let envConfigJs = await this.getDataFromUrl("./env-config.js", { mockServer, root: environmentFolderPath });
    envConfigJs = _.isPlainObject(envConfigJs) ? envConfigJs : {};

    const envConfig = { ...envConfigJsonc, ...envConfigJson, ...envConfigJs };

    const envConfigList = Object.entries(envConfig).map(([envName, envConfig]: [string, any]) => ({
      envName,
      db: [].concat(envConfig.db).filter(Boolean),
      injectors: envConfig.injectors !== "undefined" ? [].concat(envConfig.injectors).filter(Boolean) : defaultInjectors,
      middlewares: envConfig.middlewares !== "undefined" ? [].concat(envConfig.middlewares).filter(Boolean) : defaultMiddlewares,
      label: envName,
      description: envConfig.description || envName,
      kind: vscode.QuickPickItemKind.Default,
    }));

    envConfigList.unshift({
      envName: "",
      label: "Environments",
      db: [],
      injectors: [],
      middlewares: [],
      description: "",
      kind: vscode.QuickPickItemKind.Separator,
    });

    const environmentList = [NO_ENV, ...envConfigList, ...envFilesList];

    // making the selected environment to appear in first of the list
    if (selectedEnv && selectedEnv.envName !== NO_ENV.envName) {
      environmentList.unshift(selectedEnv);
    } else {
      this.storageManager.setValue("environment", NO_ENV);
    }

    environmentList.unshift(Recently_Used);

    return environmentList;
  };

  protected restartOnChange = (args: any = {}, db: Db = {}) => {
    // If watcher is already watching then do nothing
    if (this.watcher) return;

    if (args.fsPath && args.serveStatic) {
      const staticFolder = fsx.statSync(args.fsPath).isDirectory() ? args.fsPath : path.dirname(args.fsPath);
      this.watcher = watcher.watch(staticFolder, { ignored: Settings.ignoreFiles });
      this.watcher.on("change", (changedFile, _event) => {
        if (!Settings.watch) return;
        this.log(`[Modified] ${changedFile}`, "\n");
        vscode.commands.executeCommand(Commands.START_SERVER, { fsPath: args.fsPath, serveStatic: args.serveStatic }); // Restarts the server
      });
      return;
    }

    const fetchPaths = Object.entries(db)
      .map(([_key, obj]) => obj.fetch)
      .filter(Boolean)
      .filter((fetch) => typeof fetch === "string" && !fetch.startsWith("http"))
      .map((fetchPath) => path.resolve(Settings.root, fetchPath as string)) as string[];

    const selectedEnvironment = this.storageManager.getValue("environment", NO_ENV);

    const filesToWatch = [
      Settings.paths.db,
      Settings.paths.middlewares,
      Settings.paths.injectors,
      Settings.paths.rewriters,
      Settings.paths.store,
      Settings.paths.static,
      Settings.paths.environment,
      ...Settings.watchFiles,
      ...fetchPaths,
      ...[].concat(selectedEnvironment.db),
      ...[].concat(selectedEnvironment.injectors),
      ...[].concat(selectedEnvironment.middlewares),
    ];

    const filteredPaths = filesToWatch
      .filter((p) => !p?.startsWith("http"))
      .filter(Boolean)
      .reduce((paths, p) => [...paths, ...getFilesList(p!)], [] as PathDetails[])
      .filter((p) => p.isFile)
      .map((p) => p.filePath);

    this.watcher = watcher.watch([...new Set(filteredPaths)], { ignored: Settings.ignoreFiles });
    this.watcher.on("change", (changedFile, _event) => {
      if (!Settings.watch) return;
      this.log(`[Modified] ${changedFile}`, "\n");
      vscode.commands.executeCommand(Commands.START_SERVER, { fsPath: args.fsPath, serveStatic: args.serveStatic }); // Restarts the server
    });
  };

  protected stopWatchingChanges = async () => {
    this.watcher && (await this.watcher.close());
    this.watcher = undefined;
  };

  protected endpointsQuickPick = async (endpoints: vscode.QuickPickItem[] = []) => {
    const disposables: vscode.Disposable[] = [];

    const editRequest = {
      iconPath: new vscode.ThemeIcon("pencil"),
      tooltip: "Edit selected comparison code",
    };

    const pick: vscode.QuickPickItem | undefined = await new Promise((resolve) => {
      let isResolved = false;
      const quickPick = vscode.window.createQuickPick();
      quickPick.title = "Make Request";
      quickPick.placeholder = "Please select a endpoint to make a get request";
      quickPick.matchOnDescription = false;
      quickPick.canSelectMany = false;
      quickPick.items = endpoints;
      quickPick.matchOnDetail = false;
      quickPick.buttons = [editRequest];

      disposables.push(
        quickPick.onDidAccept(() => {
          const selection = quickPick.activeItems[0];
          if (!isResolved) {
            resolve(selection);
            isResolved = true;
          }
          quickPick.dispose();
        }),
        quickPick.onDidChangeValue(() => {
          // add a new custom request to the pick list as the first item
          if (!endpoints.map((cc) => cc.label).includes(quickPick.value)) {
            const newItems = quickPick.value ? [{ label: quickPick.value, description: "custom request" }, ...endpoints] : endpoints;
            quickPick.items = newItems;
          }
        }),
        quickPick.onDidHide(() => {
          if (!isResolved) {
            resolve(undefined);
            isResolved = true;
          }
          quickPick.dispose();
        }),
        quickPick.onDidTriggerButton((_item) => {
          quickPick.value = quickPick.activeItems[0].label;
        })
      );

      quickPick.show();
    });

    disposables.forEach((d) => d.dispose());

    return pick;
  };

  protected makeGetRequest = async (url: string) => {
    const start = performance.now();
    try {
      const response = await axios.get(url);
      const responseTime = (performance.now() - start).toFixed(2);
      const data =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data, undefined, vscode.window.activeTextEditor?.options.tabSize || "\t");
      let result = `// ${url}\n`; // add Url to result
      result += `// Status: ${response.status || ""} ${response.statusText || ""}\n`; // add Status to result
      result += `// Time: ${response.headers?.["x-response-time"] || responseTime}\n`; // add Time to result
      result += `// Response:\n`; // add Response to result
      result += data;
      return result;
    } catch (error: any) {
      const response = error?.response || {};
      const responseTime = (performance.now() - start).toFixed(2);
      const data =
        typeof response?.data === "string"
          ? error?.response?.data
          : JSON.stringify(response?.data || "", undefined, vscode.window.activeTextEditor?.options.tabSize || "\t");
      let result = `// ${url}\n`; // add Url to result
      result += `// Status: ${response.status || ""} ${response.statusText || ""}\n`; // add Status to result
      result += `// Time: ${response.headers?.["x-response-time"] || responseTime}\n`; // add Time to result
      result += `// Error: ${error.message}\n`; // add Status to result
      result += `// Response:\n`; // add Response to result
      result += data;
      return result;
    }
  };
}
