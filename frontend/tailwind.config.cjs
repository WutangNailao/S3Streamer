/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "IBM Plex Sans", "sans-serif"],
        body: ["IBM Plex Sans", "Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        ink: "#0f172a",
        mist: "#eef2ff",
        ocean: "#2563eb",
        leaf: "#16a34a",
      },
    },
  },
  plugins: [],
};
