import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Martin Dow · Tableau AI Assistant",
  description: "AI-powered analytics copilot for Martin Dow",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem("md-settings");
    var mode = raw ? JSON.parse(raw).state.themeMode : "dark";
    if (mode === "light") document.documentElement.classList.add("light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
