import { Config, Injectors, KeyValString, User_Middlewares } from "@r35007/mock-server/dist/model";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Prompt } from "./prompt";

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
  static get globals() {
    return Settings.getSettings("globals") as object;
  }
  static get injectors() {
    return Settings.getSettings("injectors") as Injectors;
  }
  static get reverseRouteOrder() {
    return Settings.getSettings("reverseRouteOrder") as boolean;
  }
  static get proxy() {
    return Settings.getSettings("proxy") as KeyValString;
  }
  static get excludeRoutes() {
    const excludeRoutes = Settings.getSettings("excludeRoutes") as string[];
    const addProxy = Settings.getSettings("excludeRoutes.addProxy") as boolean;

    if (addProxy) excludeRoutes.push(...Object.keys(Settings.proxy));

    return excludeRoutes
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

  static get donotShowInfoMsg() {
    return Settings.getSettings("donotShowInfoMsg") as boolean;
  }
  static set donotShowInfoMsg(val: boolean) {
    Settings.setSettings("donotShowInfoMsg", val);
  }

  static get rootPath() {
    const rootPathStr = Settings.getSettings("paths.rootPath") as string;
    const workSpaceFolderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "./";
    return Settings.getValidPath("rootPath", workSpaceFolderPath, rootPathStr) || workSpaceFolderPath;
  }
  static get mockPath() {
    const mockPathStr = Settings.getSettings("paths.mockPath") as string;
    return Settings.getValidPath("mockPath", Settings.rootPath, mockPathStr) || "";
  }
  static get staticUrl() {
    const staticUrlStr = Settings.getSettings("staticUrl") as string;
    return Settings.getValidPath("staticUrl", Settings.rootPath, staticUrlStr) || "";
  }
  static get envPath() {
    const envPathStr = Settings.getSettings("paths.envPath") as string;
    return Settings.getValidPath("envPath", Settings.rootPath, envPathStr) || "";
  }
  static get middlewarePath() {
    const middlewarePathStr = Settings.getSettings("paths.middlewarePath") as string;
    return Settings.getValidPath("injectorsPath", Settings.rootPath, middlewarePathStr, true);
  }
  static get callbackPath() {
    const callbackPathPathStr = Settings.getSettings("paths.generateMockCallbackPath") as string;
    return Settings.getValidPath("generateMockCallbackPath", Settings.rootPath, callbackPathPathStr, true);
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
      proxy: Settings.proxy,
      excludeRoutes: Settings.excludeRoutes,
      reverseRouteOrder: Settings.reverseRouteOrder,
      throwError: true,
    };
  }
  static getValidPath(settingsName: string, rootPath: string, relativePath: string, shouldBeFile: boolean = false) {
    if (relativePath && relativePath.trim().length) {
      const resolvedPath = path.resolve(rootPath, relativePath);
      if (fs.existsSync(resolvedPath)) {
        if (shouldBeFile && !fs.statSync(resolvedPath).isFile() && path.extname(resolvedPath) !== ".js") {
          Prompt.showPopupMessage(`Invalid ${settingsName} - ${resolvedPath}`, "error");
          return undefined;
        }
        return resolvedPath;
      }
      Prompt.showPopupMessage(`Invalid ${settingsName} - ${resolvedPath}`, "error");
      return undefined;
    } else {
      return undefined;
    }
  }
}
