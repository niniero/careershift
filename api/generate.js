import { randomUUID } from 'crypto';

const letters = new Map();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'No ID provided' });
    
    const letter = letters.get(id);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });
    
    return res.status(200).json({ letter });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { currentRole, targetRole, company, experience, motivation } = req.body;

  if (!currentRole || !targetRole || !experience) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are an expert career coach and professional cover letter writer. You specialise in helping people with non-traditional backgrounds break into new roles.\n\nCurrent role: ${currentRole}\nApplying for: ${targetRole}${company ? `\nCompany: ${company}` : ''}\nExperience: ${experience}${motivation ? `\nMotivation: ${motivation}` : ''}\n\nWrite a compelling 3-4 paragraph cover letter. No em dashes. UK English. No "I am writing to apply". Address to Hiring Manager if no company given. Write only the letter body.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    const letter = data?.content?.[0]?.text;
    if (!letter) return res.status(500).json({ error: 'No letter in response' });

    const id = randomUUID();
    letters.set(id, letter);

    setTimeout(() => letters.delete(id), 24 * 60 * 60 * 1000);

    return res.status(200).json({ letter, id });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
}
