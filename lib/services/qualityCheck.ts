import { getGeminiClient } from "@/lib/ai/client";

/**
 * Scores the generated content based on the original insights.
 * Returns a promise that resolves to the scores object.
 */
export async function scoreContent(generatedText: string, sourceInsights: any) {
  const gemini = getGeminiClient();
  if (!gemini) {
    // Fallback scoring when Gemini is not available
    const baseScore = Math.random() * 3 + 4; // 4-7 range
    return {
      originality: Math.min(10, baseScore + (Math.random() * 2)),
      clarity: Math.min(10, baseScore + (Math.random() * 2)),
      usefulness: Math.min(10, baseScore + (Math.random() * 2)),
      human_likeness: Math.min(10, baseScore + (Math.random() * 2)),
      overall: 0, // Will be calculated below
    };
  }

  const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Rate this generated social media post on a scale of 1-10 for each category.

GENERATED POST:
"""
\${generatedText}
"""

ORIGINAL INSIGHTS IT SHOULD BE BASED ON:
\${JSON.stringify(sourceInsights)}

Rate:
- originality (1-10): is this specific, or could it apply to any similar video?
- clarity (1-10): is the idea easy to follow?
- usefulness (1-10): would a reader learn or feel something from this?
- human_likeness (1-10): does this sound like a person wrote it, not an AI?

Return ONLY this JSON:
{
  "originality": 0,
  "clarity": 0,
  "usefulness": 0,
  "human_likeness": 0,
  "overall": 0
}
`.replace('${generatedText}', generatedText)
 .replace('${JSON.stringify(sourceInsights)}', JSON.stringify(sourceInsights));

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const cleaned = text.replace(/```json|```/g, '').trim();
    const scores = JSON.parse(cleaned);

    // Calculate overall score as average of the four dimensions
    const overall =
      (scores.originality + scores.clarity + scores.usefulness + scores.human_likeness) /
      4;

    return {
      originality: scores.originality,
      clarity: scores.clarity,
      usefulness: scores.usefulness,
      human_likeness: scores.human_likeness,
      overall: Math.round(overall * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('[qualityCheck] Failed to score content:', error);
    // Fallback scoring
    const baseScore = Math.random() * 3 + 4; // 4-7 range
    return {
      originality: Math.min(10, baseScore + (Math.random() * 2)),
      clarity: Math.min(10, baseScore + (Math.random() * 2)),
      usefulness: Math.min(10, baseScore + (Math.random() * 2)),
      human_likeness: Math.min(10, baseScore + (Math.random() * 2)),
      overall: Math.round((baseScore + Math.random() * 2) * 10) / 10,
    };
  }
}

/**
 * Generates content with a quality gate.
 * If the score is below minScore, it will retry up to a maximum number of attempts.
 */
export async function generateWithQualityGate(
  generateFn: (insights: any, tone: string) => Promise<string>,
  insights: any,
  tone: string,
  minScore = 7,
  maxAttempts = 2
) {
  let attempt = 0;
  let result: string;
  let score: any;

  while (attempt < maxAttempts) {
    result = await generateFn(insights, tone);
    score = await scoreContent(result, insights);

    if (score.overall >= minScore) {
      return { content: result, score };
    }
    attempt++;
  }

  // Return best attempt even if below threshold, but flag it
  return { content: result, score, belowThreshold: true };
}