"use client";

import { useEffect, useRef } from "react";

export default function BMCWidget() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Remove any existing BMC button to avoid duplicates
    const existing = document.getElementById("bmc-wbtn");
    if (existing) existing.remove();

    const btn = document.createElement("div");
    btn.id = "bmc-wbtn";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.width = "56px";
    btn.style.height = "56px";
    btn.style.background = "#FCBB00";
    btn.style.borderRadius = "50%";
    btn.style.position = "fixed";
    btn.style.right = "18px";
    btn.style.bottom = "18px";
    btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    btn.style.zIndex = "9999";
    btn.style.cursor = "pointer";
    btn.style.transition = "transform 0.2s ease";
    btn.innerHTML =
      '<img src="https://cdn.buymeacoffee.com/widget/assets/coffee%20cup.svg" alt="Buy Me a Coffee" style="height: 30px; width: 30px; margin: 0; padding: 0; pointer-events: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">';

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.1)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", () => {
      let iframe = document.getElementById("bmc-iframe") as HTMLIFrameElement | null;
      if (iframe) {
        iframe.style.display = iframe.style.display === "none" ? "block" : "none";
        return;
      }

      // Create backdrop
      const backdrop = document.createElement("div");
      backdrop.id = "bmc-backdrop";
      backdrop.style.position = "fixed";
      backdrop.style.top = "0";
      backdrop.style.left = "0";
      backdrop.style.width = "100%";
      backdrop.style.height = "100%";
      backdrop.style.background = "rgba(0,0,0,0.6)";
      backdrop.style.zIndex = "9998";
      backdrop.style.display = "flex";
      backdrop.style.alignItems = "center";
      backdrop.style.justifyContent = "center";
      backdrop.style.backdropFilter = "blur(4px)";

      iframe = document.createElement("iframe");
      iframe.id = "bmc-iframe";
      iframe.src = "https://www.buymeacoffee.com/widget/page/opencircuit?description=Support%20me%20on%20Buy%20me%20a%20coffee!&color=%23FCBB00";
      iframe.style.width = "100%";
      iframe.style.maxWidth = "420px";
      iframe.style.height = "100%";
      iframe.style.maxHeight = "650px";
      iframe.style.border = "none";
      iframe.style.borderRadius = "16px";
      iframe.style.background = "white";
      iframe.style.boxShadow = "0 25px 50px rgba(0,0,0,0.5)";

      backdrop.appendChild(iframe);
      document.body.appendChild(backdrop);

      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          backdrop.remove();
        }
      });
    });

    document.body.appendChild(btn);

    return () => {
      const b = document.getElementById("bmc-wbtn");
      if (b) b.remove();
      const bd = document.getElementById("bmc-backdrop");
      if (bd) bd.remove();
    };
  }, []);

  return null;
}
