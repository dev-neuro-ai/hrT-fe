import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

const ASSISTANT_ID = 'asst_K8APL9er58uqixqgKBSRD1iu';

export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export async function sendMessage(threadId: string, message: string) {
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
  });

  // Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  if (runStatus.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(threadId);
    const content = messages.data[0].content[0];
    if ('text' in content) {
      return content.text.value;
    }
    throw new Error('Invalid message content type');
  } else {
    throw new Error('Assistant run failed');
  }
}

export async function generateJobDescription(
  conversation: string[],
  mandatoryQuestions: string[]
) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Based on the conversation transcript and mandatory interview questions, generate a structured job description and comprehensive interview prompt. Return the response as a JSON object with the following structure:
        {
          "jobDescription": {
            "title": "Job Title",
            "department": "Department Name",
            "location": "Location",
            "type": "full-time" | "part-time" | "contract",
            "description": "Detailed job description",
            "requirements": ["requirement1", "requirement2"],
            "responsibilities": ["responsibility1", "responsibility2"]
          },
          "interviewPrompt": {
            "introduction": "Brief overview of the role and key areas to assess",
            "structure": {
              "recommendedDuration": "Total interview duration",
              "segments": [
                {
                  "name": "Segment name (e.g., Introduction, Technical)",
                  "duration": "Time in minutes",
                  "objectives": ["Key objectives"]
                }
              ]
            },
            "mandatoryQuestions": ["Provided mandatory questions"],
            "suggestedQuestions": {
              "technical": ["Technical questions"],
              "behavioral": ["Behavioral questions"],
              "roleSpecific": ["Role-specific questions"]
            },
            "evaluationCriteria": {
              "technical": ["Technical skills to evaluate"],
              "behavioral": ["Behavioral traits to assess"],
              "redFlags": ["Warning signs to watch for"]
            },
            "scoringGuidelines": {
              "criteria": ["Aspects to score"],
              "passingCriteria": "What constitutes a passing score"
            }
          }
        }`,
      },
      {
        role: 'user',
        content: `Conversation transcript:\n${conversation.join(
          '\n'
        )}\n\nMandatory interview questions:\n${mandatoryQuestions.join('\n')}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
