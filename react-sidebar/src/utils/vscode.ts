import { v4 as uuidv4 } from "uuid";

const vscode = acquireVsCodeApi();

/**
 * Makes a request to the extension backend via the VS Code webview messaging API
 * @param endpoint The endpoint to send the request to
 * @param data The data to send with the request. Do not stringify this - it will be handled by the extension.
 * @returns A promise that resolves with the response data or rejects with an error
 */
export async function extensionFetch(endpoint: any, data: any) {
    const requestId = uuidv4();
    return new Promise((resolve, reject) => {
        vscode.postMessage({
            type: "request",
            endpoint,
            data,
            requestId,
        });

        window.addEventListener("message", function responseListener(event) {
            const message = event.data;
            if (
                message.type === "response" &&
                message.endpoint === endpoint &&
                message.requestId === requestId
            ) {
                window.removeEventListener("message", responseListener);
                if (message.error) {
                    reject(new Error(message.error));
                } else {
                    resolve(message.data);
                }
            }
        });
    });
}
