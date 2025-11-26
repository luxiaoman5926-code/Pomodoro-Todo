/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // 启用 class 策略
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // 保留 Stone 色系作为浅色模式基础
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // 恢复原有暗色系配色，命名为 dark-*
        coal: '#050505',
        graphite: '#0f0f13',
        ash: '#19191f',
        fog: '#f5f5f5',
      },
      boxShadow: {
        card: '0 20px 40px -15px rgba(0,0,0,0.05)',
        depth: '0 35px 120px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}
