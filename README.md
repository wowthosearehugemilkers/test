# ♻️ EcoScanAI — Smart Waste Classifier

> **AI-powered waste classification in your browser.** Snap or upload a photo of any waste item and instantly get disposal guidance, recycling tips, and nearby facility locations.

🌐 **Live Demo:** [ecoscan-v2.vercel.app](https://ecoscan-v2.vercel.app)

---

## ✨ Features

- 📸 **Photo Upload** — drag & drop, gallery browse, or direct camera capture
- 🎥 **Live Scanner** — real-time camera scanning with a scan-frame overlay
- 🤖 **AI Classification** — powered by Groq Vision + Meta Llama 4 Scout (17B)
- ♻️ **6 Waste Categories** — Organic, Plastic, Glass, Metal, Paper, Hazardous
- 🖼️ **Screenshot Detector** — flags digital images vs real photos for accuracy
- 📍 **Nearby Facilities** — one-tap Google Maps search for disposal centres
- 📖 **Learn More** — environmental impact, disposal steps, and recycling benefits
- 📱 **Mobile-First** — fully responsive, PWA-ready dark UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 3 |
| AI Model | Meta Llama 4 Scout 17B (via Groq API) |
| Backend | Vercel Serverless Functions (Node.js) |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/EcoScanAI.git
cd EcoScanAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The `/api/classify` serverless function requires Vercel CLI for local testing (see below).

### 5. Local API testing with Vercel CLI (optional)

```bash
npm install -g vercel
vercel dev
```

This starts the full Vercel environment locally, including the serverless function at `/api/classify`.

---

## 🌍 Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/EcoScanAI)

### Manual deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add:
   - `GROQ_API_KEY` = your Groq API key
4. Click **Deploy**

That's it — Vercel auto-detects the Vite framework and the `api/` folder.

---

## 📁 Project Structure

```
EcoScanAI/
├── api/
│   └── classify.js          # Vercel serverless function — calls Groq Vision API
├── public/
│   └── vite.svg             # Favicon
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.jsx              # Main app — all UI components
│   ├── App.css              # Component styles
│   ├── index.css            # Global styles
│   └── main.jsx             # React entry point
├── .env.example             # Environment variable template
├── .gitignore
├── index.html               # HTML shell with SEO meta tags
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json              # Vercel build config
└── vite.config.js
```

---

## 🔌 API Reference

### `POST /api/classify`

Classifies a waste item from a base64-encoded image.

**Request body:**

```json
{
  "imageBase64": "<base64 string without data URL prefix>",
  "mimeType": "image/jpeg"
}
```

**Response:**

```json
{
  "wasteType": "plastic",
  "confidence": 92,
  "itemName": "Plastic Water Bottle",
  "reason": "Clear PET bottle with a plastic cap, typical single-use beverage container.",
  "isScreenshot": 8
}
```

**Waste types:** `organic` | `plastic` | `paper` | `glass` | `metal` | `hazardous`

**`isScreenshot`:** 0–100 — percentage likelihood the image is a screenshot/digital render rather than a real photo.

---

## 🗺️ Roadmap

- [ ] PWA / offline support
- [ ] Scan history with local storage
- [ ] Shareable scan results
- [ ] Multi-language support (Hindi, Tamil, …)
- [ ] Gamification — badges and leaderboards
- [ ] Integration with municipal waste APIs

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE)

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — blazing-fast LLM inference
- [Meta AI](https://ai.meta.com) — Llama 4 Scout vision model
- [Vercel](https://vercel.com) — serverless deployment platform
- [Tailwind CSS](https://tailwindcss.com) — utility-first CSS framework
