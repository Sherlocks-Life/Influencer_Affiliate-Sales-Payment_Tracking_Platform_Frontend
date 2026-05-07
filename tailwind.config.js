/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        dark: "#0f172a"
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,0.05)",
        glass: "0 8px 32px rgba(0,0,0,0.1)"
      },
      backdropBlur: {
        xs: "2px"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    },
  },
  plugins: [],
};