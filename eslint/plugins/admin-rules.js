/**
 * Custom ESLint Plugin for Admin UI
 * 
 * Enforces design token usage and prevents tech debt.
 * All rules run in WARN mode - visibility over blocking.
 */

const rules = {
  // Rule 1: no-hardcoded-colors - ban bg-*, text-*, border-* with hardcoded colors
  "no-hardcoded-colors": {
    create(context) {
      const ADMIN_FILES = [
        /src\/components\/admin\//,
        /src\/app\/admin\//,
      ];

      const filename = context.filename || "";
      const isAdminFile = ADMIN_FILES.some((pattern) => pattern.test(filename));
      if (!isAdminFile) return {};

      const HARDCODED_COLOR_PATTERN =
        /\b(bg|text|border|ring|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|gray|zinc|stone|neutral)-[\d]+/;

      return {
        JSXAttribute(node) {
          if (node.type === "JSXAttribute" && node.name?.name === "className") {
            const value = node.value;
            if (
              value &&
              (value.type === "Literal" || value.type === "JSXExpressionContainer") &&
              typeof value.value === "string" &&
              HARDCODED_COLOR_PATTERN.test(value.value)
            ) {
              context.report({
                node,
                message: "Avoid hardcoded color classes. Use semantic tokens like primary, secondary, muted, destructive, accent, foreground, background, border, card instead.",
              });
            }
          }
        },
      };
    },
  },

  // Rule 2: no-hardcoded-colors-in-states - ban hover:, focus:, active: with hardcoded colors
  "no-hardcoded-colors-in-states": {
    create(context) {
      const ADMIN_FILES = [
        /src\/components\/admin\//,
        /src\/app\/admin\//,
      ];

      const filename = context.filename || "";
      const isAdminFile = ADMIN_FILES.some((pattern) => pattern.test(filename));
      if (!isAdminFile) return {};

      const HARDCODED_STATE_PATTERN =
        /\b(hover|focus|active|disabled|group-hover):(bg|text|border|ring|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|gray|zinc|stone|neutral)-[\d]+/;

      return {
        JSXAttribute(node) {
          if (node.type === "JSXAttribute" && node.name?.name === "className") {
            const value = node.value;
            if (
              value &&
              (value.type === "Literal" || value.type === "JSXExpressionContainer") &&
              typeof value.value === "string" &&
              HARDCODED_STATE_PATTERN.test(value.value)
            ) {
              context.report({
                node,
                message: "Avoid hardcoded color classes in pseudo-selectors (hover:, focus:, active:). Use semantic tokens instead.",
              });
            }
          }
        },
      };
    },
  },

  // Rule 3: no-raw-classname-in-admin - ban className on AdminCard, AdminTable, AdminFormField, PageHeader
  "no-raw-classname-in-admin": {
    create(context) {
      const ADMIN_FILES = [
        /src\/components\/admin\//,
        /src\/app\/admin\//,
      ];

      const filename = context.filename || "";
      const isAdminFile = ADMIN_FILES.some((pattern) => pattern.test(filename));
      if (!isAdminFile) return {};

      const BANNED_COMPONENTS = [
        "AdminCard",
        "AdminTable",
        "AdminFormField",
        "PageHeader",
      ];

      return {
        JSXElement(node) {
          if (
            node.openingElement?.name?.name &&
            BANNED_COMPONENTS.includes(node.openingElement.name.name)
          ) {
            const hasClassName = node.openingElement.attributes?.some(
              (attr) => attr.type === "JSXAttribute" && attr.name?.name === "className"
            );
            if (hasClassName) {
              context.report({
                node: node.openingElement,
                message: "Do not use className prop on AdminCard, AdminTable, AdminFormField, or PageHeader. These components should use design tokens exclusively.",
              });
            }
          }
        },
      };
    },
  },

  // Rule 4: no-var-color-outside-tokens
  "no-var-color-outside-tokens": {
    create(context) {
      const ADMIN_FILES = [
        /src\/components\/admin\//,
        /src\/app\/admin\//,
      ];

      const filename = context.filename || "";
      const isAdminFile = ADMIN_FILES.some((pattern) => pattern.test(filename));
      if (!isAdminFile) return {};

      const isGlobalsCss = filename.endsWith("globals.css");

      const SEMANTIC_TOKENS = [
        "--primary",
        "--primary-foreground",
        "--secondary",
        "--secondary-foreground",
        "--muted",
        "--muted-foreground",
        "--accent",
        "--accent-foreground",
        "--destructive",
        "--destructive-foreground",
        "--foreground",
        "--background",
        "--border",
        "--input",
        "--ring",
        "--card",
        "--card-foreground",
        "--popover",
        "--popover-foreground",
        "--success",
        "--success-foreground",
        "--chart-1",
        "--chart-2",
        "--chart-3",
        "--chart-4",
        "--chart-5",
        "--sidebar",
        "--sidebar-foreground",
        "--sidebar-primary",
        "--sidebar-primary-foreground",
        "--sidebar-accent",
        "--sidebar-accent-foreground",
        "--sidebar-border",
        "--sidebar-ring",
        "--radius",
      ];

      const LEGACY_VARS = [
        "--button-primary-bg",
        "--button-primary-foreground",
        "--button-secondary-bg",
        "--button-secondary-foreground",
        "--button-secondary-border",
        "--card-bg",
        "--card-border",
        "--input-bg",
        "--input-border",
        "--input-foreground",
        "--input-placeholder",
        "--icon-badge-bg",
      ];

      const VAR_PATTERN = /var\(--([^)]+)\)/g;

      function checkNode(node) {
        if (isGlobalsCss) return;

        const code = "value" in node && typeof node.value === "string" ? node.value : context.getSourceCode().getText(node);
        let match;

        while ((match = VAR_PATTERN.exec(code)) !== null) {
          const varName = match[1];
          const isSemantic = SEMANTIC_TOKENS.includes(`--${varName}`);
          const isLegacy = LEGACY_VARS.includes(`--${varName}`);

          if (!isSemantic && !isLegacy) {
            context.report({
              node,
              message: "Only use semantic CSS variables (--primary, --secondary, --muted, etc.). Legacy component variables like --button-*, --card-bg are not allowed.",
            });
          }
        }
      }

      return {
        TemplateLiteral(node) {
          checkNode(node);
        },
        Literal(node) {
          if (typeof node.value === "string") {
            checkNode(node);
          }
        },
      };
    },
  },

  // Rule 5: no-window-alert - ban window.alert, window.confirm
  "no-window-alert": {
    create(context) {
      const ADMIN_FILES = [
        /src\/components\/admin\//,
        /src\/app\/admin\//,
      ];

      const filename = context.filename || "";
      const isAdminFile = ADMIN_FILES.some((pattern) => pattern.test(filename));
      if (!isAdminFile) return {};

      return {
        CallExpression(node) {
          const callee = node.callee;

          // Check for alert() or confirm() direct calls
          if (
            callee.type === "Identifier" &&
            (callee.name === "alert" || callee.name === "confirm")
          ) {
            context.report({
              node,
              message: "Do not use window.alert() or window.confirm(). Use a custom modal/dialog component instead.",
            });
          }

          // Check for window.alert or window.confirm
          if (
            callee.type === "MemberExpression" &&
            callee.object.type === "Identifier" &&
            callee.object.name === "window" &&
            callee.property.type === "Identifier" &&
            (callee.property.name === "alert" ||
              callee.property.name === "confirm")
          ) {
            context.report({
              node,
              message: "Do not use window.alert() or window.confirm(). Use a custom modal/dialog component instead.",
            });
          }
        },
      };
    },
  },
};

export default { rules };
