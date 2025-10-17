import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const elem = document.getElementById("root");
if (!elem) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(elem).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
