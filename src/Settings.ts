import { DbMode } from '@r35007/mock-server/dist/server/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/server/types/user.types";
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

  static get paths() {
    const paths = {
      root: Settings.root,
      db: Settings.getValidPath(Settings.getSettings("paths.db") as string, "db.json"),
      middleware: Settings.getValidPath(Settings.getSettings("paths.middleware") as string, "middleware.js"),
      injectors: Settings.getValidPath(Settings.getSettings("paths.injectors") as string, "injectors.json"),
      store: Settings.getValidPath(Settings.getSettings("paths.store") as string, "store.json"),
      rewriters: Settings.getValidPath(Settings.getSettings("paths.rewriters") as string, "rewriter.json"),
      environment: Settings.getValidPath(Settings.getSettings("paths.environment") as string, "env"),
      static: Settings.getValidPath(Settings.getSettings("paths.static") as string, "public"),
      snapshots: Settings.getValidPath(Settings.getSettings("paths.snapshots") as string, "snapshots") || path.resolve(Settings.root, "snapshots")
    };
    return paths;
  }
  static get host() {
    return Settings.getSettings("host") as string || '';
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
  static get homePage(): boolean {
    return Settings.getSettings("homePage") as boolean;
  }
  static get openInside(): boolean {
    return Settings.getSettings("openHomePageInsideVSCode") as boolean;
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


  static get root() {
    const _root = Settings.getSettings("paths.root") as string;
    const resolvedRootPath = path.resolve((vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./"), _root);
    if (fs.existsSync(resolvedRootPath)) return resolvedRootPath;
    return path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./");
  }
  static set root(_root: string) {
    Settings.setSettings("paths", {
      ...(Settings.getSettings("paths") as object || {}),
      root: _root,
    });
  }
  static get config(): UserTypes.Config {
    const config = {
      dbMode: Settings.dbMode,
      port: Settings.port,
      host: Settings.host,
      id: Settings.id,
      root: Settings.root,
      base: Settings.base,
      reverse: Settings.reverse,
      static: Settings.paths.static || "/public",
      ...Settings.defaults
    };
    return config;
  }

  static getValidPath(relativePath: string, defaults: string) {
    if (relativePath.startsWith("http")) return relativePath?.replace(/\\/g, '/');

    const resolvedPath = path.resolve(Settings.root, relativePath?.trim() || defaults);
    if (!fs.existsSync(resolvedPath)) return;
    return resolvedPath?.replace(/\\/g, '/');
  }
}
