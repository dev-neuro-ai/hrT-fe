const express = require("express");
const { Resend } = require("resend");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
const Retell = require("retell-sdk");
const OpenAI = require("openai");

const setTimeout = require("timers").setTimeout;

// Load environment variables
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_CLIENT_ID = process.env.FIREBASE_CLIENT_ID;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: FIREBASE_PROJECT_ID,
  private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();

// Initialize Resend with your API key
const resend = new Resend(RESEND_API_KEY);

// Initialize Retell client
const client = new Retell({
  apiKey: RETELL_API_KEY,
});

// Enable CORS for all routes
app.use(
  cors({
    origin: "*", // For development, allow all origins
    methods: ["POST", "GET", "OPTIONS"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Email API is running");
});

app.post("/api/send-email", async (req, res) => {
  try {
    const {
      to,
      candidateName,
      jobTitle,
      interviewDate,
      interviewTime,
      additionalNotes,
      jobId,
      candidateId,
      recruiterId, // Add recruiterId to request body
    } = req.body;

    // Validate required fields
    if (!jobId || !candidateId || !recruiterId) {
      throw new Error("Job ID, Candidate ID, and Recruiter ID are required");
    }

    // Get job details from Firestore
    const jobRef = db.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      throw new Error("Job not found");
    }

    const jobData = jobDoc.data();

    // Verify that the job belongs to the recruiter
    if (jobData.recruiterId !== recruiterId) {
      throw new Error(
        "Unauthorized: Cannot send invitation for job created by another recruiter",
      );
    }

    // Create Retell LLM
    const llmResponse = await axios.post(
      "https://api.retellai.com/create-retell-llm",
      {
        model: "gpt-4o",
        general_prompt: `
          You are conducting a screening interview for the ${jobTitle} position.

          No need to tell your name to the interviewee. 

          The interview should be natural and like a conversation, you should not just read out the questions all at one time. You need to ask the questions naturally and have a conversation with the interviewee.

          Job Description:
          ${jobData.description}

          Key Requirements:
          ${jobData.requirements.join("\n")}

          Key Responsibilities:
          ${jobData.responsibilities.join("\n")}
          ((If you don't receive this location, then ask them according to you)

          Interview Structure:
          ${jobData.interviewPrompt?.introduction || ""}

          Mandatory Questions:
          ${jobData.interviewPrompt?.mandatoryQuestions?.join("\n") || ""}

          Location Of the Job:
          ${jobData?.location}
          (If you don't receive this location, then skip this)

          You are interviewing ${candidateName}. Please conduct a professional and thorough screening interview.
        `,
      },
      {
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const llmId = llmResponse.data.llm_id;

    // Create Retell agent
    const agentResponse = await axios.post(
      "https://api.retellai.com/create-agent",
      {
        response_engine: { llm_id: llmId, type: "retell-llm" },
        voice_id: "11labs-Adrian",
      },
      {
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const agentId = agentResponse.data.agent_id;

    // Create screening record in Firestore
    const screeningRef = await db.collection("screenings").add({
      jobId,
      candidateId,
      recruiterId, // Add recruiterId to screening record
      llmId,
      agentId,
      prompt: llmResponse.data.general_prompt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    });

    // Generate screening link using the frontend URL
    const screeningLink = `${FRONTEND_URL}/screening/${screeningRef.id}`;

    // Send email with screening link
    const emailResponse = await resend.emails.send({
      from: "info@appmail.betterhr.ai",
      to: [to],
      subject: `Interview Invitation: ${jobTitle} Position`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Interview Invitation</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for your application for the ${jobTitle} position. We would like to invite you for an interview.</p>

          <div style="margin: 24px 0; padding: 16px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
            <h3 style="margin-top: 0; color: #0369a1;">Screening Interview</h3>
            <p>Before your interview, please complete a brief screening interview with our AI assistant.</p>
            <p>Click the link below to start your screening:</p>
            <a href="${screeningLink}" style="display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 12px;">Start Screening Interview</a>
          </div>

          <p>Best regards,<br>The Hiring Team</p>
        </div>
      `,
    });
    console.log(emailResponse);
    res.json({
      success: true,
      data: {
        email: emailResponse,
        screening: {
          id: screeningRef.id,
          agentId,
          llmId,
        },
      },
    });
  } catch (error) {
    console.error("Failed to process request:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start web call endpoint
app.post("/api/start-web-call", async (req, res) => {
  try {
    const { agent_id } = req.body;

    if (!agent_id) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    const webCallResponse = await client.call.createWebCall({ agent_id });

    // Save the call ID in the screening collection
    const screeningsRef = db.collection("screenings");
    const screeningSnapshot = await screeningsRef
      .where("agentId", "==", agent_id)
      .get();

    if (!screeningSnapshot.empty) {
      const screeningDoc = screeningSnapshot.docs[0];
      await screeningDoc.ref.update({
        callId: webCallResponse.call_id,
      });
    }

    res.json({
      success: true,
      accessToken: webCallResponse.access_token,
    });
  } catch (error) {
    console.error("Error starting web call:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start web call",
    });
  }
});

app.post("/api/save-analytics", async (req, res) => {
  try {
    const { screeningId } = req.body;

    if (!screeningId) {
      return res.status(400).json({
        success: false,
        error: "Screening ID is required",
      });
    }

    // Get screening document
    const screeningRef = db.collection("screenings").doc(screeningId);
    const screeningDoc = await screeningRef.get();

    if (!screeningDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Screening not found",
      });
    }

    const screeningData = screeningDoc.data();
    const { callId, jobId, candidateId } = screeningData;

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: "Call ID not found in screening document",
      });
    }

    try {
      // Wait for 3 seconds before proceeding
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get call analytics from Retell
      const analyticsResponse = await client.call.retrieve(callId);

      // Get job details for GPT-4 analysis
      const jobRef = db.collection("jobs").doc(jobId);
      const jobDoc = await jobRef.get();
      const jobData = jobDoc.data();

      // Get GPT-4 analysis of the interview
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert HR analyst. Analyze this screening interview transcript and provide a score based on the candidate's responses and fit for the role. YOUR JOB IS TO ONLY JUDGE THE TRANSCRIPT AND WHETHER THE CANDIDATE IS THE RIGHT FIT OR NOT. YOU NEED TO BE EXTREMELY STRICT WHILE SCORING AND GIVING ANALYSIS. VERY CAREFULLY READ THE SCREENING TRANSCRIPT. Consider:

1. Technical skills match
2. Communication ability
3. Experience relevance
4. Cultural fit
5. Understanding of the role

Return a JSON object with:
{
  "score": number (0-100),
  "analysis": {
    "strengths": ["key strengths observed"],
    "weaknesses": ["areas for improvement"],
    "recommendation": "hire/consider/reject with brief reason"
  }
}`,
          },
          {
            role: "user",
            content: `
Job Details:
Title: ${jobData.title}
Description: ${jobData.description}
Requirements: ${jobData.requirements.join(", ")}
Responsibilities: ${jobData.responsibilities.join(", ")}


Screening Transcript:

${analyticsResponse.transcript}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const scoreAnalysis = JSON.parse(completion.choices[0].message.content);

      const analyticsData = {
        call_id: analyticsResponse.call_id,
        agent_id: analyticsResponse.agent_id,
        call_status: analyticsResponse.call_status,
        start_timestamp: analyticsResponse.start_timestamp || null,
        end_timestamp: analyticsResponse.end_timestamp || null,
        duration_ms: analyticsResponse.duration_ms || 0,
        transcript: analyticsResponse.transcript || "",
        transcript_object: analyticsResponse.transcript_object || null,
        transcript_with_tool_calls:
          analyticsResponse.transcript_with_tool_calls || null,
        recording_url: analyticsResponse.recording_url || null,
        public_log_url: analyticsResponse.public_log_url || null,
        disconnection_reason: analyticsResponse.disconnection_reason || null,
        latency: analyticsResponse.latency || null,
        cost_metadata: analyticsResponse.cost_metadata || null,
        call_cost: analyticsResponse.call_cost || null,
        opt_out_sensitive_data_storage:
          analyticsResponse.opt_out_sensitive_data_storage || false,
        llm_latency: analyticsResponse.llm_latency || null,
        call_type: analyticsResponse.call_type || null,
      };

      // Filter out any remaining undefined values
      const cleanAnalyticsData = Object.fromEntries(
        Object.entries(analyticsData).filter(([_, v]) => v !== undefined),
      );

      await screeningRef.update({
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        analytics: cleanAnalyticsData,
        score: scoreAnalysis,
      });

      // Update candidate status and score in job document
      if (jobId && candidateId) {
        const jobRef = db.collection("jobs").doc(jobId);
        const jobDoc = await jobRef.get();

        if (jobDoc.exists) {
          const jobData = jobDoc.data();
          const candidates = jobData.candidates || {};

          candidates[candidateId] = {
            ...candidates[candidateId],
            screeningStatus: "screening-complete",
            screeningCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            screeningScore: scoreAnalysis.score,
            screeningAnalysis: scoreAnalysis.analysis,
          };

          await jobRef.update({ candidates });
        }
      }

      res.json({
        success: true,
        message: "Analytics saved and status updated successfully",
        score: scoreAnalysis,
      });
    } catch (analyticsError) {
      console.error("Error getting analytics:", analyticsError);

      // Still update the status even if analytics retrieval fails
      await screeningRef.update({
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update candidate status in job document
      if (jobId && candidateId) {
        const jobRef = db.collection("jobs").doc(jobId);
        const jobDoc = await jobRef.get();

        if (jobDoc.exists) {
          const jobData = jobDoc.data();
          const candidates = jobData.candidates || {};

          candidates[candidateId] = {
            ...candidates[candidateId],
            screeningStatus: "screening-complete",
            screeningCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          await jobRef.update({ candidates });
        }
      }

      res.json({
        success: true,
        message: "Status updated successfully (analytics unavailable)",
      });
    }
  } catch (error) {
    console.error("Error saving analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save analytics",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
