# Core
- Vite userscript entry: `src/index.tsx` mounts `src/App.tsx`.
- `App.tsx` observes SOOP `#chat_area`, normalizes messages to `I_CHAT`, and sends them to `MainStore`; keep message parsing centralized there.
- `ChatTemplate` selects `OverlayChat` or `FrameChat`; both render the shared `I_CONTENT[]` contract (`text` or `image`).
- Stack and project commands: `mem:tech_stack`, `mem:suggested_commands`, `mem:task_completion`.
- TypeScript/React formatting and patterns: `mem:conventions`.