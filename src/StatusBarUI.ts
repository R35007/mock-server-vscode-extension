import * as vscode from 'vscode';
import { Commands, PromptAction, ServerStatus } from './enum';
import { Prompt } from './prompt';
import { Settings } from './Settings';

export class StatusbarUi {
  private static _statusBarItem: vscode.StatusBarItem;
  private static log: (message: string, newLine?: string) => void;

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

  static init(log: (message: string, newLine?: string) => void) {
    StatusbarUi.log = log;
    StatusbarUi.working(ServerStatus.LOAD);
    StatusbarUi.startServer(undefined, undefined, 300);
  }

  static working(status: ServerStatus = ServerStatus.START) {
    StatusbarUi.statusBarItem.text = `$(pulse) ${status}ing...`;
    StatusbarUi.statusBarItem.tooltip = 'In case if it takes long time, try to restart the vscode window.';
    StatusbarUi.statusBarItem.command = undefined;

    StatusbarUi.log(`[Running] Server ${status} initiated`, '\n');
    StatusbarUi.log(`Server ${status === ServerStatus.STOP ? 'Stopp' : status}ing...`);
  }

  static startServer(statusMsg?: string, error?: any, delay: number = 0) {
    setTimeout(() => {
      StatusbarUi.statusBarItem.text = '$(broadcast) Mock it';
      StatusbarUi.statusBarItem.command = Commands.START_SERVER;
      StatusbarUi.statusBarItem.tooltip = 'Click to start mock server';

      if (error?.code === 'EADDRINUSE') {
        const action = "Use another Port ?";
        vscode.window.showErrorMessage(`Server already listening to port : ${Settings.port}`, action).then(selectedAction => {
          if (selectedAction === action)
            vscode.commands.executeCommand(Commands.START_WITH_NEW_PORT);

        });
        StatusbarUi.log(`[${error ? 'Error' : 'Done'}] ${statusMsg}`);
        StatusbarUi.log(error);
        return;
      }

      if (statusMsg) {
        Prompt.showPopupMessage(`${statusMsg} \n${error?.message || ''}`, error ? PromptAction.ERROR : PromptAction.INFO);
        StatusbarUi.log(`[${error ? 'Error' : 'Done'}] ${statusMsg}`);
        error && StatusbarUi.log(error);
      }
    }, delay);
  }

  static stopServer(status: ServerStatus.START | ServerStatus.RESTART = ServerStatus.START, port: number, url: string) {
    setTimeout(() => {
      StatusbarUi.statusBarItem.text = `$(circle-slash) Port : ${port}`;
      StatusbarUi.statusBarItem.command = Commands.STOP_SERVER;
      StatusbarUi.statusBarItem.tooltip = 'Click to stop mock server';
      Prompt.showPopupMessage(`Server ${status}ed : [${url}](command:${Commands.OPEN_HOMEPAGE})`);
      StatusbarUi.log(`[Done] Server ${status}ed : ${url}`);
    }, 150);
  }
}
