import { SendInterviewInvitationParams } from '@/types';

export async function sendInterviewInvitation(
  params: SendInterviewInvitationParams
) {
  if (!params.jobId || !params.candidateId) {
    throw new Error('Job ID and Candidate ID are required');
  }

  try {
    const response = await fetch(
      'https://betterhr-backend.replit.app/api/send-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send interview invitation:', error);
    throw error;
  }
}
