export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { currentRole, targetRole, company, experience, motivation } = req.body;

  if (!currentRole || !targetRole || !experience) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are an expert career coach and professional cover letter writer. You specialise in helping people with non-traditional or unconventional backgrounds break into new industries and roles.

Write a compelling, natural-sounding cover letter for the following person:

Current or most recent role: ${currentRole}
Applying for: ${targetRole}${company ? `\nCompany: ${company}` : ''}
Their experience and skills: ${experience}${motivation ? `\nWhy they want this role: ${motivation}` : ''}

CRITICAL GUIDELINES:
- Reframe their background as a genuine, specific asset for the target role - not vague "transferable skills"
- Be concrete about what they have done and how it maps to what the employer needs
- Sound like a real, confident person wrote this - not a template
- 3-4 tight paragraphs maximum
- Do NOT open with "I am writing to apply for..."
- Do NOT use em dashes or double hyphens
- Do NOT use phrases like "I am passionate about" or "I am a team player"
- Open strong - immediately position their background as relevant
- End with a specific, confident call to action
- If no company is provided, address to Hiring Manager
- UK English spelling throughout

Write only the letter body. No subject line, no headers, no sign-off name.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const letter = data.content?.[0]?.text;

    if (!letter) throw new Error('No letter generated');

    return res.status(200).json({ letter });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate letter' });
  }
}
