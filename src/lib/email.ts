import { SendInterviewInvitationParams } from '@/types';
import { auth } from '@/lib/firebase';
import appConfig from '@/config/app.config.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || appConfig.backendUrl;

export async function sendInterviewInvitation(
  params: SendInterviewInvitationParams
) {
  if (!params.jobId || !params.candidateId) {
    throw new Error('Job ID and Candidate ID are required');
  }

  if (!auth.currentUser) {
    throw new Error('User must be authenticated to send invitations');
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          recruiterId: auth.currentUser.uid
        }),
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