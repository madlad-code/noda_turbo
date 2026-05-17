# 🧹 @repo/eslint-config

This package provides a set of shareable ESLint configurations for consistent code quality and style across all projects within the Noda Turbo monorepo. It helps enforce best practices, prevent common errors, and maintain a uniform codebase.

## Overview

Instead of setting up ESLint individually for each application or package, this centralized configuration ensures that all JavaScript/TypeScript code adheres to the same linting rules. It includes specialized configurations for Next.js and React environments.

## Usage

To use these shared ESLint configurations in an application or package within the `noda_turbo` monorepo:

1.  **Install the package:**
    In your `apps/<your-app-name>/package.json` or `packages/<your-package-name>/package.json`, add this as a `devDependency`:

    ```json
    {
      "devDependencies": {
        "@repo/eslint-config": "workspace:*"
      }
    }
    ```

2.  **Extend the configuration:**
    In your project's ESLint configuration file (e.g., `eslint.config.js` or `.eslintrc.js`), extend the desired base configuration:

    ```javascript
    // eslint.config.js (for ESLint Flat Config)
    import baseConfig from '@repo/eslint-config/base';
    import nextConfig from '@repo/eslint-config/next'; // For Next.js apps
    import reactConfig from '@repo/eslint-config/react-internal'; // For React-based apps/libraries

    export default [
      ...baseConfig,
      // ...nextConfig, // Uncomment and include for Next.js apps
      // ...reactConfig, // Uncomment and include for React apps/libraries
      {
        // Your project-specific overrides or additional rules here
        rules: {
          'no-console': 'warn',
        },
      },
    ];
    ```
    (Note: If you're using legacy `.eslintrc.js` or `package.json` config, the `extends` syntax will be different, e.g., `"extends": ["@repo/eslint-config/base", ...]`.)

### Available Configurations

* `base.js`: Core ESLint rules applicable to all JavaScript/TypeScript code.
* `next.js`: Extends `base.js` and adds Next.js-specific linting rules.
* `react-internal.js`: Extends `base.js` and adds React-specific linting rules, typically used for shared UI packages.

## Contributing

For general monorepo contribution guidelines, refer to the [Root README](../../README.md).

For contributing to this specific ESLint configuration package, ensure any changes are widely applicable and do not introduce breaking changes without proper versioning.