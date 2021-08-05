import * as vscode from "vscode";
import { START_SERVER, STOP_SERVER } from './enum';
import { Settings } from "./Settings";

export class StatusbarUi {
  private static _statusBarItem: vscode.StatusBarItem;

  static get statusBarItem() {
    if (!StatusbarUi._statusBarItem) {
      StatusbarUi._statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment[Settings.statusBar.position],
        Settings.statusBar.priority
      );
      if (Settings.statusBar.show) this.statusBarItem.show();
    }
    return StatusbarUi._statusBarItem;
  }

  static set statusBarItem(val: any) {
    StatusbarUi._statusBarItem = val;
  }

  static init() {
    StatusbarUi.working("loading...");
    StatusbarUi.startServer(500);
  }

  static working(workingMsg = "Working on it...") {
    StatusbarUi.statusBarItem.text = `$(pulse) ${workingMsg}`;
    StatusbarUi.statusBarItem.tooltip = "In case if it takes long time, try to close all browser window.";
    StatusbarUi.statusBarItem.command = undefined;
  }

  static startServer(delay: number, showPopupMessage?: () => void) {
    setTimeout(() => {
      StatusbarUi.statusBarItem.text = "$(broadcast) Mock it";
      StatusbarUi.statusBarItem.command = START_SERVER;
      StatusbarUi.statusBarItem.tooltip = "Click to start mock server";
      showPopupMessage && showPopupMessage();
    }, delay);
  }

  static stopServer(delay: number, port: number, showPopupMessage?: () => void) {
    setTimeout(() => {
      StatusbarUi.statusBarItem.text = `$(circle-slash) Port : ${port}`;
      StatusbarUi.statusBarItem.command = STOP_SERVER;
      StatusbarUi.statusBarItem.tooltip = "Click to stop mock server";
      showPopupMessage && showPopupMessage();
    }, delay);
  }
}
