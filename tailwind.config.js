/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        coal: '#050505',
        graphite: '#0f0f13',
        ash: '#19191f',
        fog: '#f5f5f5',
      },
      boxShadow: {
        depth: '0 35px 120px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}

