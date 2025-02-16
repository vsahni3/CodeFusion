// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { join } from 'path';
import * as vscode from 'vscode';
import appServer, { Server } from './server';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Register the WebviewViewProvider
    const provider = new SidebarProvider(context.extensionUri, appServer);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('react-sidebar.view', provider)
    );

    // Register your commands here
    let disposable = vscode.commands.registerCommand('react-sidebar.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from React Sidebar!');
    });

    context.subscriptions.push(disposable);
}

class SidebarProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri, private readonly server: Server) { }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Get path to media folder
        const mediaPath = join(this._extensionUri.fsPath, 'media');
        const mainScriptPath = vscode.Uri.file(join(mediaPath, 'main.js'));

        webviewView.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
                        img-src https: data: blob:; 
                        media-src https: data: blob:; 
                        script-src 'unsafe-eval' 'unsafe-inline' vscode-webview-resource: blob:; 
                        style-src 'unsafe-inline';
                        connect-src https:;
                        worker-src blob:;
                        child-src blob:">
                    <meta http-equiv="Permissions-Policy" content="display-capture=*, microphone=*">
                    <title>React Sidebar</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script src="${webviewView.webview.asWebviewUri(mainScriptPath)}"></script>
                </body>
            </html>
        `;

        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this.server.handleMessage(message, webviewView);
        });
    }
}

// This method is called when your extension is deactivated
export function deactivate() { }
