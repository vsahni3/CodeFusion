import * as vscode from "vscode";


export class Server {
    private endpoints: { [key: string]: (data: any) => Promise<any> };

    constructor() {
        this.endpoints = {};
    }

    public async handleMessage(message: any, webview: vscode.WebviewView) {
        if (message.type === "request") {
            await this.handleRequest(message.endpoint, message.data)
                .then((result) => {
                    webview.webview.postMessage({
                        type: "response",
                        endpoint: message.endpoint,
                        data: result,
                        requestId: message.requestId,
                    });
                })
                .catch((error) => {
                    webview.webview.postMessage({
                        type: "response",
                        endpoint: message.endpoint,
                        error: error.message,
                        requestId: message.requestId,
                    });
                });
        }
    }

    public async handleRequest(endpoint: string, data: any) {
        // Extract URL parameters if endpoint contains them
        const urlPattern = new RegExp(endpoint.replace(/:(\w+)/g, "(?<$1>[^/]+)"));
        const match = endpoint.match(urlPattern);
        const params = match?.groups || {};

        switch (endpoint) {
            case "/hello":
                vscode.window.showInformationMessage("Hello from the extension!");
                return { message: "Hello from the extension!" };
            default:
                throw new Error(`Unknown endpoint: ${endpoint}`);
        }
    }
}
const appServer = new Server();

export default appServer;