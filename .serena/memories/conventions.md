# Conventions
- TypeScript/React project; follow `.prettierrc`: 4 spaces, single quotes, semicolons, trailing commas, 120-column print width.
- Use function components; MobX-backed UI uses `observer` and shared state from `@Stores`.
- Less modules are colocated as `style.module.less`; path aliases map `@Components`, `@Stores`, `@Templates`, `@Utils`, etc.