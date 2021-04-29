import * as vscode from "vscode";
import { startServerID, stopServerID } from "./enum";
import { Settings } from "./Settings";

export class StatusbarUi {
  private static _statusBarItem: vscode.StatusBarItem;

  static get statusBarItem() {
    if (!StatusbarUi._statusBarItem) {
      StatusbarUi._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment[Settings.statusBarPosition], Settings.statusBarPriority);
      if (Settings.showStatusbar) this.statusBarItem.show();
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
      StatusbarUi.statusBarItem.command = startServerID;
      StatusbarUi.statusBarItem.tooltip = "Click to start mock server";
      showPopupMessage && showPopupMessage();
    }, delay);
  }

  static stopServer(delay: number, port: number, showPopupMessage?: () => void) {
    setTimeout(() => {
      StatusbarUi.statusBarItem.text = `$(circle-slash) Port : ${port}`;
      StatusbarUi.statusBarItem.command = stopServerID;
      StatusbarUi.statusBarItem.tooltip = "Click to stop mock server";
      showPopupMessage && showPopupMessage();
    }, delay);
  }
}
