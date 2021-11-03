import { Config, User_Middleware } from "@r35007/mock-server/dist/server/model";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class Settings {

  static get configuration() {
    return vscode.workspace.getConfiguration("mock-server.settings");
  }
  static getSettings(val: string) {
    return Settings.configuration.get(val);
  }
  static setSettings(key: string, val: any, isGlobal = true) {
    return Settings.configuration.update(key, val, isGlobal);
  }
  static get port() {
    return (Settings.getSettings("port") as number) || 3000;
  }
  static set port(value: number) {
    Settings.setSettings("port", value || 3000);
  }
  static get host() {
    return (Settings.getSettings("host") as string) || 'localhost';
  }
  static get base() {
    return Settings.getSettings("base") as string;
  }
  static get id() {
    return Settings.getSettings("id") as string || 'id';
  }
  static get environment() {
    return Settings.getSettings("environment") as string || "none";
  }
  static set environment(env: string) {
    Settings.setSettings("environment", env ? env.toLowerCase() : "none");
  }
  static get defaults() {
    return Settings.getSettings("defaults") as {
      noGzip: boolean;
      noCors: boolean;
      logger: boolean;
      readOnly: boolean;
      bodyParser: boolean;
    };
  }
  static get statusBar() {
    return Settings.getSettings("statusBar") as {
      show: boolean;
      position: "Right" | "Left";
      priority: number;
    };
  }
  static get paths() {
    const root = Settings.getValidPath(Settings.getSettings("paths.root") as string, "./") ||
      vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./";
    return {
      root,
      db: Settings.getValidPath(Settings.getSettings("paths.db") as string, "db.json", root),
      middleware: Settings.getValidPath(Settings.getSettings("paths.middleware") as string, "middleware.js", root),
      injectors: Settings.getValidPath(Settings.getSettings("paths.injectors") as string, "injectors.json", root),
      store: Settings.getValidPath(Settings.getSettings("paths.store") as string, "store.json", root),
      rewriters: Settings.getValidPath(Settings.getSettings("paths.rewriters") as string, "rewriter.json", root),
      envDir: Settings.getValidPath(Settings.getSettings("paths.envDir") as string, "env", root),
      staticDir: Settings.getValidPath(Settings.getSettings("paths.staticDir") as string, "public", root),
      snapshotDir: Settings.getValidPath(Settings.getSettings("paths.snapshotDir") as string, "snapshots", root)
    }
  }
  static get middleware() {
    const middlewarePath = Settings.paths.middleware;
    if (middlewarePath) {
      delete require.cache[middlewarePath];
      return require(middlewarePath) as User_Middleware;
    }
  }
  static get entryCallback() {
    const middleware = Settings.middleware;
    if (middleware) {
      return middleware["entryCallback"] as any;
    }
  }
  static get finalCallback() {
    const middleware = Settings.middleware;
    if (middleware) {
      return middleware["finalCallback"] as any;
    }
  }
  static get reverse() {
    return Settings.getSettings("reverse") as boolean;
  }
  static get config(): Config {
    return {
      port: Settings.port,
      host: Settings.host,
      id: Settings.id,
      root: Settings.paths.root,
      base: Settings.base,
      reverse: Settings.reverse,
      staticDir: Settings.paths.staticDir || "/public",
      ...Settings.defaults
    };
  }
  static get showInfoMsg() {
    return Settings.getSettings("showInfoMsg") as boolean;
  }
  static set showInfoMsg(val: boolean) {
    Settings.setSettings("showInfoMsg", val);
  }
  static getValidPath(relativePath: string, defaults: string, rootPath?: string) {
    if (relativePath.startsWith("http")) return relativePath;
    const root = rootPath || vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./";
    const resolvedPath = path.resolve(root, relativePath?.trim() || defaults);
    if (fs.existsSync(resolvedPath)) return resolvedPath;
  }
}
