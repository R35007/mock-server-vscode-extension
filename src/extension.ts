import * as vscode from "vscode";
import {
  generateMockID,
  resetServerId,
  startServerID,
  stopServerID,
  switchEnvironmentID,
} from "./enum";
import VSMockServer from "./vs_mock_server";
import { StatusbarUi } from "./StatusBarUI";

export function activate(context: vscode.ExtensionContext) {
  const vsMockServer = new VSMockServer();

  // Generate Mock
  context.subscriptions.push(vscode.commands.registerCommand(generateMockID, vsMockServer.generateMockFromHAR));

  // Start Server
  context.subscriptions.push(vscode.commands.registerCommand(startServerID, vsMockServer.restartServer));

  // Stop Server
  context.subscriptions.push(vscode.commands.registerCommand(stopServerID, vsMockServer.stopServer));

  // Reset Server
  context.subscriptions.push(vscode.commands.registerCommand(resetServerId, vsMockServer.resetServer));

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(switchEnvironmentID, vsMockServer.switchEnvironment));

  // show status bar
  context.subscriptions.push(StatusbarUi.statusBarItem);
}
export function deactivate() { }
