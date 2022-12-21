import * as vscode from "vscode";
import { Commands } from './enum';
import Server from './server';
import { Settings } from './Settings';

export default class HomePage {

  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: HomePage | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  public readonly _server: Server;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, server: Server) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._server = server;

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(this.dispose, null, this._disposables);
    this._panel.onDidChangeViewState(this.update.bind(this));

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'startServer':
            await vscode.commands.executeCommand(Commands.START_SERVER).then(this.update.bind(this));
            return;
          case 'enableHomePage':
            await vscode.commands.executeCommand('workbench.action.openSettings', 'mock-server.settings.homePage');
            return;
        }
      }, null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, server: Server) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (HomePage.currentPanel) {
      HomePage.currentPanel?._panel?.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      Commands.OPEN_HOMEPAGE, // Identifies the type of the webview. Used internally
      'Mock Server', // Title of the panel displayed to the user
      column || vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true, // Enable scripts in the webview
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'public')]
      }
    );

    HomePage.currentPanel = new HomePage(panel, extensionUri, server);
    // Set the webview's initial html content
    HomePage.currentPanel.update();
  }

  public dispose() {
    HomePage.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) return x.dispose();
    }
  }

  public update() {
    const panel = HomePage.currentPanel?._panel;

    // Vary the webview's content based on where it is located in the editor.
    switch (panel?.viewColumn) {
      case vscode.ViewColumn.Three:
      case vscode.ViewColumn.Two:
      case vscode.ViewColumn.One:
      default:
        panel!.webview.html = this.getWebviewContent();
        return;
    }
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, server: Server) {
    HomePage.currentPanel = new HomePage(panel, extensionUri, server);
  }

  private getWebviewContent = () => {
    const mockServer = this._server?.mockServer;
    const iFrameSrc = `${mockServer?.listeningTo}?_fontSize=16px&_dataFontSize=1rem&_dataLineHeight=1.2`;

    const styles = `
    <style>
        #welcome-container{
          text-align: center;
          height: 100vh;
          padding: 0;
          max-width: 110vh;
          margin: auto;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        #welcome-container .banner{
          text-decoration: none;
          background: #141414 !important;
          padding: 15px 30px;
          align-items: center;
          text-align: center;
          border-radius: 4px;
        }
        #welcome-container .banner a {
          text-decoration: none !important;
          outline: none;
        }
        
        #welcome-container .start-server-btn {
          cursor: pointer;
          color: var(--vscode-button-foreground);
          background: var(--vscode-button-background);
          border: 0;
          padding: 8px;
        }
        #welcome-container .start-server-btn:hover {
          background: var(--vscode-button-hoverBackground);
        }

        #welcome-container .demo-container {
          text-align: center; 
          border: 1px solid #302e2e; 
          flex: 1; 
          display: flex;
          overflow: hidden;
          border-radius: 4px;
        }
      </style>`;

    const enableHomePage = `<div style="text-align: center;">
      <p style="font-size: 1rem;">Click <a style="cursor: pointer" onclick="enableHomePage()">here</a> enable Mock Server HomePage and restart the server to take effect.</p>
    </div>`;
    const startServerBtn = `<div style="text-align: center; margin: 1rem;"><button class="start-server-btn" onclick="startServer()">Click here to Start Mock Server</button></div>`;

    const iFrame = `<iframe id="iframe-data" style="width: 100%; height: 100%" src="${iFrameSrc}" frameborder="0"></iframe>`;

    const welcomeScreen = `<div id="welcome-container">
    <div class="banner">
      <h1 id="mock-server" style="position: relative;align-items: center;display: inline-block;margin: auto;border: 0;">
        <a style="position: absolute; text-decoration: none;" href="https://github.com/R35007/mock-server" target="_blank">
          <img height="40px" src="https://r35007.github.io/Mock-Server/images/mockserverlogo.png" alt="">
        </a>
        <a style="margin-left: 40px; text-decoration: none;" href="https://github.com/R35007/mock-server" target="_blank">Mock Server</a>
        <a href="https://img.shields.io/npm/v/@r35007/mock-server?label=npm">
          <img src="https://img.shields.io/npm/v/@r35007/mock-server?label=npm" alt="">
        </a>
        <a href="https://img.shields.io/npm/l/@r35007/mock-server?color=blue">
          <img src="https://img.shields.io/npm/l/@r35007/mock-server?color=blue" alt="">
        </a>
        <a href="https://img.shields.io/npm/types/@r35007/mock-server">
          <img src="https://img.shields.io/npm/types/@r35007/mock-server" alt="">
        </a>
      </h1>
      <p>Get a full REST API with <strong>zero coding</strong> in <strong>less than 30 seconds</strong> (seriously)</p>
      <p>Created with &lt;3 for front-end developers who need a quick back-end for prototyping and mocking.</p>
    </div>
    ${Settings.homePage ? startServerBtn : enableHomePage}
    <div class="demo-container"><img src="https://user-images.githubusercontent.com/23217228/206978718-3f4bdcbd-2e7a-4d7b-b4aa-651165a5781b.gif" alt="Home Page" /></div>
  </div>`;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=0.6, maximum-scale=0.6">
      <title>Mock Server</title>
      ${styles}
      <script>
        var vscode = acquireVsCodeApi();
      </script>
    </head>
    <body style="margin: 0; padding: 0; height: 100vh; width: 100%">
    ${!mockServer?.listeningTo || !Settings.homePage ? welcomeScreen : iFrame}
    </body>
    <script>
      function startServer() {
        vscode.postMessage({
          command: 'startServer',
        });
      }
      function enableHomePage() {
        vscode.postMessage({
          command: 'enableHomePage',
        });
      }
    </script>
    </html>`;
  };

}
