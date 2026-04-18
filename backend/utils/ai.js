const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── HELPER: Call Groq API ────────────────────────────────
const callGroq = async (prompt, systemPrompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });
  return response.choices[0].message.content.trim();
};

// ─── FEATURE 1: AUTO CLASSIFY REPORT ─────────────────────
// Takes student's raw description and returns title, category, urgency
const classifyReport = async (description) => {
  const systemPrompt = `You are an AI assistant for FixMyCollege, a campus issue reporting platform at Sershah Engineering College, Bihar, India.

Your job is to analyze a student's complaint description and return a JSON object with:
- title: A short, clear title (max 10 words)
- category: One of exactly these values: cleanliness, hostel_infrastructure, mess, campus_infrastructure, electricity, water, internet_tech, security, other_civic
- urgency: One of exactly these values: low, medium, high, critical
- reason: One sentence explaining why you chose this urgency

Rules for urgency:
- critical: immediate health/safety risk (flooding, fire, broken door lock, no water for 24+ hours)
- high: affects daily life significantly (no electricity, overflowing dustbin, tap leaking badly)
- medium: inconvenient but manageable (slow wifi, broken bench, minor tap drip)
- low: cosmetic or minor (paint peeling, small crack, suggestion)

IMPORTANT: Return ONLY valid JSON, no extra text, no markdown, no explanation outside JSON.`;

  const prompt = `Student complaint: "${description}"

Return JSON in exactly this format:
{
  "title": "...",
  "category": "...",
  "urgency": "...",
  "reason": "..."
}`;

  try {
    const result = await callGroq(prompt, systemPrompt);
    // Clean response in case of any markdown
    const cleaned = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    // Validate the response has required fields
    if (!parsed.title || !parsed.category || !parsed.urgency) {
      throw new Error('Invalid AI response structure');
    }
    // Validate category is one of allowed values
    const allowedCategories = ['cleanliness', 'hostel_infrastructure', 'mess', 'campus_infrastructure', 'electricity', 'water', 'internet_tech', 'security', 'other_civic'];
    if (!allowedCategories.includes(parsed.category)) {
      parsed.category = 'other_civic';
    }
    // Validate urgency
    const allowedUrgencies = ['low', 'medium', 'high', 'critical'];
    if (!allowedUrgencies.includes(parsed.urgency)) {
      parsed.urgency = 'medium';
    }
    return { success: true, ...parsed };
  } catch (err) {
    console.error('AI classify error:', err.message);
    return { success: false, error: 'AI classification failed' };
  }
};

// ─── FEATURE 2: SENTIMENT ANALYSIS ON WELLBEING POSTS ────
// Detects if a wellbeing post is distressing or needs urgent attention
const analyzeSentiment = async (content, category) => {
  const systemPrompt = `You are a compassionate mental health support AI for FixMyCollege, a college campus platform in India.

Your job is to analyze a student's anonymous post and return a JSON object with:
- sentiment: One of: positive, neutral, negative, distressed, crisis
- urgencyLevel: One of: normal, concerning, urgent, emergency  
- needsAdminAlert: true or false (true only if student seems in serious distress or danger)
- supportMessage: A short, warm, empathetic message to show the student (max 2 sentences)
- flags: Array of detected concerns like ["academic_stress", "isolation", "anxiety", "depression", "ragging", "self_harm"] - can be empty array

Rules:
- crisis/emergency: Any mention of self harm, suicide, or immediate danger
- distressed/urgent: Severe anxiety, depression, feeling completely hopeless, mentions of ragging
- negative/concerning: Stress, sadness, academic pressure, loneliness
- neutral/normal: General venting, mild stress
- positive/normal: Happy, motivated posts

IMPORTANT: Return ONLY valid JSON, no extra text.`;

  const prompt = `Student post category: ${category}
Student wrote: "${content}"

Return JSON in exactly this format:
{
  "sentiment": "...",
  "urgencyLevel": "...",
  "needsAdminAlert": false,
  "supportMessage": "...",
  "flags": []
}`;

  try {
    const result = await callGroq(prompt, systemPrompt);
    const cleaned = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.sentiment || !parsed.urgencyLevel) {
      throw new Error('Invalid sentiment response');
    }
    return { success: true, ...parsed };
  } catch (err) {
    console.error('AI sentiment error:', err.message);
    return {
      success: false,
      sentiment: 'neutral',
      urgencyLevel: 'normal',
      needsAdminAlert: false,
      supportMessage: 'Thank you for sharing. You are not alone.',
      flags: [],
    };
  }
};

// ─── FEATURE 3: DUPLICATE REPORT DETECTION ───────────────
// Checks if a new report is similar to existing ones
const detectDuplicates = async (newDescription, newCategory, existingReports) => {
  if (!existingReports || existingReports.length === 0) {
    return { success: true, hasDuplicate: false, similarReports: [] };
  }

  // Only check recent reports (last 30) to keep prompt short
  const recentReports = existingReports.slice(0, 30).map((r, i) => ({
    index: i,
    id: r._id,
    title: r.title,
    description: r.description?.slice(0, 100),
    category: r.category,
    location: r.location,
    status: r.status,
    upvotes: r.upvoteCount || 0,
  }));

  const systemPrompt = `You are a duplicate detection AI for FixMyCollege campus issue reporting system.

Your job is to check if a new complaint is similar to any existing complaints.
Two complaints are similar if they describe the same type of problem in the same or nearby location.

IMPORTANT: Return ONLY valid JSON, no extra text.`;

  const prompt = `New complaint:
Category: ${newCategory}
Description: "${newDescription}"

Existing complaints:
${JSON.stringify(recentReports, null, 2)}

Check if the new complaint is similar to any existing one.
Return JSON in exactly this format:
{
  "hasDuplicate": true or false,
  "similarReports": [array of IDs of similar reports, empty if none],
  "confidence": "high" or "medium" or "low",
  "reason": "one sentence explanation"
}`;

  try {
    const result = await callGroq(prompt, systemPrompt);
    const cleaned = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { success: true, ...parsed };
  } catch (err) {
    console.error('AI duplicate error:', err.message);
    return { success: true, hasDuplicate: false, similarReports: [] };
  }
};

module.exports = { classifyReport, analyzeSentiment, detectDuplicates };
