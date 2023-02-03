import open from "open";
import * as vscode from "vscode";
import { Commands, PromptAction, ServerStatus } from './enum';
import HomePage from './HomePage';
import { Prompt } from './prompt';
import Server from "./server";
import { Settings } from './Settings';
import { StatusbarUi } from "./StatusBarUI";
require("jsonc-require");

export function activate(context: vscode.ExtensionContext) {

  const output = vscode.window.createOutputChannel("Mock Server Log");
  const log = (message: string, newLine: string = '', noDate: boolean = false) => {
    if (noDate) return output.appendLine(`${newLine}${message}`);
    return output.appendLine(`${newLine}[${new Date().toLocaleTimeString()}] ${message}`);
  };
  const clearLog = output.clear;

  StatusbarUi.init(log);

  const server = new Server(context, log, clearLog);

  // Transform Mock
  context.subscriptions.push(vscode.commands.registerCommand(Commands.TRANSFORM_TO_MOCK_SERVER_DB, async (args) => {
    try {
      log('[Running] Data Transform initiated', '\n');
      log('Data Transforming...');
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Please wait. Data Transforming...",
      }, async () => await server.transformToMockDB(args));
      log('[Done] Data Transformed Successfully');
    } catch (error: any) {
      log(`[Error] Failed to Transform. ${error.message}`);
      console.log(error);
      Prompt.showPopupMessage(`Failed to Transform. \n${error.message}`, PromptAction.ERROR);
    };
  }));

  // Mock It
  context.subscriptions.push(vscode.commands.registerCommand(Commands.MOCK_IT, async (args) => {
    vscode.commands.executeCommand(Commands.START_SERVER, args);
  }));

  // Start Server
  context.subscriptions.push(vscode.commands.registerCommand(Commands.START_SERVER, async (args) => {
    if (server.mockServer.server) { // If server already running then restart the server
      try {
        StatusbarUi.working(ServerStatus.RESTART);
        await server.resetServer();
        await server.startServer(args?.fsPath);
        await new Promise((resolve, reject) => { setTimeout(resolve, 500); });
        StatusbarUi.stopServer(ServerStatus.RESTART, server.mockServer.port!, server.mockServer.listeningTo!);
      } catch (error: any) {
        await server.resetServer();
        log(`[Error] Server Failed to Restart. ${error.message}`);
        console.log(error);
        StatusbarUi.startServer(`Server Failed to Restart.`, error);
      }
    } else { // Start a new server
      try {
        StatusbarUi.working(ServerStatus.START);
        await server.startServer(args?.fsPath);
        StatusbarUi.stopServer(ServerStatus.START, server.mockServer.port!, server.mockServer.listeningTo!);
      } catch (error: any) {
        await server.resetServer();
        log(`[Error] Server Failed to Start. ${error.message}`);
        console.log(error);
        StatusbarUi.startServer('Server Failed to Start.', error);
      }
    }
  }));

  // Stop Server
  context.subscriptions.push(vscode.commands.registerCommand(Commands.STOP_SERVER, async (args) => {
    StatusbarUi.working(ServerStatus.STOP);
    await server.resetServer();
    StatusbarUi.startServer('Server Stopped', undefined, 150);
  }));

  // Start Server with new Port
  context.subscriptions.push(vscode.commands.registerCommand(Commands.START_WITH_NEW_PORT, async (args) => {
    const isServerRunning = server.mockServer.server;
    const status = isServerRunning ? ServerStatus.RESTART : ServerStatus.START;
    try {
      const port = await server.setPort();
      if (typeof port === 'undefined') return;
      StatusbarUi.working(status);
      await server.resetServer();
      await server.startServer(args?.fsPath, port);
      StatusbarUi.stopServer(status, server.mockServer.port!, server.mockServer.listeningTo!);
    } catch (error: any) {
      await server.resetServer();
      log(`[Error] Failed to Set Port. ${error.message}`);
      console.log(error);
      StatusbarUi.startServer('Failed to Set Port.', error, 150);
    }
  }));

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SWITCH_ENVIRONMENT, server.switchEnvironment));

  // Get Db Snapshot
  context.subscriptions.push(vscode.commands.registerCommand(Commands.GET_DB_SNAPSHOT, async (args) => {
    try {
      log(`[Running] Db Snapshot initiated`, "\n");
      log(`Getting Db Snapshot..`);
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Please wait. Getting Db Snapshot...",
      }, async () => await server.getDbSnapshot(args));
      log(`[Done] Db Snapshot retrieved Successfully`);
    } catch (error: any) {
      log(`[Error] Failed to get Db Snapshot. ${error.message}`);
      console.log(error);
      Prompt.showPopupMessage(`Failed to get Db Snapshot. \n${error.message}`, PromptAction.ERROR);
    }
  }));

  // Make Request
  context.subscriptions.push(vscode.commands.registerCommand(Commands.MAKE_REQUEST, server.makeRequest));

  // Set Port
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SET_PORT, server.setPort));

  // Set Root
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SET_ROOT, server.setRoot));

  // Set Config
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SET_CONFIG, server.setConfig));

  // Paste Config
  context.subscriptions.push(vscode.commands.registerCommand(Commands.PASTE_CONFIG, server.pasteConfig));

  // Create Sample Files
  context.subscriptions.push(vscode.commands.registerCommand(Commands.GENERATE_MOCK_FILES, async (args) => {
    try {
      log(`[Running] Creating Samples initiated`, "\n");
      log('\nCreating Samples...');
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Please wait. Generating Sample Mock Files...",
      }, async () => await server.generateMockFiles(args));
      log('[Done] Sample files created.');
    } catch (error: any) {
      log(`[Error] Failed to Create Samples. ${error.message}`);
      console.log(error);
      Prompt.showPopupMessage(`Failed to Create Samples. \n${error.message}`, PromptAction.ERROR);
    }
  }));

  // Home Page
  context.subscriptions.push(vscode.commands.registerCommand(Commands.OPEN_HOMEPAGE, () => {
    if (Settings.openInside || !server.mockServer.listeningTo) return HomePage.createOrShow(context.extensionUri, server);
    open(server.mockServer.listeningTo);
  }));

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(Commands.OPEN_HOMEPAGE, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
        HomePage.revive(webviewPanel, context.extensionUri, server);
      }
    });
  }

  // show status bar
  context.subscriptions.push(StatusbarUi.statusBarItem);

  // Auto Completion Provider
  const provideCompletionItems = async (document: vscode.TextDocument, position: vscode.Position) => await server.endpointAutoCompletion(document, position);
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider('jsonc', { provideCompletionItems }, '/'));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider('json', { provideCompletionItems }, '/'));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider('javascript', { provideCompletionItems }, '/'));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider('typescript', { provideCompletionItems }, '/'));
}
export function deactivate() { }
