export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
    if (typeof window !== "undefined" && GA_MEASUREMENT_ID) {
        (window as any).gtag("config", GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: { action: string; category: string; label?: string; value?: number }) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

// Custom event trackers
export const trackSignupClick = () => {
    event({
        action: "signup_click",
        category: "engagement",
    });
};

export const trackSignupCompleted = () => {
    event({
        action: "signup_completed",
        category: "conversion",
    });
};

export const trackPricingViewed = () => {
    event({
        action: "pricing_viewed",
        category: "engagement",
    });
};

export const trackDemoRequested = () => {
    event({
        action: "demo_requested",
        category: "engagement",
    });
};

export const trackCtaClicked = (label: string) => {
    event({
        action: "cta_clicked",
        category: "engagement",
        label: label,
    });
};
