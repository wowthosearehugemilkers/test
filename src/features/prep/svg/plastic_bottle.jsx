/**
 * EcoScanAI - Plastic Bottle Interactive SVG
 * 
 * Binds data-attributes to reactive state:
 * - data-body: "intact"
 * - data-cap: "attached" | "removed"
 * - data-contents: "residue" | "empty"
 */

export default function PlasticBottleSvg({ parts = {} }) {
  const bodyState = parts.body || "intact";
  const capState = parts.cap || "attached";
  const contentsState = parts.contents || "residue";

  return (
    <div className="relative flex items-center justify-center p-3 select-none">
      <svg
        viewBox="0 0 160 260"
        className="w-36 h-52 sm:w-44 sm:h-60 transition-all duration-500 overflow-visible"
        data-body={bodyState}
        data-cap={capState}
        data-contents={contentsState}
      >
        <defs>
          <linearGradient id="petGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="sodaLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <style>{`
          svg[data-contents="empty"] #plastic_bottle-contents {
            opacity: 0;
            transform: scaleY(0);
            transition: all 0.5s ease-out;
          }
          svg[data-contents="residue"] #plastic_bottle-contents {
            opacity: 1;
            transform: scaleY(1);
            transition: all 0.5s ease-in;
          }
          svg[data-cap="removed"] #plastic_bottle-cap {
            transform: translate(30px, -40px) rotate(30deg);
            opacity: 0.65;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          svg[data-cap="attached"] #plastic_bottle-cap {
            transform: translate(0, 0) rotate(0deg);
            transition: all 0.4s ease;
          }
        `}</style>

        {/* Bottle Body */}
        <g id="plastic_bottle-body" data-part="body">
          <path
            d="M60 42 L100 42 L100 58 L116 82 L116 220 A16 16 0 0 1 100 236 L60 236 A16 16 0 0 1 44 220 L44 82 L60 58 Z"
            fill="url(#petGradient)"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="60" y1="48" x2="100" y2="48" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="60" y1="54" x2="100" y2="54" stroke="#38bdf8" strokeWidth="1.5" />
        </g>

        {/* Liquid Contents */}
        <g
          id="plastic_bottle-contents"
          data-part="contents"
          style={{ transformOrigin: "bottom center" }}
        >
          <path
            d="M47 165 Q80 160 113 165 L113 220 A13 13 0 0 1 100 233 L60 233 A13 13 0 0 1 47 220 Z"
            fill="url(#sodaLiquid)"
          />
          <circle cx="70" cy="190" r="3" fill="#fef3c7" opacity="0.6" />
          <circle cx="90" cy="205" r="2" fill="#fef3c7" opacity="0.5" />
          <text x="80" y="215" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" opacity="0.8">
            Sugary Residue
          </text>
        </g>

        {/* Cap */}
        <g id="plastic_bottle-cap" data-part="cap" style={{ transformOrigin: "80px 25px" }}>
          <rect
            x="64"
            y="22"
            width="32"
            height="20"
            rx="4"
            fill="#3b82f6"
            stroke="#93c5fd"
            strokeWidth="2"
          />
          <line x1="72" y1="22" x2="72" y2="42" stroke="#bfdbfe" strokeWidth="1.5" />
          <line x1="80" y1="22" x2="80" y2="42" stroke="#bfdbfe" strokeWidth="1.5" />
          <line x1="88" y1="22" x2="88" y2="42" stroke="#bfdbfe" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}
