import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        "background-secondary": "hsl(var(--background-secondary))",
        "background-tertiary": "hsl(var(--background-tertiary))",
        foreground: "hsl(var(--foreground))",
        "foreground-muted": "hsl(var(--foreground-muted))",
        "foreground-subtle": "hsl(var(--foreground-subtle))",
        text: {
          DEFAULT: "hsl(var(--text))",
          muted: "hsl(var(--text-muted))",
          subtle: "hsl(var(--text-subtle))",
        },
        other: {
          DEFAULT: "hsl(var(--other))",
          light: "hsl(var(--other-light))",
          dark: "hsl(var(--other-dark))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          border: "hsl(var(--card-border))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          bg: "hsl(var(--sidebar-bg))",
          hover: "hsl(var(--sidebar-item-hover))",
          active: "hsl(var(--sidebar-item-active))",
        },
        status: {
          todo: "hsl(var(--status-todo))",
          "in-progress": "hsl(var(--status-in-progress))",
          "in-review": "hsl(var(--status-in-review))",
          done: "hsl(var(--status-done))",
          backlog: "hsl(var(--status-backlog))",
          cancelled: "hsl(var(--status-cancelled))",
        },
        priority: {
          urgent: "hsl(var(--priority-urgent))",
          high: "hsl(var(--priority-high))",
          medium: "hsl(var(--priority-medium))",
          low: "hsl(var(--priority-low))",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
    },
  },
  plugins: [],
};

export default config;
