import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#BBE235",
        "primary-hover": "#A3C929",
        "background-light": "#F9F8F3",
        "background-dark": "#F9F8F3",
        "surface-dark": "#0C3528",
        "surface-lighter": "#123D2D",
        "border-dark": "#1B4B39",
        "border-gold": "#BBE235",
        "text-main": "#0C3528",
        "text-secondary": "#4A6357",
        "text-gold": "#BBE235",
        "text-muted": "#9BAEA3",
        "ink": "#0C3528",
        "accent-pink": "#ec4899",
        "accent-lilac": "#d8b4fe",
        "soft-pink": "#fceeff",
        "lavender": "#e6e6fa",
        "charcoal": "#0C3528",
        "charcoal-surface": "#F3F1E8",
        "charcoal-lighter": "#123D2D",
        "perfume-green": "#0C3528",
        "perfume-lime": "#BBE235",
        "perfume-sand": "#F9F8F3",
        "perfume-sand-dark": "#EFECE5",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"],
        "body": ["Noto Sans", "sans-serif"],
        "serif": ["Noto Serif", "serif"],
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-right": "slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-left": "slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [forms, containerQueries],
};
