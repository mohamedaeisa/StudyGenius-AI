
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { GenerationRequest, StudyNoteData, QuizData, HomeworkData, Language, Difficulty, DetailLevel, UserProfile, HistoryItem, QuizResult, AnalysisResult, Flashcard, FlashcardSet, LearningPath, PodcastData, CheatSheetData } from '../types';

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

  // Clean Markdown
  let markdownContent = text;
  
  // 1. Remove JSON metadata block
  if (jsonMatch) {
    markdownContent = markdownContent.replace(jsonMatch[0], '').trim();
  }
  
  // 2. Remove Mermaid block to prevent raw text display
  if (mermaidMatch) {
    markdownContent = markdownContent.replace(mermaidMatch[0], '').trim();
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
  subject: string,
  customGoal?: string // New Optional Parameter
): Promise<LearningPath> => {
  validateAi();

  let contextInstruction = "";
  
  if (customGoal && customGoal.trim().length > 0) {
    contextInstruction = `
      USER CUSTOM GOAL: "${customGoal}".
      Ignore standard curriculum flow if it conflicts with this goal. 
      Create a path specifically designed to achieve this goal efficiently.
      Subject: Derived from goal or default to ${subject}.
    `;
  } else {
    contextInstruction = `
      Identified Weaknesses: ${weaknesses.join(', ') || 'General improvement needed'}.
      Prioritize topics that address these specific weaknesses first.
      Subject: ${subject}.
    `;
  }

  const prompt = `
    Create a granular, adaptive learning path for a student.
    Profile: ${user.preferences.defaultYear}, ${user.preferences.defaultCurriculum}.
    Language: ${user.preferences.defaultLanguage}

    ${contextInstruction}

    Generate a sequence of 5 learning milestones.
    Order them logically: Start with foundational concepts (Easy), then move to application (Medium), and finally advanced synthesis (Hard).
    
    For each item:
    1. 'type' MUST be exactly one of: "notes", "quiz", "flashcards". (Use "notes" to learn, "flashcards" to memorize, "quiz" to test).
    2. 'difficulty' MUST be one of: "Easy", "Medium", "Hard".
    3. 'description': Brief reason for this step.

    Output JSON:
    {
      "subject": "${subject}",
      "items": [
        {
          "topic": "Specific Topic Name",
          "description": "Short reasoning.",
          "type": "notes" | "quiz" | "flashcards",
          "difficulty": "Easy" | "Medium" | "Hard"
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
            type: { type: Type.STRING, enum: ['notes', 'quiz', 'flashcards'] },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
          },
          required: ['topic', 'description', 'type', 'difficulty']
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
  const hasTranscript = req.transcriptText && req.transcriptText.trim().length > 0;
  const contentSource = hasTranscript
    ? `TRANSCRIPT: ${req.transcriptText}` 
    : `YOUTUBE URL: ${req.youtubeUrl}`;

  const prompt = `
    You are the "Lazy Student" AI assistant.
    
    SOURCE DATA:
    ${contentSource}

    TASK:
    Create a comprehensive study guide and quiz based *strictly* on the source provided.

    CRITICAL RULES FOR URLS:
    1. If NO transcript is provided and you only have a URL, you MUST use the Google Search tool to find the video's title, description, and content summary.
    2. If you cannot find specific information about *this specific video* (e.g., if search returns nothing relevant), do NOT hallucinate or generate generic content based on words in the URL.
    3. Instead, if content is inaccessible, return a title of "Content Unavailable" and a summary of "Unable to verify video content. Please paste the transcript for accuracy." in the JSON block.

    OUTPUT FORMAT:
    1. A JSON block at the VERY START: { "title": "...", "summary": "..." }
    2. A Markdown section containing:
       - H1 Title
       - ## 📺 Video Summary (Concise overview)
       - ## 🔑 Key Concepts (Bulleted list)
       - ## 🧠 Detailed Notes
       - ## 📝 Self-Check Quiz (5 Multiple Choice Questions)
    3. A Mermaid.js diagram inside \`\`\`mermaid block.
       - Start with "graph TD"
       - CRITICAL: Wrap ALL node text in double quotes. e.g. A["Text"] --> B["Other Text"]

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
  
  // 1. Remove JSON metadata
  if (jsonMatch) {
    markdownContent = markdownContent.replace(jsonMatch[0], '').trim();
  }
  
  // 2. Remove Mermaid code block
  if (mermaidMatch) {
    markdownContent = markdownContent.replace(mermaidMatch[0], '').trim();
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

export const generateCheatSheet = async (req: GenerationRequest): Promise<CheatSheetData> => {
  validateAi();
  const model = 'gemini-2.5-flash';

  const prompt = `
    You are an expert tutor creating a high-density "Cheat Sheet" for a student.
    Subject: ${req.subject}
    Topic: ${req.topic}
    Level: ${req.year}
    Language: ${req.language}

    Goal: Create a comprehensive, single-page reference guide (Markdown).
    
    Structure:
    1. **Key Definitions**: Bullets of must-know terms.
    2. **Core Formulas/Rules**: If applicable (Math/Science) show formulas. If History/Lit, show Dates/Themes.
    3. **Important Steps**: Process breakdowns (e.g. "How to solve X").
    4. **Common Pitfalls**: "Don't do this" or "Watch out for".
    5. **Quick Examples**: 1-2 tiny examples.

    Formatting Rules:
    - Use concise language. No fluff.
    - Use Bold (**text**) for terms.
    - Use Tables for comparisons if useful.
    - Use Code blocks for formulas if needed.
    - Keep it visually organized for quick scanning.
  `;

  const response = await ai!.models.generateContent({
    model: model,
    contents: prompt
  });

  const text = response.text || "Generation failed";

  return {
    title: `Cheat Sheet: ${req.topic}`,
    topic: req.topic,
    content: text,
    timestamp: Date.now()
  };
};
