export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured in Vercel environment variables.' });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        max_tokens: 600,
        reasoning_effort: 'low',
        reasoning_format: 'parsed',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              {
                type: 'text',
                text: `Analyze this image and reply ONLY with a JSON object, no extra text:
{
  "itemName": "exact name of the object you see, e.g. 'Plastic Water Bottle', 'Banana Peel', 'Aluminium Can'",
  "wasteType": "one of: organic, plastic, paper, glass, metal, hazardous",
  "confidence": number between 70 and 99,
  "reason": "one sentence why you classified it this way",
  "isScreenshot": number between 0 and 100 representing % chance this is a screenshot/digital image rather than a real physical object photo
}

Waste type rules:
- organic = food scraps, fruit, vegetables, garden waste
- plastic = bottles, bags, containers, packaging  
- paper = cardboard, newspaper, books, boxes
- glass = bottles, jars, mirrors
- metal = cans, tins, electronics, wires, appliances
- hazardous = batteries, chemicals, paint, syringes, medicine

For isScreenshot: give high % (70-95) if the image looks like a screenshot, digital render, stock photo, or downloaded image. Give low % (5-20) if it looks like a real photo taken with a phone camera of an actual physical object.`
              }
            ]
          }
        ]
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: `Groq error: ${err}` });
    }

    const data = await resp.json();
    let text = data.choices?.[0]?.message?.content || '';
    text = text.replace(/```json|```/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Invalid response from AI');

    const result = JSON.parse(text.substring(start, end + 1));

    const validTypes = ['organic', 'plastic', 'paper', 'glass', 'metal', 'hazardous'];
    if (!validTypes.includes(result.wasteType)) result.wasteType = 'hazardous';

    return res.status(200).json({
      wasteType: result.wasteType,
      confidence: result.confidence || 85,
      itemName: result.itemName || 'Waste Item',
      reason: result.reason || '',
      isScreenshot: result.isScreenshot || 0
    });

  } catch (err) {
    console.error('Classification error:', err);
    return res.status(500).json({ error: err.message || 'Classification failed' });
  }
}
