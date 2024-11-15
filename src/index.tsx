import React from "react";
import { createRoot } from "react-dom/client";
import "./global.less";
import App from "./App";
import { awaitElement, log, addLocationChangeCallback } from "./Utils";
import { StoreProvider } from "./Stores";

log("SOOP 채팅 스타일러 - 비콩");

async function main() {
    const body = await awaitElement("body > div");
    const container = document.createElement("div");
    body.appendChild(container);
    const root = createRoot(container);
    root.render(
        <StoreProvider>
            <App />
        </StoreProvider>
    );
}

addLocationChangeCallback(() => {
    main().catch((e) => {
        log(e);
    });
});
