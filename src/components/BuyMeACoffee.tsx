"use client";

export default function BuyMeACoffee() {
  const handleClick = () => {
    window.open(
      "https://www.buymeacoffee.com/aaronditto",
      "bmc-popup",
      "width=500,height=700,scrollbars=yes,resizable=yes,top=100,left=100"
    );
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M18 8h1.1a2 2 0 0 1 1.9 2.6l-1.6 6A2 2 0 0 1 17.5 18H6.5a2 2 0 0 1-1.9-1.4l-1.6-6A2 2 0 0 1 4.9 8H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 11v6M14 11v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Buy me a coffee
    </button>
  );
}
