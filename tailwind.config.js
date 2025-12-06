export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 50:"#F3F5FA",100:"#E6EBF4",500:"#1E3A8A",600:"#172B6E",700:"#0D1F5A" },
        blue: { 500:"#3B82F6", 600:"#2563EB", 700:"#1D4ED8" }
      }
    },
  },
  plugins: [],
}