
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import InstallAppButton from "./components/InstallAppButton.jsx";

import "./index.css";
import "./ThemeOverrides.css";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <>
            <App />
            <InstallAppButton />
        </>
    </React.StrictMode>
);
