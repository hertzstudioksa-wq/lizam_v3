/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#23324D",
          deep: "#121A2A",
          soft: "#2B3C5C",
          hover: "#1A253A",
        },
        brass: {
          DEFAULT: "#B89B5E",
          hover: "#A18751",
          soft: "#CDB27A",
        },
        ivory: {
          DEFAULT: "#FAF9F6",
          cream: "#F3EFE6",
        },
        paper: "#F7F8FA",
        rule: "#E4E7EC",
        ink: "#1D2939",
        mute: "#667085",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        arabic: ['"Thmanyah Sans"', '"IBM Plex Sans Arabic"', "system-ui", "sans-serif"],
        sans: ['"Thmanyah Sans"', "Inter", "system-ui", "sans-serif"],
        serif: ['"Thmanyah Serif Display"', '"Source Serif 4"', "Georgia", "serif"],
        serifText: ['"Thmanyah Serif Text"', '"Source Serif 4"', "Georgia", "serif"],
      },
      fontSize: {
        "display-ar": ["clamp(2.4rem, 5vw, 4.5rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "display-en": ["clamp(2.2rem, 4.5vw, 4.2rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      transitionTimingFunction: {
        institute: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slow-reveal": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slow-reveal": "slow-reveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
