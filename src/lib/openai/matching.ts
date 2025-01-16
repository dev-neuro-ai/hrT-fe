import OpenAI from 'openai';
import { Candidate, JobDescription } from '@/types';

const openai = new OpenAI({
  apiKey:
    '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',
  dangerouslyAllowBrowser: true,
});

export async function calculateMatchScore(
  candidate: Candidate,
  job: JobDescription
) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Analyze the candidate's profile against the job requirements and provide a match score. 
        Consider:
        - Skills match
        - Experience level
        - Education relevance
        - Role requirements fit
        
        Return a JSON object with:
        {
          "score": number (0-100),
          "analysis": {
            "strengths": ["key matching strengths"],
            "gaps": ["key gaps or mismatches"],
            "recommendation": "hire/consider/reject with brief reason"
          }
        }`,
      },
      {
        role: 'user',
        content: `
        Job Details:
        Title: ${job.title}
        Description: ${job.description}
        Requirements: ${job.requirements.join(', ')}
        Responsibilities: ${job.responsibilities.join(', ')}

        Candidate Details:
        Name: ${candidate.name}
        Experience: ${candidate.experience} years
        Education: ${candidate.education}
        Skills: ${candidate.skills.join(', ')}
        `,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
}
