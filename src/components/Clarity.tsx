import Script from "next/script";

// Microsoft Clarity session recording. Off unless NEXT_PUBLIC_CLARITY_ID is set at build time.
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();

export function Clarity() {
  if (!CLARITY_ID || !/^[a-z0-9]+$/i.test(CLARITY_ID)) return null;
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
