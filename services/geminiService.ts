
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationRequest, StudyNoteData, QuizData, HomeworkData, Language, Difficulty, DetailLevel, UserProfile, HistoryItem, QuizResult, AnalysisResult } from '../types';

// Helper to get API Key safely in different environments
const getApiKey = (): string => {
  // 1. Try Vite specific import.meta.env (Standard for Vite apps)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Try process.env (Standard for CRA/Next.js or if defined in config)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {}

  return '';
};

const apiKey = getApiKey();
// Safely initialize: Only create instance if key exists to prevent crash on load
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to determine model based on complexity
const getModelName = (req: GenerationRequest): string => {
  return 'gemini-2.5-flash';
};

const validateAi = () => {
  if (!apiKey || !ai) {
    throw new Error("API Key is missing. Please add VITE_API_KEY to your Vercel Environment Variables.");
  }
};

export const generateStudyNotes = async (req: GenerationRequest): Promise<StudyNoteData> => {
  validateAi();
  const model = getModelName(req);

  const prompt = `
    You are an expert tutor. Create study notes for:
    Subject: ${req.subject}
    Topic: ${req.topic}
    Level: ${req.year} (${req.curriculum})
    Language: ${req.language}
    Difficulty: ${req.difficulty}
    Detail: ${req.detailLevel}

    Structure the response exactly as follows:
    1. A JSON block at the VERY START identifying the "title" and a short "summary" (max 200 chars).
    2. A markdown section containing the notes.
    3. The markdown MUST include a Mermaid.js diagram definition inside a \`\`\`mermaid block.
       - Start the block with "graph TD" on the first line.
       - Do NOT use the "direction" keyword inside the graph definition.
       - Ensure every connection or node definition is on a NEW LINE.
       - CRITICAL RULE FOR MERMAID: You MUST wrap ALL node text content in double quotes.
       - Correct: A["Node Label (Description)"] --> B["Another Label"]
       - Incorrect: A[Node Label (Description)] --> B[Another Label]
    4. Use H1 (#) for Main Title.
    5. Use H2 (##) for sections.
    6. Use > for key definitions or "sticky notes".
    7. Highlight key terms in **bold**.
    
    Ensure the content is accurate, educational, and tailored to the requested curriculum.
    For the Mermaid diagram, create a mind map or flowchart summarizing the topic.
  `;

  const response = await ai!.models.generateContent({
    model: model,
    contents: prompt
  });

  const text = response.text || '';
  
  // Parse output (Heuristic parsing)
  // Find JSON block
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  let metadata = { title: req.topic, summary: 'Generated Study Notes' };
  
  if (jsonMatch) {
    try {
      metadata = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Could not parse metadata JSON from response");
    }
  }

  // Extract Mermaid
  const mermaidMatch = text.match(/```mermaid([\s\S]*?)```/);
  const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : undefined;

  // Clean Markdown (remove JSON block if it appears at start)
  let markdownContent = text;
  if (jsonMatch) {
    markdownContent = text.replace(jsonMatch[0], '').trim();
  }

  return {
    title: metadata.title,
    summary: metadata.summary,
    markdownContent,
    mermaidCode,
    timestamp: Date.now()
  };
};

export const generateQuiz = async (req: GenerationRequest): Promise<QuizData> => {
  validateAi();
  const model = 'gemini-2.5-flash'; 

  const quizSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      topic: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            type: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ['id', 'type', 'question', 'options', 'correctAnswer', 'explanation']
        }
      }
    },
    required: ['title', 'topic', 'questions']
  };

  const prompt = `
    Generate a ${req.questionCount || 10} question quiz.
    Subject: ${req.subject}
    Topic: ${req.topic}
    Level: ${req.year} (${req.curriculum})
    Language: ${req.language}
    Type: ${req.quizType}
    Difficulty: ${req.difficulty}

    CRITICAL INSTRUCTIONS:
    1. 'correctAnswer' MUST be an exact string match to one of the strings in 'options'.
    2. Provide a clear 'explanation' for why the answer is correct.
    3. Ensure questions are challenging but appropriate for the grade level.
  `;

  const response = await ai!.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: quizSchema
    }
  });

  let jsonText = response.text || '{}';
  // Clean potential markdown
  jsonText = jsonText.replace(/```json\s*|\s*```/g, '').trim();

  let data: Partial<QuizData> = {};
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    console.error("Quiz JSON parse error", e);
    data = { title: "Error Generating Quiz", questions: [] };
  }

  return {
    title: data.title || `${req.topic} Quiz`,
    topic: req.topic,
    questions: data.questions || [],
    timestamp: Date.now()
  };
};

export const checkHomework = async (req: GenerationRequest): Promise<HomeworkData> => {
  validateAi();
  // Use flash for multimodal capabilities (vision)
  const model = 'gemini-2.5-flash';

  const prompt = `
    You are a friendly and encouraging teacher's assistant.
    
    Context:
    Subject: ${req.subject}
    Level: ${req.year} (${req.curriculum})
    Language: ${req.language}
    Topic (Optional): ${req.topic}

    Task:
    1. Analyze the provided image of the student's homework or notes.
    2. Identify the specific topic being covered if not provided.
    3. Provide specific, constructive feedback.

    Format the output using the following specific Markdown headers (H2) strictly:
    - "## 🔍 Analysis": General overview of the work and topic identification.
    - "## ✅ Correct Points / Strengths": Bullet points of what was done right.
    - "## ❌ Areas for Improvement": Bullet points of errors with corrections and explanations.
    - "## 💡 Recommended Actions": 2-3 specific study tips or concepts to review.

    Start with a H1 title that describes the homework topic.
    Use emoji where appropriate.
  `;

  // Helper to strip data URL prefix if present
  const base64Data = req.homeworkImage?.replace(/^data:image\/\w+;base64,/, '') || '';
  
  const response = await ai!.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: req.homeworkMimeType || 'image/jpeg',
            data: base64Data
          }
        },
        { text: prompt }
      ]
    }
  });

  // Extract title from first line if it's a markdown header
  const text = response.text || '';
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : `Homework Analysis - ${new Date().toLocaleDateString()}`;

  return {
    title: title,
    feedback: text,
    originalImage: req.homeworkImage,
    timestamp: Date.now()
  };
};

export const analyzeWeakness = async (topic: string, mistakes: {question: string, userAnswer: string, correct: string}[], language: Language): Promise<string> => {
  if (!apiKey || !ai) return "API Key missing.";
  const prompt = `
    The student took a quiz on "${topic}" and made the following mistakes:
    ${JSON.stringify(mistakes)}

    Language: ${language}

    Provide a short, encouraging analysis.
    1. Identify the core concept misunderstood.
    2. Provide a 3-step action plan to improve.
    Format as Markdown. Keep it under 200 words.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Keep practicing!";
};

export const generateProgressReport = async (
  user: UserProfile, 
  history: HistoryItem[], 
  results: QuizResult[]
): Promise<AnalysisResult> => {
  validateAi();
  
  const recentQuizzes = results.slice(0, 15).map(r => ({
    topic: r.topic,
    score: r.score,
    total: r.total,
    percentage: r.percentage,
    date: new Date(r.date).toLocaleDateString()
  }));

  const recentNotes = history
    .filter(h => h.type === 'note')
    .slice(0, 10)
    .map(h => h.title);

  const prompt = `
    You are an advanced academic performance coach. 
    Analyze the progress of a student with the following profile:
    - Level: ${user.preferences.defaultYear}
    - Curriculum: ${user.preferences.defaultCurriculum}
    - Language: ${user.preferences.defaultLanguage}

    Activity Data:
    - Recent Quiz Results: ${JSON.stringify(recentQuizzes)}
    - Studied Topics (Notes): ${JSON.stringify(recentNotes)}

    Your Goal:
    Compare their quiz performance against the expected standards for a student in ${user.preferences.defaultYear}.
    - If they are scoring high on advanced topics, note that they are excelling.
    - If they are scoring low, identify if the topic is grade-appropriate (gap in knowledge) or advanced (expected struggle).
    - Provide a holistic view of their study habits based on notes vs quizzes.
    
    IMPORTANT: Provide all text content (summary, strengths, recommendations) in ${user.preferences.defaultLanguage}.

    IMPORTANT INSTRUCTIONS FOR EMPTY DATA:
    - If the student has no quiz results or history, assume they are just starting.
    - Provide a "Ready to Start" status.
    - Create a generic recommended study plan suitable for ${user.preferences.defaultYear} students.
    - Set masteryLevel to 0.

    Output JSON Format:
    {
      "overallStatus": "Short status string",
      "summary": "2-3 sentences summarizing their progress.",
      "strengths": ["List of 3 specific strong points or topics"],
      "weaknesses": ["List of 3 specific weak points or topics"],
      "recommendations": ["List of 3 actionable study steps"],
      "masteryLevel": Number (0-100)
    }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallStatus: { type: Type.STRING },
      summary: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      masteryLevel: { type: Type.NUMBER },
    },
    required: ['overallStatus', 'summary', 'strengths', 'weaknesses', 'recommendations', 'masteryLevel']
  };

  const response = await ai!.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  });

  let jsonText = response.text || '{}';
  // Robustly clean any markdown blocks that might slip through
  jsonText = jsonText.replace(/```json\s*|\s*```/g, '').trim();

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse progress report JSON", e);
    // Return safe fallback
    return {
      overallStatus: "Analysis Failed",
      summary: "We couldn't generate the analysis at this moment. Please try again.",
      strengths: [],
      weaknesses: [],
      recommendations: ["Try generating a few more notes or quizzes first."],
      masteryLevel: 0,
      timestamp: Date.now()
    };
  }

  return {
    overallStatus: data.overallStatus || "Pending Analysis",
    summary: data.summary || "Not enough data to analyze.",
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    recommendations: data.recommendations || [],
    masteryLevel: typeof data.masteryLevel === 'number' ? data.masteryLevel : 0,
    timestamp: Date.now()
  };
};
