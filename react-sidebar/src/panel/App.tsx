import React from "react";
import { extensionFetch } from "../utils/vscode";

export function App() {
    return (
        <div>
            <h1 className="text-red-700">Hello from React!</h1>
            <button onClick={async () => {console.log('Button clicked!');
                await extensionFetch("/hello", {}).then((response) => {
                    console.log(response);
                });
            }}>
                Click me
            </button>
        </div>
    );
}
