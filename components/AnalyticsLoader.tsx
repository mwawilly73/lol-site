"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function AnalyticsLoader() {
  if (!GA_ID) return null;

  return (
    <>
      {/* Consent Mode par défaut (denied) : rien ne part tant que le CMP n’a pas donné le feu vert */}
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'denied',
            'personalization_storage': 'denied',
            'security_storage': 'granted'
          });
        `}
      </Script>

      {/* gtag.js */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* Init GA (sans page_view auto, on trackera nous-même) */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false, allow_google_signals: false });
        `}
      </Script>
    </>
  );
}
