/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Nunito', 'sans-serif'], // Rounded terminals for clay aesthetic
        body: ['"DM Sans"', 'sans-serif'], // Geometric and clean
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "#F0F9FF", // Canvas: Sky 50 (Ice White)
          surface: "#FFFFFF",
        },
        foreground: {
          DEFAULT: "#1E293B", // Slate 800
          muted: "#64748B", // Slate 500
        },
        clay: {
          cardBg: "#F0F9FF",
          foreground: "#1E293B",
          muted: "#64748B",
          accent: "#2563EB", // Electric Blue
          "accent-alt": "#DB2777", // Hot Pink
        },
        primary: {
          DEFAULT: "#2563EB", // Electric Blue (Blue 600)
          foreground: "#ffffff",
          hover: "#1D4ED8", // Blue 700
        },
        secondary: {
          DEFAULT: "#60A5FA", // Soft Blue (Blue 400)
          foreground: "#ffffff",
        },
        tertiary: {
          DEFAULT: "#0EA5E9", // Sky Blue
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#10B981", // Emerald Green
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F1F5F9", // Slate 100
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#2563EB",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#332F3A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#332F3A",
        },
      },
      borderRadius: {
        '3xl': '2rem', // 32px
        '4xl': '2.5rem', // 40px
        '5xl': '3rem', // 48px
        '6xl': '3.75rem', // 60px
      },
      boxShadow: {
        // 4-layer shadow stacks
        'clayCard': '16px 16px 32px rgba(160, 150, 180, 0.2), -10px -10px 24px rgba(255, 255, 255, 0.9), inset 6px 6px 12px rgba(139, 92, 246, 0.03), inset -6px -6px 12px rgba(255, 255, 255, 1)',
        'clayCardHover': '20px 20px 40px rgba(160, 150, 180, 0.25), -12px -12px 28px rgba(255, 255, 255, 0.95), inset 6px 6px 12px rgba(139, 92, 246, 0.03), inset -6px -6px 12px rgba(255, 255, 255, 1)',
        'clayButton': '12px 12px 24px rgba(139, 92, 246, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.4), inset 4px 4px 8px rgba(255, 255, 255, 0.4), inset -4px -4px 8px rgba(0, 0, 0, 0.1)',
        'clayButtonHover': '14px 14px 28px rgba(139, 92, 246, 0.35), -8px -8px 16px rgba(255, 255, 255, 0.45), inset 4px 4px 8px rgba(255, 255, 255, 0.45), inset -4px -4px 8px rgba(0, 0, 0, 0.1)',
        'clayPressed': 'inset 10px 10px 20px #d9d4e3, inset -10px -10px 20px #ffffff',
        'deepClay': '30px 30px 60px #cdc6d9, -30px -30px 60px #ffffff, inset 10px 10px 20px rgba(139, 92, 246, 0.05), inset -10px -10px 20px rgba(255, 255, 255, 0.8)',
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'clay-float': 'clay-float 8s ease-in-out infinite',
        'clay-float-delayed': 'clay-float-delayed 10s ease-in-out infinite',
        'clay-float-slow': 'clay-float-slow 12s ease-in-out infinite',
        'clay-breathe': 'clay-breathe 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'clay-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        'clay-float-delayed': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-2deg)' },
        },
        'clay-float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) rotate(5deg)' },
        },
        'clay-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
};
