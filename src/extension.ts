import * as vscode from "vscode";
import { Commands } from './enum';
import { StatusbarUi } from "./StatusBarUI";
import Server from "./server";
import HomePage from './HomePage';

export function activate(context: vscode.ExtensionContext) {
  const server = new Server();

  // Generate Mock
  context.subscriptions.push(vscode.commands.registerCommand(Commands.TRANSFORM_TO_MOCK_SERVER_DB, server.transformToMockServerDB));

  // Start Server
  context.subscriptions.push(vscode.commands.registerCommand(Commands.START_SERVER, server.restartServer));

  // Stop Server
  context.subscriptions.push(vscode.commands.registerCommand(Commands.STOP_SERVER, server.stopServer));

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SWITCH_ENVIRONMENT, server.switchEnvironment));

  // Get Db Snapshot
  context.subscriptions.push(vscode.commands.registerCommand(Commands.GET_DB_SNAPSHOT, server.getDbSnapshot));

  // Set Port
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SET_PORT, server.setPort));

  // Create Sample Files
  context.subscriptions.push(vscode.commands.registerCommand(Commands.GENERATE_MOCK_FILES, server.generateMockFiles));

  // Home Page
  context.subscriptions.push(vscode.commands.registerCommand(Commands.HOMEPAGE, () => {
    HomePage.createOrShow(context.extensionUri, server)
  }));

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(Commands.HOMEPAGE, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
        HomePage.revive(webviewPanel, context.extensionUri, server);
      }
    });
  }

  // show status bar
  context.subscriptions.push(StatusbarUi.statusBarItem);
}
export function deactivate() { }
