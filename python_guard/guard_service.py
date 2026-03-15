# Python Guard Service for ThriftIt Chatbot
# Run this with: uvicorn guard_service:app --host 0.0.0.0 --port 8001 --reload

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from typing import List, Optional
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ThriftIt Guard Service", version="1.0.0")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    userId: str
    context: str = "thriftit_support"

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = []
    switchToHuman: bool = False

# Sample responses for testing
SAMPLE_RESPONSES = {
    "hello": {
        "response": "🐍 Hello from Python Guard! I'm here to help with your ThriftIt questions. What can I help you with today?",
        "suggestions": ["Track my order", "Return policy", "Payment help", "Account issues"]
    },
    "order": {
        "response": "🐍 I can help you with order tracking! Please check your order history in the 'You' section of the app. If you need specific order details, please provide your order number.",
        "suggestions": ["Order history", "Shipping info", "Contact seller"]
    },
    "payment": {
        "response": "🐍 For payment issues, I can help! Common solutions:\n• Check payment method validity\n• Ensure sufficient funds\n• Try different payment method\n• Clear browser cache",
        "suggestions": ["Payment methods", "Refund status", "Billing help", "Talk to human"]
    },
    "return": {
        "response": "🐍 Return policy info:\n• 7 days from delivery\n• Items must be in original condition\n• Contact seller first\n• We can mediate if needed",
        "suggestions": ["Contact seller", "Return steps", "Refund timeline"]
    },
    "seller": {
        "response": "🐍 Seller questions? I can help with:\n• Product listing process\n• Seller dashboard features\n• Commission structure\n• Shipping guidelines",
        "suggestions": ["How to list", "Seller fees", "Dashboard guide"]
    }
}

def get_intelligent_response(message: str, user_id: str) -> ChatResponse:
    """
    This is where you would integrate your actual AI/ML model
    For now, it uses simple keyword matching
    """
    message_lower = message.lower()
    
    # Check for greetings
    if any(word in message_lower for word in ["hello", "hi", "hey", "good morning", "afternoon"]):
        return ChatResponse(**SAMPLE_RESPONSES["hello"])
    
    # Check for order-related queries
    if any(word in message_lower for word in ["order", "track", "shipping", "delivery"]):
        return ChatResponse(**SAMPLE_RESPONSES["order"])
    
    # Check for payment queries
    if any(word in message_lower for word in ["payment", "pay", "card", "billing", "charge"]):
        return ChatResponse(**SAMPLE_RESPONSES["payment"])
    
    # Check for return queries  
    if any(word in message_lower for word in ["return", "exchange", "refund"]):
        return ChatResponse(**SAMPLE_RESPONSES["return"])
    
    # Check for seller queries
    if any(word in message_lower for word in ["sell", "listing", "seller", "dashboard"]):
        return ChatResponse(**SAMPLE_RESPONSES["seller"])
    
    # Check for human support request
    if any(word in message_lower for word in ["human", "agent", "person", "representative"]):
        return ChatResponse(
            response="🐍 I'll connect you with a human support agent right away!",
            suggestions=[],
            switchToHuman=True
        )
    
    # Default response for unrecognized queries
    return ChatResponse(
        response=f"🐍 I see you're asking about: '{message}'. Let me connect you with a human agent who can better help you with this specific question.",
        suggestions=["Talk to human", "Try different question", "Browse help"],
        switchToHuman=True
    )

@app.get("/")
async def root():
    return {
        "service": "ThriftIt Python Guard",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "chat": "POST /chat",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "guard_service"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint that processes user messages
    """
    try:
        logger.info(f"Received chat request from user {request.userId}: {request.message}")
        
        # Get intelligent response
        response = get_intelligent_response(request.message, request.userId)
        
        logger.info(f"Generated response: {response.response[:50]}...")
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        # Return a fallback response instead of raising an HTTP exception
        return ChatResponse(
            response="🐍 I encountered an error processing your request. Let me connect you with a human agent.",
            suggestions=["Talk to human support"],
            switchToHuman=True
        )

@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify the service is working"""
    return {
        "message": "Python Guard Service is working!",
        "test_response": get_intelligent_response("Hello test", "TEST001")
    }

if __name__ == "__main__":
    import uvicorn
    print("🐍 Starting ThriftIt Python Guard Service...")
    print("🌐 Service will be available at: http://localhost:8001")
    print("📚 API docs at: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)