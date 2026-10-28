import { useState, useRef, useCallback, useEffect } from "react";
import { WASTE_CATEGORIES as WASTE_DATA } from "./data/wasteCategories.js";
import { normalizeClassifierResult } from "./services/classifierAdapter.js";
import { useEcoStats } from "./hooks/useEcoStats.js";

async function compressImage(file, maxSizeKB = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if too large
      const maxDim = 1024;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress with decreasing quality until under size limit
      let quality = 0.85;
      const tryCompress = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (dataUrl.length * 0.75) / 1024;
        if (sizeKB > maxSizeKB && quality > 0.2) {
          quality -= 0.1;
          tryCompress();
        } else {
          resolve(dataUrl);
        }
      };
      tryCompress();
    };
    img.src = url;
  });
}

async function classifyWithAI(file, onStatus) {
  if (onStatus) onStatus('Compressing image...');

  // Compress image before sending to stay under 4.5MB Vercel limit
  const dataUrl = await compressImage(file, 800);
  const base64 = dataUrl.split(',')[1];
  const mimeType = 'image/jpeg';

  if (onStatus) onStatus('Analyzing with Groq Vision AI...');

  const resp = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType })
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Classification failed');

  return normalizeClassifierResult(data);
}

// ─── SCAN ANIMATION ──────────────────────────────────────────────────────────
function ScanLoader({ preview, status }) {
  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden border border-emerald-500/30">
      {preview && <img src={preview} alt="scanning" className="w-full h-full object-cover opacity-60" />}
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        style={{ animation: "scan 1.8s ease-in-out infinite", top: "10%" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-400/60 border-t-emerald-400 animate-spin" />
        <p className="text-emerald-300 text-sm font-medium tracking-widest uppercase">Analyzing…</p>
        <p className="text-white/40 text-xs mt-1 px-4 text-center">{status || "AI model may take ~20s on first scan"}</p>
      </div>
      {/* corner brackets */}
      {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c, i) => (
        <div key={i} className={`absolute w-6 h-6 border-emerald-400 ${c}`} />
      ))}
      <style>{`@keyframes scan { 0%,100%{top:10%} 50%{top:85%} }`}</style>
    </div>
  );
}

// ─── UPLOAD CARD ─────────────────────────────────────────────────────────────
// ─── LIVE CAMERA ─────────────────────────────────────────────────────────────
function LiveCamera({ onResult, onAnalyzing, onClose }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState('');
  const cooldownRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (err) {
        alert('Camera access denied. Please allow camera permission and try again.');
        onClose();
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const captureAndScan = useCallback(async () => {
    if (scanning || cooldown > 0 || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    setScanning(true);
    setStatus('Capturing frame...');

    // Convert canvas frame to blob -> File
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'camera-frame.jpg', { type: 'image/jpeg' });
      const previewUrl = canvas.toDataURL('image/jpeg', 0.8);

      try {
        onAnalyzing(previewUrl);
        onClose(); // close camera, show scan loader in main UI
        const res = await classifyWithAI(file, () => {});
        onResult(res, previewUrl);
      } catch (err) {
        alert('Scan failed: ' + err.message);
        onClose();
      }
    }, 'image/jpeg', 0.85);
  }, [scanning, cooldown, onResult, onAnalyzing, onClose]);

  // Start cooldown after scan
  useEffect(() => {
    if (!scanning) return;
    setCooldown(8);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); setScanning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [scanning]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur">
        <span className="text-white font-semibold text-sm tracking-wide">📷 Live Scanner</span>
        <button onClick={onClose} className="text-white/60 hover:text-white text-sm px-3 py-1 rounded-lg bg-white/10">✕ Close</button>
      </div>

      {/* Video */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan overlay frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {/* Corner brackets */}
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <div key={i} className={`absolute w-8 h-8 ${pos}`}
                style={{
                  borderTop: i < 2 ? '3px solid #10b981' : 'none',
                  borderBottom: i >= 2 ? '3px solid #10b981' : 'none',
                  borderLeft: i % 2 === 0 ? '3px solid #10b981' : 'none',
                  borderRight: i % 2 === 1 ? '3px solid #10b981' : 'none',
                  borderRadius: '2px'
                }}
              />
            ))}
            {/* Scanning line animation */}
            {ready && (
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                style={{ animation: 'scan 1.8s ease-in-out infinite' }}
              />
            )}
          </div>
        </div>

        {/* Status */}
        {status && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 rounded-full text-emerald-300 text-xs">
            {status}
          </div>
        )}

        {/* Groq limit notice */}
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 rounded-lg text-white/40 text-xs">
          1,000 scans/day free
        </div>
      </div>

      {/* Scan button */}
      <div className="px-6 py-8 bg-black flex flex-col items-center gap-3">
        <button
          onClick={captureAndScan}
          disabled={!ready || scanning || cooldown > 0}
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl transition-all duration-200
            ${!ready || scanning || cooldown > 0
              ? 'border-white/20 bg-white/5 opacity-50 cursor-not-allowed'
              : 'border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/40 active:scale-95 shadow-lg shadow-emerald-500/30'
            }`}
        >
          {cooldown > 0 ? <span className="text-white text-lg font-bold">{cooldown}</span> : '🔍'}
        </button>
        <p className="text-white/40 text-xs text-center">
          {!ready ? 'Starting camera...' : cooldown > 0 ? `Next scan in ${cooldown}s` : 'Point at waste item and tap to scan'}
        </p>
      </div>
    </div>
  );
}

function UploadCard({ onResult, onAnalyzing }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [liveCamera, setLiveCamera] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const process = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setLoading(true);
    onAnalyzing(url);
    try {
      const res = await classifyWithAI(file, setStatus);
      setLoading(false);
      onResult(res, url);
    } catch (err) {
      setLoading(false);
      setPreview(null);
      alert("⏳ " + err.message + "\n\nTip: The AI model needs ~20 seconds to wake up on first use. Please try scanning again!");
    }
  }, [onAnalyzing, onResult]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    process(e.dataTransfer.files[0]);
  }, [process]);

  if (loading) return <ScanLoader preview={preview} status={status} />;
  if (liveCamera) return (
    <LiveCamera
      onResult={(res, url) => { setLiveCamera(false); onResult(res, url); }}
      onAnalyzing={(url) => { setLiveCamera(false); setPreview(url); setLoading(true); onAnalyzing(url); }}
      onClose={() => setLiveCamera(false)}
    />
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => fileRef.current.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-4 transition-all duration-300
        ${dragging ? "border-emerald-400 bg-emerald-500/10 scale-[1.02]" : "border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-white/8"}`}
    >
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-base">Drop image here</p>
        <p className="text-white/40 text-sm mt-1">or tap to browse</p>
      </div>
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        <button
          onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all"
        >📁 Gallery</button>
        <button
          onClick={e => { e.stopPropagation(); cameraRef.current.click(); }}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all"
        >📷 Capture</button>
        <button
          onClick={e => { e.stopPropagation(); setLiveCamera(true); }}
          className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-all"
        >🎥 Live Scan</button>
      </div>
      <p className="text-white/20 text-xs">Supports JPG, PNG, WEBP</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => process(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => process(e.target.files[0])} />
    </div>
  );
}

// ─── RESULT CARD ─────────────────────────────────────────────────────────────
function ResultCard({ result, preview, onReset, onLearnMore, onResources }) {
  const data = WASTE_DATA[result.type];
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  return (
    <div
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {/* Image preview strip */}
      {preview && (
        <div className="relative h-40 rounded-2xl overflow-hidden mb-4 border border-white/10">
          <img src={preview} alt="waste" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${data.bg}`} />
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur text-xs text-white/70">
            AI Confidence: <span className="text-emerald-300 font-bold">{result.confidence}%</span>
          </div>
          {result.itemName && (
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-xs text-white font-semibold">
              📷 {result.itemName}
            </div>
          )}
        </div>
      )}

      {/* Screenshot detector */}
      {result.isScreenshot !== undefined && (
        <div className="mb-4 bg-white/5 rounded-2xl p-3 border border-white/8">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-white/50 text-xs uppercase tracking-wider">Image Authenticity</span>
            <span className={`text-xs font-bold ${result.isScreenshot > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {result.isScreenshot > 60 ? '⚠️ Likely Screenshot' : '✅ Looks Real'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs w-10">Real</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${result.isScreenshot}%`,
                  background: result.isScreenshot > 60
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #10b981, #3b82f6)'
                }}
              />
            </div>
            <span className="text-white/40 text-xs w-16 text-right">Screenshot</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-emerald-400 text-xs font-medium">{100 - result.isScreenshot}% real</span>
            <span className="text-amber-400 text-xs font-medium">{result.isScreenshot}% screenshot</span>
          </div>
        </div>
      )}

      {/* Main result */}
      <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${data.bg} backdrop-blur-xl p-5 shadow-2xl ${data.glow}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border ${data.badge}`}>
              {data.category}
            </span>
            <h2 className="text-white text-2xl font-bold mt-2 flex items-center gap-2">
              <span>{data.emoji}</span> {data.label}
            </h2>
          </div>
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl"
            style={{ borderColor: data.color, boxShadow: `0 0 20px ${data.color}40` }}
          >
            {data.emoji}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
            <span className="text-xl">🗑️</span>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Disposal Method</p>
              <p className="text-white text-sm font-medium mt-0.5">{data.disposal}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
            <span className="text-xl">🌍</span>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Did You Know</p>
              <p className="text-white text-sm mt-0.5">{data.fact}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={onLearnMore}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95"
          >📖 Learn</button>
          <button
            onClick={onResources}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95"
          >📚 Tips</button>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(data.mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 rounded-xl text-center text-xs font-medium transition-all active:scale-95"
            style={{ background: `${data.color}30`, color: data.color, border: `1px solid ${data.color}50` }}
          >📍 Nearby</a>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-4 py-3 rounded-xl border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white/70 transition-all"
      >↩ Analyze Another</button>
    </div>
  );
}

// ─── LEARN MORE PAGE ──────────────────────────────────────────────────────────
function LearnMorePage({ result, onBack }) {
  const data = WASTE_DATA[result.type];
  const sections = [
    { icon: "🔬", title: "What Is It?", text: data.learnMore.what },
    { icon: "🌍", title: "Environmental Impact", text: data.learnMore.impact },
    { icon: "🗑️", title: "How To Dispose", text: data.learnMore.disposal },
    { icon: "♻️", title: "Recycling Benefits", text: data.learnMore.benefit },
  ];
  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
        ← Back
      </button>
      <div className={`rounded-2xl p-5 bg-gradient-to-br ${data.bg} border border-white/10 mb-6`}>
        <p className="text-4xl mb-2">{data.emoji}</p>
        <h1 className="text-white text-2xl font-bold">{data.label}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${data.badge} mt-2 inline-block`}>{data.category}</span>
      </div>
      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.icon}</span>
              <h3 className="text-white font-semibold text-sm">{s.title}</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────────
function ResourcesPage({ onBack }) {
  const resources = [
    { icon: "🌱", title: "Reduce First", desc: "Refuse single-use items. Bring reusable bags, bottles, and containers everywhere.", color: "emerald" },
    { icon: "♻️", title: "Recycling Guide", desc: "Clean, dry, and sort recyclables by material. Check local guidelines for accepted items.", color: "blue" },
    { icon: "🌾", title: "Composting Tips", desc: "Compost fruit peels, vegetable scraps, coffee grounds, and dry leaves at home.", color: "lime" },
    { icon: "🏛️", title: "Govt. Programs", desc: "Check Swachh Bharat Mission, CPCB guidelines, and local municipal waste programs.", color: "cyan" },
    { icon: "📱", title: "Waste Apps", desc: "Use apps like iGot (India), RecycleNation, or local city apps for collection schedules.", color: "violet" },
    { icon: "🎓", title: "Educate Others", desc: "Share knowledge, run drives at schools, and lead by example in your community.", color: "amber" },
  ];

  const colorMap = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    lime: "bg-lime-500/10 border-lime-500/20 text-lime-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };

  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
        ← Back
      </button>
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Waste Management</h1>
        <p className="text-white/40 text-sm mt-1">Tips, guides & resources</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {resources.map((r, i) => (
          <div key={i} className={`rounded-2xl p-4 border flex items-start gap-4 ${colorMap[r.color]}`}>
            <span className="text-2xl">{r.icon}</span>
            <div>
              <h3 className="text-white font-semibold text-sm">{r.title}</h3>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-white/50 text-xs text-center">🌏 Every action counts. Start small, think big.</p>
      </div>
    </div>
  );
}

// ─── STATS BAR ───────────────────────────────────────────────────────────────
function StatsBar({ count, stats }) {
  const displayCount = stats ? stats.todayScans : (count || 0);
  const displayCo2 = stats ? `${stats.co2SavedKg}kg` : `${((count || 0) * 0.3).toFixed(1)}kg`;
  const displayStreak = stats ? `${stats.streakDays}d` : `${Math.min(count || 0, 7)}d`;

  return (
    <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-white/5 border border-white/8 mb-6">
      {[
        { label: "Scans Today", value: displayCount, icon: "🔍" },
        { label: "CO₂ Saved", value: displayCo2, icon: "🌿" },
        { label: "Streak", value: displayStreak, icon: "🔥" },
      ].map((s, i) => (
        <div key={i} className="text-center flex-1">
          <p className="text-lg">{s.icon}</p>
          <p className="text-white font-bold text-sm">{s.value}</p>
          <p className="text-white/30 text-xs">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home"); // home | result | learn | resources
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [_analyzing, setAnalyzing] = useState(false);
  const { stats, recordScan } = useEcoStats();

  const handleAnalyzing = (url) => {
    setPreview(url);
    setAnalyzing(true);
  };

  const handleResult = (res, url) => {
    setResult(res);
    setPreview(url);
    setAnalyzing(false);
    recordScan(res, url);
    setPage("result");
  };

  const reset = () => {
    setResult(null);
    setPreview(null);
    setPage("home");
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, #052e16 0%, #0a0a0a 50%, #051a0d 100%)",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0px; }
        body { margin: 0; }
      `}</style>

      {/* Ambient orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2ECC71 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="fixed bottom-1/4 right-0 w-64 h-64 rounded-full opacity-8 pointer-events-none"
        style={{ background: "radial-gradient(circle, #3498DB 0%, transparent 70%)", filter: "blur(50px)" }} />

      {/* App shell */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative z-10">

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-8 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <span className="text-sm">♻️</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">EcoScan<span className="text-emerald-400">AI</span></span>
            </div>
            <p className="text-white/30 text-xs mt-0.5 ml-9">Smart Waste Classifier</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base cursor-pointer hover:bg-white/10 transition-all">
            🌿
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 pb-8 overflow-y-auto">

          {page === "home" && (
            <div className="animate-fadeIn">
              {/* Hero text */}
              <div className="mb-6">
                <h1 className="text-white text-3xl font-bold leading-tight">
                  Classify Waste,<br />
                  <span className="text-emerald-400">Save The Planet</span>
                </h1>
                <p className="text-white/40 text-sm mt-2 leading-relaxed">
                  Upload a photo of any waste item and get instant AI-powered disposal guidance.
                </p>
              </div>

              <StatsBar stats={stats} count={stats.todayScans} />

              {/* Upload area */}
              <div className="mb-6">
                <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Upload Waste Image</h2>
                <UploadCard onResult={handleResult} onAnalyzing={handleAnalyzing} />
              </div>

              {/* Waste type chips */}
              <div>
                <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Waste Categories</h2>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(WASTE_DATA).map(([key, d]) => (
                    <div
                      key={key}
                      className="rounded-xl p-3 border border-white/8 bg-white/5 text-center cursor-default hover:bg-white/10 transition-all"
                    >
                      <div className="text-xl mb-1">{d.emoji}</div>
                      <p className="text-white/70 text-xs font-medium leading-tight">{d.label.split(" ")[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {page === "result" && result && (
            <ResultCard
              result={result}
              preview={preview}
              onReset={reset}
              onLearnMore={() => setPage("learn")}
              onResources={() => setPage("resources")}
            />
          )}

          {page === "learn" && result && (
            <LearnMorePage result={result} onBack={() => setPage("result")} />
          )}

          {page === "resources" && (
            <ResourcesPage onBack={() => setPage(result ? "result" : "home")} />
          )}
        </main>

        {/* Bottom nav */}
        <nav className="px-5 pb-6 pt-2">
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
            {[
              { id: "home", icon: "🏠", label: "Home" },
              { id: "resources", icon: "📚", label: "Resources" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1
                  ${page === tab.id ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-white/40 hover:text-white/60"}`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}