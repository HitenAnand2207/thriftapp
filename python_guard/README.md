# Python Guard Service Integration

This setup integrates your ThriftIt chatbot with a Python-based guard service running on `localhost:8000`. The chatbot will first attempt to get responses from your Python service, and fallback to local FAQ responses if the service is unavailable.

## 🚀 Quick Start

### 1. Set Up Python Guard Service

```bash
# Navigate to the python_guard directory
cd python_guard

# Install Python dependencies
pip install -r requirements.txt

# Start the Python guard service
uvicorn guard_service:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Your ThriftIt Application

```bash
# In the main project directory
npm run dev
```

### 3. Test the Integration

Visit `http://localhost:3000/admin/guard-test` to test the Python guard service connection.

## 🧪 Testing Your Python Guard

### Browser Test Interface
1. Go to `http://localhost:3000/admin/guard-test`
2. Enter a test message
3. Click "Test Guard" to verify connection
4. View response details and API format

### Direct API Test
```bash
# Test your Python service directly
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I need help with my order",
    "userId": "TEST001", 
    "context": "thriftit_support"
  }'
```

### Customer Chat Test
1. Open the ThriftIt app at `http://localhost:3000`
2. Log in or use the app
3. Click the blue chat button in the bottom-right corner
4. Send messages to see Python guard responses (marked with 🐍 Guard badge)

## 📋 Python Guard API Specification

### Expected Request Format
```json
{
  "message": "user message text",
  "userId": "user_id",
  "context": "thriftit_support"
}
```

### Expected Response Format
```json
{
  "response": "bot response text",
  "suggestions": ["suggestion1", "suggestion2"],
  "switchToHuman": false
}
```

### Response Fields
- `response` (string, required): The bot's response message
- `suggestions` (array, optional): Quick reply suggestions for the user
- `switchToHuman` (boolean, optional): Set to `true` to escalate to human support

## 🔧 Customizing Your Python Guard

### Adding New Response Logic
Edit `guard_service.py` in the `get_intelligent_response()` function:

```python
def get_intelligent_response(message: str, user_id: str) -> ChatResponse:
    message_lower = message.lower()
    
    # Add your custom logic here
    if "custom_keyword" in message_lower:
        return ChatResponse(
            response="Your custom response here",
            suggestions=["suggestion1", "suggestion2"]
        )
    
    # Your existing logic...
```

### Integrating AI/ML Models
Replace the simple keyword matching with your AI model:

```python
# Example with OpenAI
import openai

def get_intelligent_response(message: str, user_id: str) -> ChatResponse:
    # Use your AI model
    ai_response = your_ai_model.generate_response(message)
    
    return ChatResponse(
        response=ai_response.text,
        suggestions=ai_response.suggestions,
        switchToHuman=ai_response.needs_human
    )
```

### Adding Context and Memory
Store conversation context in your Python service:

```python
# Example conversation memory
conversation_memory = {}

def get_intelligent_response(message: str, user_id: str) -> ChatResponse:
    # Get user's conversation history
    context = conversation_memory.get(user_id, [])
    
    # Add current message to context
    context.append({"role": "user", "content": message})
    
    # Generate response with context
    response = your_ai_model.chat(context)
    
    # Store response in memory
    context.append({"role": "assistant", "content": response})
    conversation_memory[user_id] = context[-10:]  # Keep last 10 messages
    
    return ChatResponse(response=response)
```

## 🔄 Integration Flow

1. **User sends message** → ThriftIt frontend
2. **Frontend sends to backend** → `/api/chat/message`
3. **Backend calls Python guard** → `POST http://localhost:8000/chat`
4. **Python guard processes** → Your custom logic/AI
5. **Guard returns response** → JSON response
6. **Backend saves & returns** → Chat history + response to frontend
7. **Frontend displays** → Message with 🐍 Guard badge

## 🛠 Advanced Features

### Error Handling
The system automatically falls back to local FAQ responses if your Python service is unavailable:

```javascript
// In server.js - automatic fallback
try {
  const guardResponse = await fetch('http://localhost:8000/chat', {...});
  // Use Python guard response
} catch (error) {
  console.log('Python guard service not available, using fallback logic');
  // Use local FAQ responses
}
```

### Request Timeout
The system has a 5-second timeout for Python guard requests to ensure responsiveness.

### Response Caching
You can add response caching in your Python service:

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def get_cached_response(message_hash: str, user_id: str):
    # Your expensive AI computation here
    return generate_ai_response(message, user_id)

def get_intelligent_response(message: str, user_id: str) -> ChatResponse:
    message_hash = hashlib.md5(message.lower().encode()).hexdigest()
    cached_response = get_cached_response(message_hash, user_id)
    return ChatResponse(response=cached_response)
```

## 🔒 Security Considerations

### Production Deployment
- Use HTTPS for all communications
- Implement proper authentication between services
- Add rate limiting to prevent abuse
- Sanitize all inputs and outputs
- Use environment variables for configuration

### Example Production Security
```python
# In guard_service.py
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
GUARD_API_KEY = os.getenv("GUARD_API_KEY")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != GUARD_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
```

## 📊 Monitoring and Logging

Your Python service includes basic logging. For production, consider:

```python
import logging
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    logger.info("chat_request", user_id=request.userId, message_length=len(request.message))
    # Your logic here
    logger.info("chat_response", response_length=len(response.response), switched_to_human=response.switchToHuman)
```

## 🚨 Troubleshooting

### Python Service Not Starting
```bash
# Check if port 8000 is in use
netstat -an | findstr :8000  # Windows
lsof -i :8000               # macOS/Linux

# Try different port
uvicorn guard_service:app --port 8001
```

### Connection Refused Error
- Ensure Python service is running on port 8000
- Check firewall settings
- Verify the service URL in server.js matches your setup

### CORS Errors
The Python service is configured for localhost:3000. If using different ports, update:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://your-domain.com"],
    # ...
)
```

### Chat Not Using Python Guard
1. Check the test interface at `/admin/guard-test`
2. Verify Python service logs for incoming requests
3. Check browser developer tools for network errors
4. Look for the 🐍 Guard badge on bot responses

## 📞 Support

If you encounter issues:
1. Check the Python service logs
2. Use the test interface at `/admin/guard-test`
3. Verify API request/response format
4. Check network connectivity between services

---

🎉 **Your Python guard service is now integrated with the ThriftIt chatbot!**

Messages will be processed by your Python service first, with automatic fallback to local responses if your service is unavailable.