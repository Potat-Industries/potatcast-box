import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./index.css";
import { LocaleProvider } from "./providers/LocaleProvider";
import { StatusProvider } from "./providers/StatusProvider";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Missing root element (#root)");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.PUBLIC_URL}>
      <LocaleProvider>
        <StatusProvider>
          <App />
        </StatusProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
