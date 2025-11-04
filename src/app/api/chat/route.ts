import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getAuth } from "firebase/admin";
import { initializeApp, getApps } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuth();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return new Response("Unauthorized: No token provided", { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return new Response("Unauthorized: Invalid token", { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Failed to process chat request. Please check your API configuration.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
