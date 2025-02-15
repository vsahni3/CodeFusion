// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { join } from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Register the WebviewViewProvider
    const provider = new SidebarProvider(context.extensionUri);
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
    constructor(private readonly _extensionUri: vscode.Uri) {}

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
                    <title>React Sidebar</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script src="${webviewView.webview.asWebviewUri(mainScriptPath)}"></script>
                </body>
            </html>
        `;
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
