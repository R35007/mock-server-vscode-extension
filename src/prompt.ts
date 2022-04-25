import * as vscode from "vscode";
import { Settings } from "./Settings";

export class Prompt {
  static getFilePath = async (extensions: string[]) => {
    const defaultUri = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined;
    const filters = { type: extensions.map((e) => e.slice(1)) };
    const filePaths = await vscode.window.showOpenDialog({
      defaultUri,
      filters,
      title: "Please select .json or .http file to paste the generated data",
    });

    const filePath = filePaths && filePaths[0].fsPath.toString();
    return filePath;
  };

  static shouldSaveAsNewFile = () => {
    return vscode.window.showQuickPick(["no", "yes"], {
      placeHolder: "Create a new File ?",
    });
  };

  static getEnvironment = async (envNameList: string[]) => {
    return vscode.window.showQuickPick(envNameList, {
      placeHolder: "Please select any environment",
    });
  };

  static showPopupMessage = (message: string, action: "info" | "warning" | "error") => {
    if (action === "info") {
      Settings.showInfoMsg &&
        vscode.window.showInformationMessage(message);
    } else if (action === "error") {
      vscode.window.showErrorMessage(message);
    } else if (action === "warning") {
      vscode.window.showWarningMessage(message);
    }
  };

  static showInputBox = async (placeHolder: string, value?: number) => {
    return vscode.window.showInputBox({
      prompt: placeHolder,
      value: value?.toString()
    });
  };
}
