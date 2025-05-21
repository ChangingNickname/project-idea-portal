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
  "themes": {
    "light": {
      "colors": {
        "default": {
          "50": "#f0eff8",
          "100": "#dcd8ee",
          "200": "#c7c1e3",
          "300": "#b2aad9",
          "400": "#9e93cf",
          "500": "#897cc5",
          "600": "#7166a3",
          "700": "#595180",
          "800": "#413b5e",
          "900": "#29253b",
          "foreground": "#000",
          "DEFAULT": "#897cc5"
        },
        "primary": {
          "50": "#eee4f8",
          "100": "#d7bfef",
          "200": "#bf99e5",
          "300": "#a773db",
          "400": "#904ed2",
          "500": "#7828c8",
          "600": "#6321a5",
          "700": "#4e1a82",
          "800": "#39135f",
          "900": "#240c3c",
          "foreground": "#fff",
          "DEFAULT": "#7828c8"
        },
        "secondary": {
          "50": "#e9ecfd",
          "100": "#cbd2fa",
          "200": "#acb8f7",
          "300": "#8e9ef5",
          "400": "#6f83f2",
          "500": "#5169ef",
          "600": "#4357c5",
          "700": "#35449b",
          "800": "#263272",
          "900": "#182048",
          "foreground": "#000",
          "DEFAULT": "#5169ef"
        },
        "success": {
          "50": "#e8fdf4",
          "100": "#c7f9e4",
          "200": "#a7f6d5",
          "300": "#86f3c5",
          "400": "#66efb6",
          "500": "#45eca6",
          "600": "#39c389",
          "700": "#2d996c",
          "800": "#21704f",
          "900": "#154732",
          "foreground": "#000",
          "DEFAULT": "#45eca6"
        },
        "warning": {
          "50": "#fff5df",
          "100": "#ffe8b3",
          "200": "#ffda86",
          "300": "#ffcc59",
          "400": "#ffbf2d",
          "500": "#ffb100",
          "600": "#d29200",
          "700": "#a67300",
          "800": "#795400",
          "900": "#4d3500",
          "foreground": "#000",
          "DEFAULT": "#ffb100"
        },
        "danger": {
          "50": "#ffe9e9",
          "100": "#ffcaca",
          "200": "#ffabab",
          "300": "#ff8d8d",
          "400": "#ff6e6e",
          "500": "#ff4f4f",
          "600": "#d24141",
          "700": "#a63333",
          "800": "#792626",
          "900": "#4d1818",
          "foreground": "#000",
          "DEFAULT": "#ff4f4f"
        },
        "background": "#f9f9fb",
        "foreground": "#4a3d77",
        "content1": {
          "DEFAULT": "#f2e8ff",
          "foreground": "#000"
        },
        "content2": {
          "DEFAULT": "#e8daff",
          "foreground": "#000"
        },
        "content3": {
          "DEFAULT": "#dccbff",
          "foreground": "#000"
        },
        "content4": {
          "DEFAULT": "#cfbcff",
          "foreground": "#000"
        },
        "focus": "#7828c8",
        "overlay": "#000000"
      }
    },
    "dark": {
      "colors": {
        "default": {
          "50": "#0c192f",
          "100": "#18325f",
          "200": "#244b8e",
          "300": "#3064be",
          "400": "#3c7ded",
          "500": "#6397f1",
          "600": "#8ab1f4",
          "700": "#b1cbf8",
          "800": "#d8e5fb",
          "900": "#ffffff",
          "foreground": "#000",
          "DEFAULT": "#3c7ded"
        },
        "primary": {
          "50": "#2c193f",
          "100": "#462764",
          "200": "#603689",
          "300": "#7944ae",
          "400": "#9353d3",
          "500": "#a671db",
          "600": "#b98fe2",
          "700": "#ccadea",
          "800": "#dfcbf2",
          "900": "#f2eafa",
          "foreground": "#fff",
          "DEFAULT": "#9353d3"
        },
        "secondary": {
          "50": "#182048",
          "100": "#263272",
          "200": "#35449b",
          "300": "#4357c5",
          "400": "#5169ef",
          "500": "#6f83f2",
          "600": "#8e9ef5",
          "700": "#acb8f7",
          "800": "#cbd2fa",
          "900": "#e9ecfd",
          "foreground": "#000",
          "DEFAULT": "#5169ef"
        },
        "success": {
          "50": "#154732",
          "100": "#21704f",
          "200": "#2d996c",
          "300": "#39c389",
          "400": "#45eca6",
          "500": "#66efb6",
          "600": "#86f3c5",
          "700": "#a7f6d5",
          "800": "#c7f9e4",
          "900": "#e8fdf4",
          "foreground": "#000",
          "DEFAULT": "#45eca6"
        },
        "warning": {
          "50": "#4d3d11",
          "100": "#79601c",
          "200": "#a68326",
          "300": "#d2a730",
          "400": "#ffca3a",
          "500": "#ffd35c",
          "600": "#ffdd7f",
          "700": "#ffe6a1",
          "800": "#ffefc4",
          "900": "#fff8e6",
          "foreground": "#000",
          "DEFAULT": "#ffca3a"
        },
        "danger": {
          "50": "#4d2020",
          "100": "#793333",
          "200": "#a64646",
          "300": "#d25858",
          "400": "#ff6b6b",
          "500": "#ff8585",
          "600": "#ff9f9f",
          "700": "#ffb9b9",
          "800": "#ffd3d3",
          "900": "#ffeded",
          "foreground": "#000",
          "DEFAULT": "#ff6b6b"
        },
        "background": "#1e223b",
        "foreground": "#d0aaff",
        "content1": {
          "DEFAULT": "#392a4a",
          "foreground": "#fff"
        },
        "content2": {
          "DEFAULT": "#4c3560",
          "foreground": "#fff"
        },
        "content3": {
          "DEFAULT": "#5e4180",
          "foreground": "#fff"
        },
        "content4": {
          "DEFAULT": "#704ea0",
          "foreground": "#fff"
        },
        "focus": "#9353d3",
        "overlay": "#ffffff"
      }
    }
  },
  "layout": {
    "disabledOpacity": "0.5"
  }
})],

}

module.exports = config;

