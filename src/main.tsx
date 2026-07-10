import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./styles.css";
import "./sync.css";
import "./error-boundary.css";
import "./voice.css";
import "./pos.css";
import "./premier.css";
import "./target-ui.css";
import "./start-screen-fix.css";
import "./start-screen-clean.css";
import "./logo-mark.css";
import "./order-heading-tweak.css";
import "./order-page-clean.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
