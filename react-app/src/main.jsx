import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DbProvider } from "./context/DbContext";
import { UiProvider } from "./context/UiContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DbProvider>
        <UiProvider>
          <App />
        </UiProvider>
      </DbProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
