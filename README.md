# ♻️ EcoScanAI — Smart Waste Classifier

> **AI-powered waste classification in your browser.** Snap or upload a photo of any waste item and instantly get disposal guidance, recycling tips, and nearby facility locations.

## 🚀 Live Demo

🌐 **Try EcoScanAI now:** **https://ecoscan-v2.vercel.app/**

No installation or setup is required. Simply open the website, upload or capture a photo of a waste item, and let EcoScanAI classify it using AI.

---

## ✨ Features

* 📸 **Photo Upload** — Drag & drop, gallery browse, or direct camera capture
* 🎥 **Live Scanner** — Real-time camera scanning with a scan-frame overlay
* 🤖 **AI Classification** — Powered by Groq Vision + Meta Llama 4 Scout (17B)
* ♻️ **6 Waste Categories** — Organic, Plastic, Glass, Metal, Paper, Hazardous
* 🖼️ **Screenshot Detector** — Flags digital images vs. real photos for improved accuracy
* 📍 **Nearby Facilities** — One-tap Google Maps search for nearby recycling and disposal centres
* 📖 **Learn More** — Environmental impact, disposal guidance, and recycling benefits
* 📱 **Mobile-First Design** — Fully responsive and PWA-ready interface

---

## 🌱 About the Project

EcoScanAI is an AI-powered waste classification web application that helps users correctly identify and dispose of everyday waste items. By combining computer vision with an intuitive interface, the project encourages better recycling habits and promotes environmental awareness.

Users can simply upload or capture an image, receive an instant AI classification, understand why the item belongs to a particular waste category, and learn the correct disposal method.

---

## 🛠️ Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Frontend   | React 19, Vite 7, Tailwind CSS 3      |
| AI Model   | Meta Llama 4 Scout 17B (via Groq API) |
| Backend    | Vercel Serverless Functions (Node.js) |
| Deployment | Vercel                                |

---

## 📁 Project Structure

```text
EcoScanAI/
├── api/
│   └── classify.js          # Serverless API endpoint
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── App.jsx              # Main application
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

---

## 🔌 API Reference

### `POST /api/classify`

Classifies a waste item from a base64-encoded image.

### Request

```json
{
  "imageBase64": "<base64 string without data URL prefix>",
  "mimeType": "image/jpeg"
}
```

### Response

```json
{
  "wasteType": "plastic",
  "confidence": 92,
  "itemName": "Plastic Water Bottle",
  "reason": "Clear PET bottle with a plastic cap, typical single-use beverage container.",
  "isScreenshot": 8
}
```

### Supported Waste Types

* Organic
* Plastic
* Paper
* Glass
* Metal
* Hazardous

`isScreenshot` returns a value from **0–100**, representing the likelihood that the uploaded image is a screenshot or digital render rather than a real photograph.

---

## 🗺️ Roadmap

* [ ] PWA / Offline support
* [ ] Scan history with local storage
* [ ] Shareable scan results
* [ ] Multi-language support
* [ ] Gamification (badges and achievements)
* [ ] Integration with municipal waste management APIs

---

## 🤝 Contributing

Contributions, ideas, and feedback are always welcome.

If you'd like to improve EcoScanAI:

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Open a Pull Request.

---

## 📄 License

© 2026 **inder4018U**

This project is available for personal and educational use. See the **LICENSE** file for more information.
