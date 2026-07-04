"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function ChatWidget() {
    const pathname = usePathname();
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Once we visit the home page, we set shouldLoad to true, so it stays loaded
        // Check both exact '/' and paths that might be the home page
        if (pathname === "/") {
            setShouldLoad(true);
        }

        // We inject a global style that hides the widget if we are not on the home page
        let style = document.getElementById("asst-widget-visibility-style");
        if (!style) {
            style = document.createElement("style");
            style.id = "asst-widget-visibility-style";
            document.head.appendChild(style);
        }

        if (pathname === "/") {
            style.innerHTML = "";
        } else {
            style.innerHTML = `
                #asst-widget-container {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `;
        }
    }, [pathname]);

    // Don't load anything if they haven't visited the home page yet
    if (!shouldLoad && pathname !== "/") {
        return null;
    }

    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "https://assistra-widget-stage.sgp1.cdn.digitaloceanspaces.com/widget/loader.js";
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "sk_live_0CB_E4vbs9mpCRsfA19lBctmuy8Aj2hD";

    return (
        <Script
            id="assistra-widget-script"
            src={widgetUrl}
            data-api-key={apiKey}
            strategy="afterInteractive"
        />
    );
}
