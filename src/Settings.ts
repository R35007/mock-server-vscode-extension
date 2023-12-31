import { DbMode } from '@r35007/mock-server/dist/types/common.types';
import * as UserTypes from "@r35007/mock-server/dist/types/user.types";
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
      db: Settings.getAbsolutePath(Settings.getSettings("paths.db") as string ?? "./db.json"),
      middlewares: Settings.getAbsolutePath(Settings.getSettings("paths.middlewares") as string ?? "./middlewares.js"),
      injectors: Settings.getAbsolutePath(Settings.getSettings("paths.injectors") as string ?? "./injectors.json"),
      store: Settings.getAbsolutePath(Settings.getSettings("paths.store") as string ?? "./store.json"),
      rewriters: Settings.getAbsolutePath(Settings.getSettings("paths.rewriters") as string ?? "./rewriters.json"),
      environment: Settings.getAbsolutePath(Settings.getSettings("paths.environment") as string ?? "./env"),
      static: Settings.getAbsolutePath(Settings.getSettings("paths.static") as string) || "",
      snapshots: Settings.getAbsolutePath(Settings.getSettings("paths.snapshots") as string) ?? "./snapshots"
    };
    return paths;
  }

  static get relativePaths() {
    const paths = {
      root: Settings.root,
      db: Settings.getRelativePath(Settings.getSettings("paths.db") as string ?? "./db.json"),
      middlewares: Settings.getRelativePath(Settings.getSettings("paths.middlewares") as string ?? "./middlewares.js"),
      injectors: Settings.getRelativePath(Settings.getSettings("paths.injectors") as string ?? "./injectors.json"),
      store: Settings.getRelativePath(Settings.getSettings("paths.store") as string ?? "./store.json"),
      rewriters: Settings.getRelativePath(Settings.getSettings("paths.rewriters") as string ?? "./rewriters.json"),
      environment: Settings.getRelativePath(Settings.getSettings("paths.environment") as string ?? "./env"),
      static: Settings.getRelativePath(Settings.getSettings("paths.static") as string) || "",
      snapshots: Settings.getRelativePath(Settings.getSettings("paths.snapshots") as string) ?? "./snapshots"
    };
    return paths;
  }

  static get host() {
    return Settings.getSettings("host") as string || '';
  }
  static get port() {
    return (Settings.getSettings("port") as number) || 0;
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
      noCache: boolean;
      logger: boolean;
      readOnly: boolean;
      bodyParser: boolean;
      cookieParser: boolean;
    };
  }
  static get reverse() {
    return Settings.getSettings("reverse") as boolean;
  }
  static get duplicates() {
    return Settings.getSettings("duplicates") as boolean;
  }
  static get watchFiles(): string[] {
    return Settings.getSettings("watchFiles") as string[] || [];
  }
  static get ignoreFiles(): string[] {
    return Settings.getSettings("ignoreFiles") as string[] || [];
  }
  static get watch(): boolean {
    return Settings.getSettings("watch") as boolean;
  }
  static get log(): boolean {
    return Settings.getSettings("log") as boolean;
  }
  static get homePage(): boolean {
    return Settings.getSettings("homePage") as boolean;
  }
  static get openInside(): boolean {
    return Settings.getSettings("openInside") as boolean;
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
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "./";
    const resolvedRootPath = path.resolve(workspaceFolder, _root);
    if (fs.existsSync(resolvedRootPath)) return resolvedRootPath.replace(/\\/g, '/');
    return path.resolve(workspaceFolder).replace(/\\/g, '/');
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
      log: Settings.log,
      static: Settings.paths.static,
      ...Settings.defaults
    };
    return config;
  }

  static getAbsolutePath(relativePath: string): string | undefined {
    if (!relativePath) return;
    if (relativePath.startsWith("http")) return relativePath?.replace(/\\/g, '/');

    const resolvedPath = path.resolve(Settings.root, relativePath?.trim());
    if (!fs.existsSync(resolvedPath)) return;
    return resolvedPath?.trim()?.replace(/\\/g, '/');
  }

  static getRelativePath(relativePath: string): string | undefined {
    if (!relativePath) return;
    if (relativePath.startsWith("http")) return relativePath?.replace(/\\/g, '/');

    const resolvedPath = path.resolve(Settings.root, relativePath?.trim());
    if (!fs.existsSync(resolvedPath)) return;
    return relativePath?.trim()?.replace(/\\/g, '/');
  }
}
