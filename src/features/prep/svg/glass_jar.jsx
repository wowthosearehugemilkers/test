/**
 * EcoScanAI - Glass Jar Interactive SVG
 * 
 * Binds data-attributes to reactive state:
 * - data-body: "intact"
 * - data-lid: "attached" | "removed"
 * - data-contents: "residue" | "empty"
 */

export default function GlassJarSvg({ parts = {} }) {
  const bodyState = parts.body || "intact";
  const lidState = parts.lid || "attached";
  const contentsState = parts.contents || "residue";

  return (
    <div className="relative flex items-center justify-center p-3 select-none">
      <svg
        viewBox="0 0 160 220"
        className="w-36 h-48 sm:w-44 sm:h-56 transition-all duration-500 overflow-visible"
        data-body={bodyState}
        data-lid={lidState}
        data-contents={contentsState}
      >
        <defs>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="sauceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="metalLid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        <style>{`
          svg[data-contents="empty"] #glass_jar-contents {
            opacity: 0;
            transform: scaleY(0);
            transition: all 0.5s ease-out;
          }
          svg[data-contents="residue"] #glass_jar-contents {
            opacity: 1;
            transform: scaleY(1);
            transition: all 0.5s ease-in;
          }
          svg[data-lid="removed"] #glass_jar-lid {
            transform: translate(25px, -35px) rotate(-20deg);
            opacity: 0.65;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          svg[data-lid="attached"] #glass_jar-lid {
            transform: translate(0, 0) rotate(0deg);
            transition: all 0.4s ease;
          }
        `}</style>

        {/* Jar Body */}
        <g id="glass_jar-body" data-part="body">
          <rect
            x="40"
            y="55"
            width="80"
            height="135"
            rx="18"
            fill="url(#glassGradient)"
            stroke="#06b6d4"
            strokeWidth="3"
          />
          {/* Jar Rim */}
          <rect
            x="50"
            y="42"
            width="60"
            height="14"
            rx="4"
            fill="url(#glassGradient)"
            stroke="#06b6d4"
            strokeWidth="2"
          />
          {/* Glass reflections */}
          <line x1="48" y1="75" x2="48" y2="165" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </g>

        {/* Sauce Contents */}
        <g
          id="glass_jar-contents"
          data-part="contents"
          style={{ transformOrigin: "bottom center" }}
        >
          <path
            d="M43 130 Q80 125 117 130 L117 172 A15 15 0 0 1 102 187 L58 187 A15 15 0 0 1 43 172 Z"
            fill="url(#sauceGradient)"
          />
          <text x="80" y="165" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" opacity="0.85">
            Tomato Sauce
          </text>
        </g>

        {/* Metal Lid */}
        <g id="glass_jar-lid" data-part="lid" style={{ transformOrigin: "80px 35px" }}>
          <rect
            x="46"
            y="30"
            width="68"
            height="14"
            rx="3"
            fill="url(#metalLid)"
            stroke="#475569"
            strokeWidth="2"
          />
          <line x1="52" y1="37" x2="108" y2="37" stroke="#cbd5e1" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
