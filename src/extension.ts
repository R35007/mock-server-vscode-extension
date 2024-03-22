import open from "open";
import * as vscode from "vscode";
import HomePage from "./HomePage";
import { Settings } from "./Settings";
import { StatusbarUi } from "./StatusBarUI";
import { Commands, PromptAction, ServerStatus } from "./enum";
import { Prompt } from "./prompt";
import Server from "./server";
require("jsonc-require");

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel("Mock Server Log");
  const log = (message: string, newLine: string = "", noDate: boolean = false) => {
    if (noDate) return output.appendLine(`${newLine}${message}`);
    return output.appendLine(`${newLine}[${new Date().toLocaleTimeString()}] ${message}`);
  };
  const clearLog = output.clear;

  StatusbarUi.init(log);

  const server = new Server(context, log, clearLog);

  // Transform Mock
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.TRANSFORM_TO_MOCK_SERVER_DB, async (args) => {
      try {
        log("[Running] Data Transform initiated", "\n");
        log("Data Transforming...");
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Please wait. Data Transforming...",
          },
          async () => await server.transformToMockDB(args)
        );
        log("[Done] Data Transformed Successfully");
      } catch (error: any) {
        log(`[Error] Failed to Transform. ${error.message}`);
        console.log(error);
        Prompt.showPopupMessage(`Failed to Transform. \n${error.message}`, PromptAction.ERROR);
      }
    })
  );

  // Start Server
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.START_SERVER, async (args) => {
      if (server.mockServer.server) {
        // If server already running then restart the server
        try {
          StatusbarUi.working(ServerStatus.RESTART);
          await server.resetServer();
          await server.startServer(args);
          StatusbarUi.stopServer(ServerStatus.RESTART, server.mockServer.port!, server.mockServer.listeningTo!);
        } catch (error: any) {
          await server.resetServer();
          log(`[Error] Server Failed to Restart. ${error.message}`);
          console.log(error);
          StatusbarUi.startServer(args, `Server Failed to Restart.`, error);
        }
      } else {
        // Start a new server
        try {
          StatusbarUi.working(ServerStatus.START);
          await server.startServer(args);
          StatusbarUi.stopServer(ServerStatus.START, server.mockServer.port!, server.mockServer.listeningTo!);
        } catch (error: any) {
          await server.resetServer();
          log(`[Error] Server Failed to Start. ${error.message}`);
          console.log(error);
          StatusbarUi.startServer(args, "Server Failed to Start.", error);
        }
      }
    })
  );

  // Serve Static Files
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.SERVE_STATIC_FILES, async (args = {}) => {
      vscode.commands.executeCommand(Commands.START_SERVER, { fsPath: args?.fsPath, serveStatic: true });
    })
  );

  // Stop Server
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.STOP_SERVER, async (args) => {
      StatusbarUi.working(ServerStatus.STOP);
      await server.resetServer();
      StatusbarUi.startServer(args, "Server Stopped", undefined, 150);
    })
  );

  // Start Server with new Port
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.START_WITH_NEW_PORT, async (args) => {
      const isServerRunning = server.mockServer.server;
      const status = isServerRunning ? ServerStatus.RESTART : ServerStatus.START;
      try {
        const port = await server.setPort();
        if (typeof port === "undefined") return;
        StatusbarUi.working(status);
        await server.resetServer();
        await server.startServer(args, port);
        StatusbarUi.stopServer(status, server.mockServer.port!, server.mockServer.listeningTo!);
      } catch (error: any) {
        await server.resetServer();
        log(`[Error] Failed to Set Port. ${error.message}`);
        console.log(error);
        StatusbarUi.startServer(args, "Failed to Set Port.", error, 150);
      }
    })
  );

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(Commands.SWITCH_ENVIRONMENT, server.switchEnvironment));

  // Get Db Snapshot
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.GET_DB_SNAPSHOT, async (args) => {
      try {
        log(`[Running] Db Snapshot initiated`, "\n");
        log(`Getting Db Snapshot..`);
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Please wait. Getting Db Snapshot...",
          },
          async () => await server.getDbSnapshot(args)
        );
        log(`[Done] Db Snapshot retrieved Successfully`);
      } catch (error: any) {
        log(`[Error] Failed to get Db Snapshot. ${error.message}`);
        console.log(error);
        Prompt.showPopupMessage(`Failed to get Db Snapshot. \n${error.message}`, PromptAction.ERROR);
      }
    })
  );

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

  // Create db.json File
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.CREATE_DB, async (args) => {
      try {
        log(`[Running] Creating Sample db`, "\n");
        log("\nCreating Db...");
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Please wait. Creating Sample Db...",
          },
          async () => await server.creteSampleDb(args)
        );
        log("[Done] Sample files created.");
      } catch (error: any) {
        log(`[Error] Failed to Create Sample Db. ${error.message}`);
        console.log(error);
        Prompt.showPopupMessage(`Failed to Create Sample Db. \n${error.message}`, PromptAction.ERROR);
      }
    })
  );

  // Create server.js File
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.CREATE_SERVER, async (args) => {
      try {
        log(`[Running] Creating Sample Server Script`, "\n");
        log("\nCreating Server Script...");
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Please wait. Creating Sample Server Script...",
          },
          async () => await server.creteSampleServer(args)
        );
        log("[Done] Sample files created.");
      } catch (error: any) {
        log(`[Error] Failed to Create Sample Server Script. ${error.message}`);
        console.log(error);
        Prompt.showPopupMessage(`Failed to Create Sample Server Script. \n${error.message}`, PromptAction.ERROR);
      }
    })
  );

  // Create Example Files
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.CREATE_ADVANCED_EXAMPLES, async (args) => {
      try {
        log(`[Running] Creating Advanced Examples initiated`, "\n");
        log("\nCreating Examples...");
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Please wait. Creating Sample Mock Files...",
          },
          async () => await server.creteAdvancedExamples(args)
        );
        log("[Done] Sample files created.");
      } catch (error: any) {
        log(`[Error] Failed to Create Samples. ${error.message}`);
        console.log(error);
        Prompt.showPopupMessage(`Failed to Create Samples. \n${error.message}`, PromptAction.ERROR);
      }
    })
  );

  // Start Server in Terminal
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.START_SERVER_IN_TERMINAL, () => {
      try {
        log(`[Running] Terminal command initiated`, "\n");
        log("\nStarting Server in Terminal...");
        server.startServerInTerminal();
        log("[Done] Terminal command success.");
      } catch (error: any) {
        log(`[Error] Failed to Start Server in Terminal. ${error.message}`);
        console.log(error);
        Prompt.showPopupMessage(`Failed to Start Server in Terminal. \n${error.message}`, PromptAction.ERROR);
      }
    })
  );

  // Home Page
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.OPEN_HOMEPAGE, () => {
      if (Settings.openInside || !server.mockServer.listeningTo) return HomePage.createOrShow(context.extensionUri, server);
      open(server.mockServer.listeningTo);
    })
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(Commands.OPEN_HOMEPAGE, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
        HomePage.revive(webviewPanel, context.extensionUri, server);
      },
    });
  }

  // show status bar
  context.subscriptions.push(StatusbarUi.statusBarItem);

  // Auto Completion Provider
  const provideCompletionItems = async (document: vscode.TextDocument, position: vscode.Position) =>
    await server.endpointAutoCompletion(document, position);
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("jsonc", { provideCompletionItems }, "/"));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("json", { provideCompletionItems }, "/"));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("javascript", { provideCompletionItems }, "/"));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("typescript", { provideCompletionItems }, "/"));
}
export function deactivate() {}
