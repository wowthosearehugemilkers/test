/**
 * EcoScanAI - Pizza Box Interactive SVG
 * 
 * Binds data-attributes to reactive state:
 * - data-box: "whole" | "split"
 * - data-grease: "present"
 */

export default function PizzaBoxSvg({ parts = {} }) {
  const boxState = parts.box || "whole";
  const greaseState = parts.grease || "present";

  return (
    <div className="relative flex items-center justify-center p-3 select-none">
      <svg
        viewBox="0 0 220 180"
        className="w-48 h-40 sm:w-56 sm:h-48 transition-all duration-500 overflow-visible"
        data-box={boxState}
        data-grease={greaseState}
      >
        <defs>
          <linearGradient id="kraftCardboard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="cleanLidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="greaseOil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#78350f" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#92400e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </radialGradient>
        </defs>

        <style>{`
          svg[data-box="split"] #pizza_box-lid {
            transform: translate(-10px, -45px) rotate(-14deg);
            opacity: 0.9;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          svg[data-box="whole"] #pizza_box-lid {
            transform: translate(0, 0) rotate(0deg);
            transition: all 0.5s ease;
          }
        `}</style>

        {/* Bottom Greasy Base */}
        <g id="pizza_box-base" data-part="base">
          <polygon
            points="30,120 110,155 190,120 110,85"
            fill="url(#kraftCardboard)"
            stroke="#78350f"
            strokeWidth="2.5"
          />
          {/* Box thickness */}
          <polygon
            points="30,120 110,155 110,165 30,130"
            fill="#92400e"
            stroke="#78350f"
            strokeWidth="2"
          />
          <polygon
            points="110,155 190,120 190,130 110,165"
            fill="#78350f"
            stroke="#451a03"
            strokeWidth="2"
          />
        </g>

        {/* Grease Stain */}
        <g id="pizza_box-grease" data-part="grease">
          <ellipse
            cx="110"
            cy="120"
            rx="45"
            ry="20"
            fill="url(#greaseOil)"
          />
          <text x="110" y="123" textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="bold" opacity="0.8">
            Oil & Grease
          </text>
        </g>

        {/* Top Clean Lid (Tears away when split) */}
        <g id="pizza_box-lid" data-part="box" style={{ transformOrigin: "30px 120px" }}>
          <polygon
            points="30,115 110,150 190,115 110,80"
            fill="url(#cleanLidGrad)"
            stroke="#fde68a"
            strokeWidth="2.5"
          />
          {/* Pizza branding icon on lid */}
          <circle cx="110" cy="112" r="14" fill="#ef4444" opacity="0.85" />
          <polygon points="104,118 116,118 110,105" fill="#fef08a" />
          <circle cx="109" cy="113" r="2" fill="#b91c1c" />
          <text x="110" y="138" textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="bold">
            Clean Top Lid
          </text>
        </g>
      </svg>
    </div>
  );
}
