import Server from './server';
import * as vscode from "vscode";
import { HOMEPAGE } from './enum';

export default class HomePage {

  /**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: HomePage | undefined;
  
  private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
  public readonly _server: Server;

  public static createOrShow(extensionUri: vscode.Uri, server: Server) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (HomePage.currentPanel) {
			HomePage.currentPanel._panel.reveal(column);
			return;
		}

    const panel = vscode.window.createWebviewPanel(
      HOMEPAGE, // Identifies the type of the webview. Used internally
      'Mock Server', // Title of the panel displayed to the user
      column || vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true, // Enable scripts in the webview
        // And restrict the webview to only loading content from our extension's `media` directory.
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'public')]
      }
    );

		HomePage.currentPanel = new HomePage(panel, extensionUri, server);
	}

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, server: Server) {
		this._panel = panel;
		this._extensionUri = extensionUri;
    this._server = server;
		this._panel.webview.html = this.getWebviewContent(this._panel.webview);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => {
      HomePage.currentPanel = undefined;
      this._panel.dispose()
    }, null);

    // Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'startServer':
              this._server.restartServer().then(() => {
                this._panel.webview.html = this.getWebviewContent(this._panel.webview);
              })
						return;
				}
			},
			null,
		);
	}

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, server: Server) {
		HomePage.currentPanel = new HomePage(panel, extensionUri, server);
	}

  private getWebviewContent = (webview: vscode.Webview) => {
    
    const config = this._server?.mockServer?.config || {};
    const { port, host, base } = config;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=0.6, maximum-scale=0.6">
      <title>Mock Server</title>
      <style>
        #start-server{
          text-align: center;
          padding-top: 20%;
          font-size: 1.1rem;
        }
        #start-server a{
          cursor: pointer;
          color: #66adff;
        }
        #start-server a:hover{
          text-decoration: underline;
        }
      </style>
      <script>
        var vscode = acquireVsCodeApi();
      </script>
    </head>
    <body style="margin: 0; padding: 0; height: 100vh; width: 100%">
    ${
      this._server?.mockServer?.server ?
      `<iframe id="iframe-data"
      style="width: 100%; height: 100%" 
      src="http://${host}:${port}${base}?_fontSize=11px&_dataFontSize=0.9rem&_dataLineHeight=1.4"
      frameborder="0"></iframe>`
      :
      `<div id="start-server"><a onclick="startServer()">Click Here to Start the Mock Server</a></div>`
    }
    </body>
    <script>
      function startServer() {
        console.log('clicked!');
        vscode.postMessage({
          command: 'startServer',
        });
      }
    </script>
    </html>`
  }
  
}