import { Candidate } from '@/types';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';
import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

// Initialize PDF.js worker
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

async function convertPDFToImages(file: File): Promise<string[]> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload files');
  }

  const userId = auth.currentUser.uid;
  const tempUrls: string[] = [];
  const tempRefs: any[] = [];

  try {
    // If the file is already an image, just upload it directly
    if (file.type.startsWith('image/')) {
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storageRef = ref(
        storage,
        `temp/${userId}/${timestamp}_${safeFileName}`
      );
      tempRefs.push(storageRef);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);
      tempUrls.push(publicUrl);
      return tempUrls;
    }

    // For PDFs, convert to PNG
    if (file.type === 'application/pdf') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const objectUrl = URL.createObjectURL(file);
      const pdf = await pdfjsLib.getDocument(objectUrl).promise;

      // Convert first 3 pages to PNG (to stay within OpenAI's token limits)
      const pagesToProcess = Math.min(pdf.numPages, 3);

      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.8);
        });

        const timestamp = Date.now();
        const storageRef = ref(
          storage,
          `temp/${userId}/${timestamp}_page${pageNum}.png`
        );
        tempRefs.push(storageRef);
        await uploadBytes(storageRef, blob);
        const publicUrl = await getDownloadURL(storageRef);
        tempUrls.push(publicUrl);
      }

      URL.revokeObjectURL(objectUrl);
      return tempUrls;
    }

    throw new Error('Unsupported file type');
  } catch (error) {
    // Clean up any uploaded temporary files
    await Promise.all(tempRefs.map((ref) => deleteObject(ref).catch(() => {})));
    throw error;
  }
}

export async function extractResumeData(
  file: File
): Promise<Partial<Candidate>> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to process resumes');
  }

  let tempImageUrls: string[] = [];
  let tempRefs: any[] = [];

  try {
    // Step 1: Convert to images for OpenAI processing
    tempImageUrls = await convertPDFToImages(file);
    tempRefs = tempImageUrls.map((url) => {
      const path = new URL(url).pathname.split('/o/')[1].split('?')[0];
      return ref(storage, decodeURIComponent(path));
    });

    // Step 2: Extract data using OpenAI Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract resume information and return ONLY valid JSON in this format:
        {
          "name": "Full Name",
          "email": "email@example.com",
          "skills": ["skill1", "skill2"],
          "experience": 5,
          "education": "Highest degree",
          "analysis": {
            "summary": "Brief professional summary",
            "strengths": ["strength1", "strength2", "strength3"],
            "areasForImprovement": ["area1", "area2"],
            "fitScore": 85,
            "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
          }
        }`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the key information from this resume and provide a comprehensive analysis.',
            },
            ...tempImageUrls.map((url) => ({
              type: 'image_url',
              image_url: { url },
            })),
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const parsedData = JSON.parse(completion.choices[0].message.content);

    return {
      name: parsedData.name || null,
      email: parsedData.email || null,
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience:
        typeof parsedData.experience === 'number' ? parsedData.experience : 0,
      education: parsedData.education || null,
    };
  } catch (error) {
    console.error('Error processing resume:', error);
    throw error;
  } finally {
    // Clean up temporary files
    await Promise.all(tempRefs.map((ref) => deleteObject(ref).catch(() => {})));
  }
}