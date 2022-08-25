import { PathDetails } from '@r35007/mock-server/dist/server/types/common.types';
import * as path from "path";
import * as vscode from "vscode";
import { PromptAction } from './enum';
import { Settings } from "./Settings";

export class Prompt {
  static getEnvironment = async (envNameList: PathDetails[]) => {
    const pickList = envNameList.map(env => ({
      ...env,
      label: env.fileName,
      description: env.filePath ? path.relative(Settings.rootPath, env.filePath) : ''
    }));
    return vscode.window.showQuickPick(pickList, {
      placeHolder: "Please select a file",
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
