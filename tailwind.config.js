/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./extension/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        glass: "0 10px 35px rgba(15, 23, 42, 0.18)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top, rgba(96, 165, 250, 0.22), transparent 42%), radial-gradient(circle at right, rgba(168, 85, 247, 0.16), transparent 24%)"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};
