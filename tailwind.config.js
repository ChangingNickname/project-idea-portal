import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: "#f8fafc",
          foreground: "#1e293b",
          primary: {
            50: "#1e293b",
            100: "#27304a",
            200: "#31395a",
            300: "#3b426a",
            400: "#455b8a",
            500: "#6366f1",
            600: "#7c83f6",
            700: "#a5b4fc",
            800: "#c7d2fe",
            900: "#f8fafc",
            foreground: "#fff",
            DEFAULT: "#6366f1"
          },
          secondary: {
            50: "#111827",
            100: "#1f2937",
            200: "#374151",
            300: "#4b5563",
            400: "#6b7280",
            500: "#9ca3af",
            600: "#d1d5db",
            700: "#e5e7eb",
            800: "#f3f4f6",
            900: "#f9fafb",
            foreground: "#1e293b",
            DEFAULT: "#f1f5f9"
          },
          success: {
            50: "#14532d",
            100: "#166534",
            200: "#15803d",
            300: "#16a34a",
            400: "#22c55e",
            500: "#4ade80",
            600: "#86efac",
            700: "#bbf7d0",
            800: "#dcfce7",
            900: "#f0fdf4",
            foreground: "#fff",
            DEFAULT: "#22c55e"
          },
          warning: {
            50: "#78350f",
            100: "#b45309",
            200: "#d97706",
            300: "#f59e42",
            400: "#fbbf24",
            500: "#fde68a",
            600: "#fef3c7",
            700: "#fff7ed",
            800: "#fffbea",
            900: "#fefce8",
            foreground: "#1e293b",
            DEFAULT: "#facc15"
          },
          danger: {
            50: "#7f1d1d",
            100: "#991b1b",
            200: "#b91c1c",
            300: "#dc2626",
            400: "#ef4444",
            500: "#f87171",
            600: "#fca5a5",
            700: "#fecaca",
            800: "#fee2e2",
            900: "#fef2f2",
            foreground: "#fff",
            DEFAULT: "#ef4444"
          },
          content1: {
            DEFAULT: "#f3f4f6",
            foreground: "#1e293b"
          },
          content2: {
            DEFAULT: "#e5e7eb",
            foreground: "#1e293b"
          },
          content3: {
            DEFAULT: "#d1d5db",
            foreground: "#1e293b"
          },
          content4: {
            DEFAULT: "#9ca3af",
            foreground: "#1e293b"
          },
          focus: "#6366f1",
          overlay: "#000000"
        }
      },
      dark: {
        colors: {
          background: "#18181b",
          foreground: "#f4f4f5",
          primary: {
            50: "#f8fafc",
            100: "#c7d2fe",
            200: "#a5b4fc",
            300: "#7c83f6",
            400: "#6366f1",
            500: "#455b8a",
            600: "#3b426a",
            700: "#31395a",
            800: "#27304a",
            900: "#1e293b",
            foreground: "#18181b",
            DEFAULT: "#818cf8"
          },
          secondary: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
            foreground: "#f4f4f5",
            DEFAULT: "#27272a"
          },
          success: {
            50: "#f0fdf4",
            100: "#dcfce7",
            200: "#bbf7d0",
            300: "#86efac",
            400: "#4ade80",
            500: "#22c55e",
            600: "#16a34a",
            700: "#15803d",
            800: "#166534",
            900: "#14532d",
            foreground: "#18181b",
            DEFAULT: "#22d3ee"
          },
          warning: {
            50: "#fefce8",
            100: "#fffbea",
            200: "#fff7ed",
            300: "#fef3c7",
            400: "#fde68a",
            500: "#fbbf24",
            600: "#f59e42",
            700: "#d97706",
            800: "#b45309",
            900: "#78350f",
            foreground: "#18181b",
            DEFAULT: "#fde68a"
          },
          danger: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d",
            foreground: "#18181b",
            DEFAULT: "#f87171"
          },
          content1: {
            DEFAULT: "#27272a",
            foreground: "#f4f4f5"
          },
          content2: {
            DEFAULT: "#3f3f46",
            foreground: "#f4f4f5"
          },
          content3: {
            DEFAULT: "#52525b",
            foreground: "#f4f4f5"
          },
          content4: {
            DEFAULT: "#71717a",
            foreground: "#f4f4f5"
          },
          focus: "#818cf8",
          overlay: "#000000"
        }
      }
    },
    layout: {
      disabledOpacity: "0.5"
    }
  })],
}

module.exports = config;

 