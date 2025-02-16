// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { join } from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';
import appServer, { Server } from './server';

const execAsync = promisify(exec);

let fetchInterval: NodeJS.Timer | undefined;

const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
);

async function startAutoFetch() {
    if (fetchInterval) {
        vscode.window.showInformationMessage('Auto-fetch is already running');
        return;
    }

    fetchInterval = setInterval(silentFetchAndMerge, 30 * 1000);

    // Update status bar
    statusBarItem.text = "$(sync~spin) Auto-fetch: On";
    statusBarItem.tooltip = "Click to stop auto-fetch";
    statusBarItem.command = 'react-sidebar.stopAutoFetch';
    statusBarItem.show();

    vscode.window.showInformationMessage('Started auto-fetch');
    await silentFetchAndMerge();
}

function stopAutoFetch() {
    if (fetchInterval) {
        // @ts-ignore
        clearInterval(fetchInterval);
        fetchInterval = undefined;

        // Update status bar
        statusBarItem.text = "$(sync) Auto-fetch: Off";
        statusBarItem.tooltip = "Click to start auto-fetch";
        statusBarItem.command = 'react-sidebar.startAutoFetch';

        vscode.window.showInformationMessage('Stopped auto-fetch');
    } else {
        vscode.window.showInformationMessage('Auto-fetch is not running');
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Initialize status bar
    statusBarItem.text = "$(sync) Auto-fetch: Off";
    statusBarItem.tooltip = "Click to start auto-fetch";
    statusBarItem.command = 'react-sidebar.startAutoFetch';
    statusBarItem.show();

    // Register the WebviewViewProvider
    const provider = new SidebarProvider(context.extensionUri, appServer);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('react-sidebar.view', provider)
    );

    // Register your commands here
    let disposable = vscode.commands.registerCommand('react-sidebar.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from React Sidebar!');
    });

    // Register the commands
    let startCommand = vscode.commands.registerCommand(
        'react-sidebar.startAutoFetch',
        startAutoFetch
    );

    let stopCommand = vscode.commands.registerCommand(
        'react-sidebar.stopAutoFetch',
        stopAutoFetch
    );

    let submitInstruction = vscode.commands.registerCommand(
        'react-sidebar.submitInstruction',
        async (instruction: string) => {
            submitInstruction
        }
    )

    // Add to subscriptions
    context.subscriptions.push(disposable);

    const panel = vscode.window.createWebviewPanel(
        'reactPanel', // Internal panel type
        'CODEFUSION', // Title displayed at the top
        vscode.ViewColumn.Two, // Column to show the panel in
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    context.subscriptions.push(startCommand);
    context.subscriptions.push(stopCommand);
    context.subscriptions.push(submitInstruction);
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
                    <title>CODEFUSION</title>
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

async function silentFetchAndMerge() {
    const config = {
        localRepoPath: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
        branch: 'main',
        sshKeyPath: path.join(os.homedir(), '.ssh', 'id_rsa') // Default SSH key path
    };

    if (!config.localRepoPath) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    try {
        // Set up environment with SSH agent info
        const env = {
            ...process.env,
            GIT_SSH_COMMAND: `ssh -i "${config.sshKeyPath}" -o IdentitiesOnly=yes`
        };

        // Silent fetch with SSH environment
        await execAsync('git fetch --quiet', {
            cwd: config.localRepoPath,
            env: env
        });

        // Check for changes
        const { stdout: behindCount } = await execAsync(
            `git rev-list --count HEAD..origin/${config.branch}`,
            { cwd: config.localRepoPath }
        );

        if (parseInt(behindCount) > 0) {
            const choice = await vscode.window.showInformationMessage(
                `Found ${behindCount} new commits. Merge now?`,
                'Yes', 'No'
            );

            if (choice === 'Yes') {
                const terminal = vscode.window.createTerminal('Git Auto-Merge');
                terminal.show();
                terminal.sendText(`cd "${config.localRepoPath}"`);
                terminal.sendText(`git merge --ff-only origin/${config.branch}`);
            }
        }
    } catch (error: any) {
        console.error('Auto-fetch error:', error);
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}

// This method is called when your extension is deactivated
export function deactivate() { }
