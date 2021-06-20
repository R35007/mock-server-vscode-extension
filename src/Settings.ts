import { Config, KeyValString, User_Middlewares } from "@r35007/mock-server/dist/model";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class Settings {

  static output = vscode.window.createOutputChannel("Mock Server Path Log");

  static showPathLog() {
    Settings.output.clear();
    const paths = Settings.getSettings("paths") as object;
    Object.keys(paths).forEach(Settings.showLog)
  }

  static showLog(settingsName: string) {
    const workSpaceFolderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "./";
    const relativePath = Settings.getSettings("paths." + settingsName) as string;
    const resolvedPath = settingsName === 'rootPath' 
    ? path.resolve(workSpaceFolderPath, relativePath)
    : path.resolve(Settings.rootPath, relativePath);
    if (relativePath?.trim().length && fs.existsSync(resolvedPath)) {
      Settings.output.appendLine(`${settingsName} : ${resolvedPath}`);
    } else {
      Settings.output.appendLine(`\n[Error] - Invalid ${settingsName} : ${resolvedPath}`);
    }
  }

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
  static get environment() {
    const env = Settings.getSettings("environment") as string;
    return env || "none";
  }
  static set environment(env: string) {
    Settings.setSettings("environment", env ? env.toLowerCase() : "none");
  }
  static get baseUrl() {
    return Settings.getSettings("baseUrl") as string;
  }
  static get store() {
    return Settings.getSettings("store") as object;
  }
  static get reverseRouteOrder() {
    return Settings.getSettings("reverseRouteOrder") as boolean;
  }
  static get routeRewrite() {
    const rewriter = Settings.getSettings("routeRewrite") as KeyValString;
    return rewriter;
  }
  static get excludeRoutes() {
    const excludeRoutes = Settings.getSettings("excludeRoutes") as string[];
    const rewrittenRoute = Object.keys(Settings.routeRewrite);
    excludeRoutes.push(...rewrittenRoute);

    return excludeRoutes
  }
  static get routesToLoop() {
    return Settings.getSettings("routesToLoop") as string[];
  }
  static get routesToGroup() {
    return Settings.getSettings("routesToGroup") as string[];
  }

  static get showStatusbar() {
    return Settings.getSettings("statusBar.show") as boolean;
  }
  static get statusBarPosition() {
    return Settings.getSettings("statusBar.position") as "Right" | "Left";
  }
  static get statusBarPriority() {
    return parseInt((Settings.getSettings("statusBar.priority") as any).toString());
  }

  static get dontShowInfoMsg() {
    return Settings.getSettings("donotShowInfoMsg") as boolean;
  }
  static set dontShowInfoMsg(val: boolean) {
    Settings.setSettings("donotShowInfoMsg", val);
  }

  static get rootPath() {
    const rootPathStr = Settings.getSettings("paths.rootPath") as string;
    const workSpaceFolderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "./";
    const rootPath = Settings.getValidPath(workSpaceFolderPath, rootPathStr) || workSpaceFolderPath;
    return rootPath;
  }
  static get mockPath() {
    const mockPathStr = Settings.getSettings("paths.mockPath") as string;
    const mockPath = Settings.getValidPath(Settings.rootPath, mockPathStr) || "";
    return mockPath
  }
  static get staticUrl() {
    const staticUrlStr = Settings.getSettings("paths.staticUrl") as string;
    const staticUrl = Settings.getValidPath(Settings.rootPath, staticUrlStr) || "";
    return staticUrl
  }
  static get envPath() {
    const envPathStr = Settings.getSettings("paths.envPath") as string;
    const envPath = Settings.getValidPath(Settings.rootPath, envPathStr) || "";
    return envPath;
  }
  static get middlewarePath() {
    const middlewarePathStr = Settings.getSettings("paths.middlewarePath") as string;
    const middlewarePath = Settings.getValidPath(Settings.rootPath, middlewarePathStr, true);
    return middlewarePath;
  }
  static get injectorsPath() {
    const injectorsPathStr = Settings.getSettings("paths.injectorsPath") as string;
    const injectorsPath = Settings.getValidPath(Settings.rootPath, injectorsPathStr, true);
    return injectorsPath;
  }
  static get middlewares() {
    const middlewarePath = Settings.middlewarePath;
    if (middlewarePath) {
      delete require.cache[middlewarePath];
      return require(middlewarePath) as User_Middlewares;
    }
    return undefined;
  }
  static get entryCallback() {
    const middlewares = Settings.middlewares;
    if (middlewares) {
      return middlewares["entryCallback"] as any;
    }
    return undefined;
  }
  static get finalCallback() {
    const middlewares = Settings.middlewares;
    if (middlewares) {
      return middlewares["finalCallback"] as any;
    }
    return undefined;
  }

  static get config(): Config {
    return {
      port: Settings.port,
      rootPath: Settings.rootPath,
      baseUrl: Settings.baseUrl,
      staticUrl: Settings.staticUrl,
      routeRewrite: Settings.routeRewrite,
      excludeRoutes: Settings.excludeRoutes,
      reverseRouteOrder: Settings.reverseRouteOrder,
      throwError: true,
    };
  }
  static getValidPath(rootPath: string, relativePath: string, shouldBeFile: boolean = false) {
    if (relativePath?.trim().length) {
      const resolvedPath = path.resolve(rootPath, relativePath);
      if (fs.existsSync(resolvedPath)) {
        if (shouldBeFile && !fs.statSync(resolvedPath).isFile()) {
          return undefined;
        }
        return resolvedPath;
      }
      return undefined;
    } else {
      return undefined;
    }
  }
}
