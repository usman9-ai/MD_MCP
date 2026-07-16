"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/store";

export function useThemeSync() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  useEffect(() => {
    document.documentElement.classList.toggle("light", themeMode === "light");
  }, [themeMode]);
}
