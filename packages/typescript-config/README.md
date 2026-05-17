# 📚 @repo/typescript-config

This package provides a set of reusable TypeScript configurations for projects within the Noda Turbo monorepo. It aims to ensure consistent TypeScript settings across all applications and packages, promoting code quality and type safety.

## Overview

Instead of defining `tsconfig.json` from scratch in every project, this package centralizes common configurations, allowing other projects to extend from them. This simplifies setup and ensures all TypeScript code adheres to the same standards.

## Usage

To use this shared TypeScript configuration in an application or package within the `noda_turbo` monorepo, simply extend the desired base configuration in your project's `tsconfig.json`.

1.  **Install the package:**
    In your `apps/<your-app-name>/package.json` or `packages/<your-package-name>/package.json`, add this as a `devDependency`:

    ```json
    {
      "devDependencies": {
        "@repo/typescript-config": "workspace:*"
      }
    }
    ```

2.  **Extend the configuration:**
    In your project's `tsconfig.json` (e.g., `apps/dashboard-frontend/tsconfig.json`), extend the base configuration:

    ```json
    // apps/dashboard-frontend/tsconfig.json
    {
      "extends": "@repo/typescript-config/nextjs.json", // Or base.json for non-Next.js apps
      "compilerOptions": {
        // Your specific compiler options for this project, if any
        "outDir": "./dist",
        "rootDir": "./src"
      },
      "include": ["src/**/*.ts", "src/**/*.tsx"],
      "exclude": ["node_modules", "dist"]
    }
    ```

### Available Configurations

* `base.json`: Fundamental TypeScript settings applicable to most Node.js or general TypeScript projects.
* `nextjs.json`: Configuration specifically tailored for Next.js applications, extending `base.json` and including Next.js-specific settings.
* `react-library.json`: Configuration for shared React component libraries within the `packages/` directory.

