import * as vscode from "vscode";
import { PromptAction } from './enum';
import { Settings } from "./Settings";

export class Prompt {
  static getEnvironment = async (envNameList: string[]) => {
    return vscode.window.showQuickPick(envNameList, {
      placeHolder: "Please select any environment",
    });
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
