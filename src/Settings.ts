import { DbMode } from '@r35007/mock-server/dist/server/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/server/types/user.types";
import * as fs from "fs";
import * as ip from "ip";
import * as path from "path";
import * as vscode from "vscode";

export class Settings {

  static pathsLog = vscode.window.createOutputChannel("Mock Server Paths Log");
  static configLog = vscode.window.createOutputChannel("Mock Server Config Log");

  static get configuration() {
    return vscode.workspace.getConfiguration("mock-server.settings");
  }
  static getSettings(val: string) {
    return Settings.configuration.get(val);
  }
  static setSettings(key: string, val: any, isGlobal = true) {
    return Settings.configuration.update(key, val, isGlobal);
  }

  static get paths() {
    Settings.pathsLog.clear();
    const paths = {
      root: Settings.rootPath,
      db: Settings.getValidPath('db', Settings.getSettings("paths.db") as string, "db.json"),
      middleware: Settings.getValidPath('middleware', Settings.getSettings("paths.middleware") as string, "middleware.js"),
      injectors: Settings.getValidPath('injectors', Settings.getSettings("paths.injectors") as string, "injectors.json"),
      store: Settings.getValidPath('store', Settings.getSettings("paths.store") as string, "store.json"),
      rewriters: Settings.getValidPath('rewriters', Settings.getSettings("paths.rewriters") as string, "rewriter.json"),
      envDir: Settings.getValidPath('envDir', Settings.getSettings("paths.envDir") as string, "env"),
      staticDir: Settings.getValidPath('staticDir', Settings.getSettings("paths.staticDir") as string, "public"),
      snapshotDir: Settings.getValidPath('snapshotDir', Settings.getSettings("paths.snapshotDir") as string, "snapshots") || path.resolve(Settings.rootPath, "snapshots")
    };
    Settings.pathsLog.appendLine("\n");
    Settings.pathsLog.appendLine(JSON.stringify(paths, null, 2));
    return paths;
  }
  static get host() {
    const host = Settings.getSettings("host") as string || '';
    return host?.trim()?.length ? host : ip.address();
  }
  static get port() {
    return (Settings.getSettings("port") as number);
  }
  static set port(value: number) {
    Settings.setSettings("port", value);
  }
  static get base() {
    return Settings.getSettings("base") as string;
  }
  static get id() {
    return Settings.getSettings("id") as string || 'id';
  }
  static get dbMode(): DbMode {
    return Settings.getSettings("dbMode") as DbMode || "mock";
  }
  static get defaults() {
    return Settings.getSettings("defaults") as {
      noGzip: boolean;
      noCors: boolean;
      logger: boolean;
      readOnly: boolean;
      bodyParser: boolean;
      cookieParser: boolean;
    };
  }
  static get reverse() {
    return Settings.getSettings("reverse") as boolean;
  }
  static get iterateDuplicateRoutes() {
    return Settings.getSettings("iterateDuplicateRoutes") as boolean;
  }
  static get watchFiles(): string[] {
    return Settings.getSettings("watchFiles") as string[] || [];
  }
  static get ignoreFiles(): string[] {
    return Settings.getSettings("ignoreFiles") as string[] || [];
  }
  static get shouldWatch(): boolean {
    return Settings.getSettings("watchForChanges") as boolean;
  }
  static get fullReload(): boolean {
    return Settings.getSettings("fullReload") as boolean;
  }
  static get showInfoMsg() {
    return Settings.getSettings("showInfoMsg") as boolean;
  }
  static set showInfoMsg(val: boolean) {
    Settings.setSettings("showInfoMsg", val);
  }
  static get statusBar() {
    return Settings.getSettings("statusBar") as {
      show: boolean;
      position: "Right" | "Left";
      priority: number;
    };
  }


  static get rootPath() {
    const rootPath = Settings.getSettings("paths.root") as string;
    const resolvedRootPath = path.resolve((vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./"), rootPath);
    if (!fs.existsSync(resolvedRootPath)) {
      Settings.pathsLog.appendLine(`Invalid root Path : ` + resolvedRootPath);
      return path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./");
    }
    return resolvedRootPath;
  }
  static set rootPath(root: string) {
    Settings.setSettings("paths", {
      ...(Settings.getSettings("paths") as object || {}),
      root,
    });
  }
  static get config(): UserTypes.Config {
    const config = {
      mode: Settings.dbMode,
      port: Settings.port,
      host: Settings.host,
      id: Settings.id,
      root: Settings.rootPath,
      base: Settings.base,
      reverse: Settings.reverse,
      staticDir: Settings.paths.staticDir || "/public",
      ...Settings.defaults
    };
    Settings.configLog.clear();
    Settings.configLog.appendLine(JSON.stringify(config, null, 2));
    return config;
  }

  static getValidPath(type: string, relativePath: string, defaults: string) {
    if (relativePath.startsWith("http")) return relativePath?.replace(/\\/g, '/');

    const resolvedPath = path.resolve(Settings.rootPath, relativePath?.trim() || defaults);
    if (!fs.existsSync(resolvedPath)) {
      Settings.pathsLog.appendLine(`Invalid ${type} Path : ` + resolvedPath);
      return;
    }

    Settings.pathsLog.appendLine(`${type} Path : ` + resolvedPath);
    return resolvedPath?.replace(/\\/g, '/');
  }
}
