import * as path from 'path';
import * as vscode from "vscode";
import { Environment, NO_ENV, PromptAction } from './enum';
import { LocalStorageService } from './LocalStorageService';
import { Settings } from "./Settings";

export class Prompt {
  static getEnvironment = async (envNameList: Environment[]) => {
    const disposables: vscode.Disposable[] = [];

    const openFileButton = {
      iconPath: new vscode.ThemeIcon("file"),
      tooltip: "Open selected environment Db Files"
    };

    let activeItem: Environment = NO_ENV;

    const pick = await new Promise((resolve) => {
      const input = vscode.window.createQuickPick();
      input.title = "Switch Environment";
      input.placeholder = "Please select a Environment";
      input.items = envNameList;
      input.matchOnDescription = true;
      input.buttons = [openFileButton];
      disposables.push(
        input.onDidChangeActive(items => {
          activeItem = items[0] as Environment;
        }),
        input.onDidTriggerButton(item => {
          input.hide();
          resolve(<any>item);
        }),
        input.onDidChangeSelection(items => {
          input.hide();
          resolve(items[0]);
        }),
        input.onDidHide(resolve)
      );
      input.show();
    });

    disposables.forEach(d => d.dispose());
    
    if (pick === openFileButton) {
      if(activeItem.envName === NO_ENV.envName) return;
      const openFile  = async (file: string) => {
        const filePath = Settings.paths.environment ? path.resolve(Settings.paths.environment, file) : file;
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc, {preview: false, preserveFocus: true});
      };
      await Promise.all(activeItem.db.map(openFile));
      return;
    }

    return pick as Environment;
  };

  static showPopupMessage = (message: string, action: PromptAction = PromptAction.INFO,) => {
    if (action === PromptAction.INFO) {
      Settings.showInfoMsg &&
        vscode.window.showInformationMessage(message);
    } else if (action === PromptAction.ERROR) {
      vscode.window.showErrorMessage(message);
    } else if (action === PromptAction.WARNING) {
      vscode.window.showWarningMessage(message);
    }
  };

  static showInputBox = async (title: string, prompt: string, value?: number) => {
    return vscode.window.showInputBox({
      title,
      prompt,
      value: value?.toString()
    });
  };
}
