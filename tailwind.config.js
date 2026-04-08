module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Exclude legacy-hrapp.css from Tailwind processing
    "!./src/legacy-hrapp.css"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};