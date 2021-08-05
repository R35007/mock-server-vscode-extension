import * as vscode from "vscode";
import { GENERATE_ROUTES, GET_DB_SNAPSHOT, HOMEPAGE, RESET_SERVER, START_SERVER, STOP_SERVER, SWITCH_ENVIRONMENT } from './enum';
import { StatusbarUi } from "./StatusBarUI";
import Server from "./server";
import HomePage from './HomePage';

export function activate(context: vscode.ExtensionContext) {
  const server = new Server();

  // Generate Mock
  context.subscriptions.push(vscode.commands.registerCommand(GENERATE_ROUTES, server.generateRoutes));

  // Start Server
  context.subscriptions.push(vscode.commands.registerCommand(START_SERVER, server.restartServer));

  // Stop Server
  context.subscriptions.push(vscode.commands.registerCommand(STOP_SERVER, server.stopServer));

  // Reset Server
  context.subscriptions.push(vscode.commands.registerCommand(RESET_SERVER, server.resetServer));

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(SWITCH_ENVIRONMENT, server.switchEnvironment));

  // Get Db Snapshot
  context.subscriptions.push(vscode.commands.registerCommand(GET_DB_SNAPSHOT, server.getDbSnapshot));
  
  // Home Page
  context.subscriptions.push(vscode.commands.registerCommand(HOMEPAGE, () => {
    HomePage.createOrShow(context.extensionUri, server)
  }));

  if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(HOMEPAGE, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				HomePage.revive(webviewPanel, context.extensionUri, server);
			}
		});
	}
  
  // show status bar
  context.subscriptions.push(StatusbarUi.statusBarItem);
}
export function deactivate() { }
