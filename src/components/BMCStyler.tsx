"use client";

import { useEffect } from "react";

export default function BMCStyler() {
  useEffect(() => {
    const styleId = "bmc-override";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      /* Smaller floating button */
      #bmc-wbtn {
        width: 38px !important;
        height: 38px !important;
        padding: 0 !important;
        outline: 1px solid #fcbb00 !important;
        outline-offset: 2px !important;
        border-radius: 50% !important;
      }
      #bmc-wbtn svg {
        width: 19px !important;
        height: 19px !important;
      }
      #bmc-wbtn svg path,
      #bmc-wbtn svg circle,
      #bmc-wbtn svg rect {
        fill: #fcbb00 !important;
        stroke: #fcbb00 !important;
      }
      html.dark #bmc-wbtn {
        box-shadow: 0 0 12px rgba(252, 187, 0, 0.4) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  return null;
}
