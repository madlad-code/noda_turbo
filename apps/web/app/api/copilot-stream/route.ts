// FILE: apps/web/app/api/copilot-stream/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { newMessage, history, sessionId } = body;

    // Validate required fields
    if (!newMessage || !sessionId) {
      return NextResponse.json({ 
        error: 'newMessage and sessionId are required' 
      }, { status: 400 });
    }

    // Get LLM service URL from environment or use default
    const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:5001/chat';
    
    console.log(`Making request to LLM service: ${LLM_SERVICE_URL}`);
    console.log(`Message: ${newMessage.substring(0, 100)}...`);
    console.log(`Session ID: ${sessionId}`);

    // Call the intelligent LLM service
    const llmResponse = await fetch(LLM_SERVICE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: newMessage,
        conversation_id: sessionId,
        stream: false
      }),
    });

    // Handle LLM service errors
    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error(`LLM service error: ${llmResponse.status}`, errorBody);
      
      return NextResponse.json({ 
        error: `LLM service failed: ${errorBody}` 
      }, { status: llmResponse.status });
    }

    // Parse LLM service response
    const data = await llmResponse.json();
    
    console.log('LLM Service Response:', {
      hasText: !!data.text,  // ← CHANGED: Python returns "text" not "response"
      textLength: data.text?.length,
      hasUiActions: !!data.ui_actions,
      uiActionsCount: data.ui_actions?.length || 0,
      conversationId: data.conversation_id,
      timestamp: data.timestamp
    });

    // Transform response to match frontend expectations
    const transformedResponse = {
      text: data.text || data.response || "No response generated",  // ← FIXED: Try both fields
      ui_actions: data.ui_actions || [],  // ← ADDED: Include chart data
      sessionId: data.conversation_id,
      timestamp: data.timestamp
    };

    console.log('Transformed Response:', {
      hasText: !!transformedResponse.text,
      textLength: transformedResponse.text?.length,
      hasUiActions: transformedResponse.ui_actions.length > 0,
      sessionId: transformedResponse.sessionId
    });

    return NextResponse.json(transformedResponse);

  } catch (error) {
    console.error('Error in copilot API route:', error);
    
    // Return user-friendly error message
    return NextResponse.json({ 
      error: 'An internal server error occurred. Please try again.' 
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST.' 
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST.' 
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST.' 
  }, { status: 405 });
}