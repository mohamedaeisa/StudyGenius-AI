
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { GenerationRequest, StudyNoteData, QuizData, HomeworkData, Language, Difficulty, DetailLevel, UserProfile, HistoryItem, QuizResult, AnalysisResult, Flashcard, FlashcardSet, LearningPath, PodcastData } from '../types';

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
       - Start the block with "graph TD".
       - CRITICAL RULE: Wrap ALL node text in double quotes.
       - Correct: A["Node Label (with parens)"] --> B["Another Label"]
       - Incorrect: A[Node Label (with parens)] --> B[Another Label]
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

export const generateFlashcards = async (req: GenerationRequest): Promise<FlashcardSet> => {
  validateAi();
  
  const prompt = `
    Create 8 high-quality flashcards for:
    Topic: ${req.topic}
    Subject: ${req.subject}
    Level: ${req.year}
    Language: ${req.language}

    Format as JSON array of objects with 'front' and 'back' properties.
    Front: Question, concept, or term.
    Back: Answer, definition, or explanation.
    Keep content concise.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      cards: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ['front', 'back']
        }
      }
    },
    required: ['topic', 'cards']
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
  jsonText = jsonText.replace(/```json\s*|\s*```/g, '').trim();
  const data = JSON.parse(jsonText);

  // Transform to internal format with ID and SR fields
  const cards: Flashcard[] = data.cards.map((c: any, index: number) => ({
    id: `${Date.now()}_${index}`,
    front: c.front,
    back: c.back,
    nextReview: Date.now(), // Due immediately
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0
  }));

  return {
    topic: data.topic || req.topic,
    cards
  };
};

export const generateLearningPath = async (
  user: UserProfile,
  weaknesses: string[],
  subject: string
): Promise<LearningPath> => {
  validateAi();

  const prompt = `
    Create an adaptive learning path for a student.
    Profile: ${user.preferences.defaultYear}, ${user.preferences.defaultCurriculum}.
    Subject: ${subject}
    Identified Weaknesses: ${weaknesses.join(', ') || 'General improvement needed'}
    Language: ${user.preferences.defaultLanguage}

    Generate a sequence of 5 distinct learning milestones/steps.
    If weaknesses exist, prioritize topics addressing them.
    If no weaknesses, suggest a standard logical progression for the grade level.

    For each item, choose the best type: 'note' (to learn), 'quiz' (to test), or 'flashcards' (to memorize).

    Output JSON:
    {
      "subject": "${subject}",
      "items": [
        {
          "topic": "Specific Topic Name",
          "description": "Short reasoning why this is next.",
          "type": "note" | "quiz" | "flashcards"
        }
      ]
    }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['note', 'quiz', 'flashcards'] }
          },
          required: ['topic', 'description', 'type']
        }
      }
    },
    required: ['subject', 'items']
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
  jsonText = jsonText.replace(/```json\s*|\s*```/g, '').trim();
  const data = JSON.parse(jsonText);

  return {
    subject: data.subject,
    items: data.items.map((item: any, idx: number) => ({
      ...item,
      id: `path_${Date.now()}_${idx}`,
      status: idx === 0 ? 'available' : 'locked', // Unlock first item
      reason: item.description
    })),
    generatedAt: Date.now()
  };
};

export const generateLazyGuide = async (req: GenerationRequest): Promise<StudyNoteData> => {
  validateAi();

  // If user provided a URL, we try to use it. If they provided transcript, we use that.
  const contentSource = req.transcriptText 
    ? `TRANSCRIPT: ${req.transcriptText}` 
    : `YOUTUBE URL: ${req.youtubeUrl}`;

  const prompt = `
    You are the "Lazy Student" helper. 
    Analyze the following video content (either provided as a URL or transcript):
    ${contentSource}

    Goal: Create a comprehensive study guide + quick quiz so I don't have to watch the whole video.

    Structure the response exactly as follows:
    1. A JSON block at the VERY START identifying the "title" and a short "summary" (max 200 chars).
    2. A markdown section containing:
       - H1 Title
       - ## 📺 Video Summary (Concise overview)
       - ## 🔑 Key Concepts (Bulleted list of main takeaways)
       - ## 🧠 Detailed Notes (Expand on difficult parts)
       - ## 📝 Self-Check Quiz (5 Multiple Choice Questions with answers hidden in a details/summary block or at the very end).
    3. The markdown MUST include a Mermaid.js diagram definition inside a \`\`\`mermaid block representing the video's logic or flow.
       - Use "graph TD"
       - Wrap node text in quotes.

    Language: ${req.language}
    Level: ${req.year}
  `;

  const response = await ai!.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      // We rely on Gemini's training data or grounding if available to 'watch' the video URL.
      // If it fails to access the URL, it will likely hallucinate or complain, 
      // so the transcript fallback in UI is important.
      tools: [{ googleSearch: {} }] // Enable search to help find video metadata/context
    }
  });

  const text = response.text || '';
  
  // Parse output (Heuristic parsing)
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  let metadata = { title: "Video Summary", summary: 'Generated from YouTube' };
  
  if (jsonMatch) {
    try {
      metadata = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Could not parse metadata JSON");
    }
  }

  const mermaidMatch = text.match(/```mermaid([\s\S]*?)```/);
  const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : undefined;

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

export const generatePodcast = async (req: GenerationRequest, onProgress?: (msg: string) => void): Promise<PodcastData> => {
  validateAi();

  // Determine Constraints
  let wordCount = 300; // Default/Short
  if (req.podcastLength === 'Medium') wordCount = 600;
  if (req.podcastLength === 'Long') wordCount = 1000;

  let voiceName = 'Kore'; // Default Female
  if (req.podcastVoice === 'Male') voiceName = 'Fenrir'; // Male sounding model

  // Language & Dialect Logic
  let languageInstruction = `Language: ${req.language}.`;
  if (req.language === Language.ARABIC) {
    languageInstruction += " CRITICAL: Write the script specifically in Egyptian Arabic Dialect (Ammiya/Masri) so it sounds natural and engaging for a podcast.";
  }

  // Step 1: Generate a Script
  if (onProgress) onProgress("Writing Script...");
  
  const scriptPrompt = `
    You are an expert educational podcast writer.
    Write a short, engaging podcast script explaining: "${req.topic}".
    Target Audience: ${req.year} students.
    ${languageInstruction}
    
    Rules:
    - Target Word Count: Approximately ${wordCount} words.
    - Make it conversational, energetic, and clear.
    - Start with a hook.
    - End with a takeaway.
    - Do NOT include sound effects descriptions like [intro music] or [applause], just the spoken text.
  `;

  const scriptResponse = await ai!.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: scriptPrompt
  });

  const scriptText = scriptResponse.text || "Podcast generation failed.";

  // Step 2: Convert Script to Speech using TTS
  if (onProgress) onProgress("Synthesizing Voice...");

  const audioResponse = await ai!.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: scriptText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  if (onProgress) onProgress("Finalizing Audio...");

  const audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioBase64) {
    throw new Error("Failed to generate audio content.");
  }

  return {
    title: `Podcast: ${req.topic}`,
    topic: req.topic,
    script: scriptText,
    audioBase64: audioBase64,
    timestamp: Date.now()
  };
};
