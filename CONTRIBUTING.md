## Contributing

Thanks for your interest in contributing! A few guidelines to help you get started:

- Use Node.js 20+ and pnpm. Rust stable with `wasm-pack` is required to build WASM.
- Run `pnpm install`, then `pnpm run build-rust` and `pnpm run build`.
- Lint before pushing: `pnpm run lint` (or `pnpm run lintfix`).
- Keep changes focused and include rationale in PR descriptions.
- For larger features, please open an issue first to discuss design and scope.

### Development

- Node code lives under `nodes/` and `shared/`.
- Rust core lives under `src-rust/` and is compiled to WASM via `wasm-pack`.
- Build outputs go to `dist/` (gitignored) and are included on publish via `files` in `package.json`.

### Release

- Use semantic versioning.
- Update the changelog (if present) and README as needed.

