import React from "react";

export function App() {
    return (
        <div>
            <h1 className="text-red-700">Hello from React!</h1>
            <button onClick={() => console.log('Button clicked!')}>
                Click me
            </button>
        </div>
    );
}
