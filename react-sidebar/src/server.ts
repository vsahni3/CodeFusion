import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import * as vscode from "vscode";

export class Server {
    private endpoints: { [key: string]: (data: any) => Promise<any> };
    private recordingProcess: ChildProcess | null = null;
    private outputPath: string = "";

    constructor() {
        this.endpoints = {};
    }

    public async handleMessage(message: any, webview: vscode.WebviewView) {
        if (message.type === "request") {
            await this.handleRequest(message.endpoint, message.data, webview)
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

    public async handleRequest(endpoint: string, data: any, webview: vscode.WebviewView) {
        // Extract URL parameters if endpoint contains them
        const urlPattern = new RegExp(endpoint.replace(/:(\w+)/g, "(?<$1>[^/]+)"));
        const match = endpoint.match(urlPattern);
        const params = match?.groups || {};

        switch (endpoint) {
            case "/hello":
                vscode.window.showInformationMessage("Hello from the extension!");
                return { message: "Hello from the extension!" };

            case "/startRecording":
                vscode.window.showInformationMessage("Starting screen recording...");

                // Determine output file path (using the OS temporary directory)
                this.outputPath = path.join("/tmp", "recording.mp4");

                let args: string[] = [];
                // Set ffmpeg arguments based on the platform.
                if (process.platform === "darwin") {
                    args = [
                        "-y",
                        "-f", "avfoundation",
                        "-framerate", "30",
                        "-i", "3:0",
                        "-vcodec", "libx264", // Software encoding with libx264
                        "-pix_fmt", "yuv420p",
                        "-profile:v", "baseline", // or "main"
                        "-level", "3.0",
                        "-c:a", "aac",
                        "-b:a", "128k",
                        "-ar", "44100",
                        "-movflags", "+faststart",
                        this.outputPath,
                    ];
                } else if (process.platform === "win32") {
                    // Windows: use gdigrab.
                    args = [
                        "-y",
                        "-f", "gdigrab",
                        "-framerate", "30",
                        "-i", "desktop",
                        this.outputPath,
                    ];
                } else if (process.platform === "linux") {
                    // Linux: use x11grab.
                    args = [
                        "-y",
                        "-f", "x11grab",
                        "-framerate", "30",
                        "-i", ":0.0",
                        this.outputPath,
                    ];
                } else {
                    throw new Error(`Unsupported platform: ${process.platform}`);
                }

                // Spawn the ffmpeg process to start recording.
                this.recordingProcess = spawn("ffmpeg", args);

                // Log ffmpeg stderr output (using optional chaining to avoid null issues)
                this.recordingProcess.stderr?.on("data", (data) => {
                    console.log(`FFmpeg stderr: ${data}`);
                });

                this.recordingProcess.on("error", (err) => {
                    vscode.window.showErrorMessage(`FFmpeg error: ${err.message}`);
                });

                return { success: true, message: "Screen recording started" };

            case "/stopRecording":
                if (this.recordingProcess) {
                    // Send SIGINT to gracefully stop ffmpeg
                    this.recordingProcess.kill("SIGINT");
                    this.recordingProcess = null;
                    vscode.window.showInformationMessage("Screen recording stopped");

                    // Create a VS Code URI from the file path
                    const fileUri = vscode.Uri.file(this.outputPath);
                    // Convert to webview URI
                    const webviewUri = webview.webview.asWebviewUri(fileUri);

                    return {
                        success: true,
                        file: webviewUri.toString(), // Send the webview URI as string
                        message: "Screen recording stopped",
                    };
                } else {
                    throw new Error("No recording process found");
                }

            default:
                throw new Error(`Unknown endpoint: ${endpoint}`);
        }
    }
}

const appServer = new Server();
export default appServer;