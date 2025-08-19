from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import openai
import anthropic
import ldclient
from ldclient import Context
from ldclient.config import Config
from ldai.client import LDAIClient, AIConfig, ModelConfig, LDMessage, ProviderConfig
import json

load_dotenv()

app = FastAPI(title="Wedding Thank You Generator", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=json.loads(os.getenv("ALLOWED_ORIGINS", '["http://localhost:5173"]')),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LaunchDarkly client with AI Config
try:
    sdk_key = os.getenv("LAUNCHDARKLY_SDK_KEY")
    if sdk_key and sdk_key != "your_launchdarkly_sdk_key_here":
        ldclient.set_config(Config(sdk_key))
        ld_client = ldclient.get()
        ai_client = LDAIClient(ld_client)
    else:
        print("Warning: LaunchDarkly SDK key not configured. Using fallback mode.")
        ld_client = None
        ai_client = None
except Exception as e:
    print(f"Warning: Could not initialize LaunchDarkly client: {e}")
    ld_client = None
    ai_client = None

# Initialize AI clients (only if API keys are available and valid)
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key and openai_api_key != "your_openai_api_key_here":
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_api_key)
    except Exception as e:
        print(f"Warning: Could not initialize OpenAI client: {e}")
        openai_client = None
else:
    openai_client = None

anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
if anthropic_api_key and anthropic_api_key != "your_anthropic_api_key_here":
    try:
        anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
    except Exception as e:
        print(f"Warning: Could not initialize Anthropic client: {e}")
        anthropic_client = None
else:
    anthropic_client = None

class ThankYouRequest(BaseModel):
    gift_giver_name: str
    gift_description: str
    relationship: str  # e.g., "family", "friend", "colleague", "family friend"
    additional_notes: Optional[str] = None  # Optional context about the gift or relationship
    next_meeting: Optional[str] = None  # When you expect to see them next

class ThankYouResponse(BaseModel):
    thank_you_note: str
    ai_model_used: str
    prompt_strategy: str
    generation_metadata: Dict[str, Any]

def get_ai_config_for_user(user_key: str = "test-user", user_attributes: dict = None) -> tuple[AIConfig, any]:
    """Get AI configuration from LaunchDarkly AI Config - NO FALLBACKS"""
    
    # Require LaunchDarkly AI client to be available
    if not ai_client:
        raise Exception("LaunchDarkly AI client not configured - cannot proceed without it")
    
    # Build rich user context with attributes (like the LaunchDarkly example)
    context_builder = Context.builder(user_key)
    
    if user_attributes:
        for key, value in user_attributes.items():
            context_builder.set(key, value)
    else:
        # Default user attributes for testing
        context_builder.set("firstName", "Wedding")
        context_builder.set("lastName", "Couple")
        context_builder.set("email", "couple@example.com")
        context_builder.set("userType", "newlywed")
        context_builder.set("groups", ["premium", "wedding-users"])
    
    user_context = context_builder.build()
    
    # Custom variables for template substitution in AI Config messages
    custom_variables = {
        'gift_description': 'beautiful wedding gift',
        'gift_giver_name': 'dear friend',
        'relationship': 'close friend',
        'additional_notes': 'thank you for celebrating with us',
        'next_meeting': 'at Christmas dinner'
    }
    
    try:
        # Proper fallback config (as per LaunchDarkly docs)
        fallback_config = AIConfig(
            enabled=True,
            model=ModelConfig(
                name="gpt-4",
                parameters={"temperature": 0.8}
            ),
            messages=[LDMessage(role="system", content="You are a helpful assistant for writing thank you notes.")],
            provider=ProviderConfig(name="openai")
        )
        
        config, tracker = ai_client.config("thank-you-generator", user_context, fallback_config, custom_variables)
        
        return config, tracker
    except Exception as e:
        raise Exception(f"Failed to get AI config from LaunchDarkly: {e}")

def check_advanced_options_enabled(user_context) -> bool:
    """Check if advanced form options are enabled via feature flag - NO FALLBACKS"""
    if not ld_client:
        raise Exception("LaunchDarkly client not configured - cannot proceed without it")
    
    try:
        return ld_client.variation("enable-advanced-options", user_context, False)
    except Exception as e:
        raise Exception(f"Failed to check advanced options flag: {e}")

def generate_with_openai(messages: list, config: AIConfig) -> str:
    """Generate thank you note using OpenAI - NO MOCKS, REAL API ONLY"""
    try:
        # Require OpenAI client to be configured
        if not openai_client:
            raise Exception("OpenAI API client not configured - cannot proceed without it")
            
        openai_messages = []
        for msg in messages:
            openai_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        model_name = config.model.name if config.model else "gpt-4"
        model_params = getattr(config.model, 'parameters', {}) if config.model else {}
        
        # Build API call parameters, handling model-specific restrictions
        api_params = {
            "model": model_name,
            "messages": openai_messages,
            "max_completion_tokens": model_params.get("max_tokens", 300)
        }
        
        # Only add temperature if it's not the default (some models restrict this)
        temperature = model_params.get("temperature", 1.0)
        if temperature != 1.0:
            api_params["temperature"] = temperature
            
        # Only add top_p if it's not the default
        top_p = model_params.get("top_p", 1.0)
        if top_p != 1.0:
            api_params["top_p"] = top_p
        
        response = openai_client.chat.completions.create(**api_params)
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI generation failed: {str(e)}")

def generate_with_anthropic(messages: list, config: AIConfig) -> str:
    """Generate thank you note using Anthropic Claude - NO MOCKS, REAL API ONLY"""
    try:
        # Require Anthropic client to be configured
        if not anthropic_client:
            raise Exception("Anthropic API client not configured - cannot proceed without it")
            
        system_message = ""
        user_messages = []
        
        for msg in messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                user_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        model_name = config.model.name if config.model else "claude-3-sonnet-20240229"
        model_params = getattr(config.model, 'parameters', {}) if config.model else {}
        
        message = anthropic_client.messages.create(
            model=model_name,
            max_tokens=model_params.get("max_tokens", 300),
            temperature=model_params.get("temperature", 0.7),
            system=system_message,
            messages=user_messages
        )
        return message.content[0].text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic generation failed: {str(e)}")

def build_personalized_messages(request: ThankYouRequest, config: AIConfig) -> list:
    """Build personalized messages using LaunchDarkly AI Config template variables"""
    
    # Enhanced relationship and tone mapping
    relationship_context = {
        "family": "family member",
        "friend": "dear friend", 
        "colleague": "colleague",
        "family friend": "family friend"
    }
    
    # Create variables for LaunchDarkly template substitution
    # Build template variables, only including non-empty optional fields
    template_variables = {
        "gift_description": request.gift_description,
        "gift_giver_name": request.gift_giver_name,
        "relationship": relationship_context.get(request.relationship, request.relationship)
    }
    
    # Only add optional fields if they have values
    if request.additional_notes and request.additional_notes.strip():
        template_variables["additional_notes"] = request.additional_notes.strip()
    
    if request.next_meeting and request.next_meeting.strip():
        template_variables["next_meeting"] = request.next_meeting.strip()
    
    # Take the base messages from AI Config and substitute variables
    personalized_messages = []
    
    if config.messages:
        for msg in config.messages:
            # Substitute template variables in the message content
            content = msg.content
            for var_name, var_value in template_variables.items():
                content = content.replace(f"{{{var_name}}}", str(var_value))
            
            personalized_messages.append(LDMessage(role=msg.role, content=content))
    else:
        # Fallback if no messages in config
        personalized_messages = [
            LDMessage(role="system", content="You are a helpful assistant that writes personalized wedding thank you notes."),
            LDMessage(role="user", content=f"Write a heartfelt thank you note for {request.gift_description} from {request.gift_giver_name}.")
        ]
    
    return personalized_messages

@app.get("/")
async def root():
    return {"message": "Wedding Thank You Generator API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "ai_config_enabled": True}

@app.post("/generate", response_model=ThankYouResponse)
async def generate_thank_you(request: ThankYouRequest):
    """Generate a personalized thank you note using LaunchDarkly AI Config"""
    
    try:
        # Get AI configuration from LaunchDarkly with rich user context
        ai_config, tracker = get_ai_config_for_user("generate-user-" + str(hash(str(request.dict()))), {
            "requestType": "generation",
            "giftType": request.gift_description[:20] if request.gift_description else "unknown",
            "relationship": request.relationship,
            "hasAdditionalNotes": bool(request.additional_notes and request.additional_notes.strip()),
            "hasNextMeeting": bool(request.next_meeting and request.next_meeting.strip())
        })
        
        # Check if AI Config is enabled
        if not ai_config.enabled:
            raise HTTPException(status_code=503, detail="AI Config is currently disabled")
        
        # Build personalized messages
        messages = build_personalized_messages(request, ai_config)
        
        # Determine which AI provider to use
        provider = ai_config.provider.name if ai_config.provider else "openai"
        
        # Generate the thank you note
        if provider == "anthropic":
            thank_you_note = generate_with_anthropic(messages, ai_config)
            model_used = ai_config.model.name if ai_config.model else "claude-3-sonnet-20240229"
        else:
            thank_you_note = generate_with_openai(messages, ai_config)
            model_used = ai_config.model.name if ai_config.model else "gpt-4"
        
        # Track the generation event (optional but recommended for analytics)
        if tracker:
            tracker.track_success()
        
        # Get variation name from tracker._variation_key
        variation_name = 'fallback'
        if tracker and hasattr(tracker, '_variation_key'):
            variation_name = tracker._variation_key
        elif ai_config:
            variation_name = 'config-active'
        
        return ThankYouResponse(
            thank_you_note=thank_you_note,
            ai_model_used=f"{provider}:{model_used}",
            prompt_strategy=variation_name,  # Show the actual LaunchDarkly variation name
            generation_metadata={
                "provider": provider,
                "model_parameters": getattr(ai_config.model, 'parameters', {}) if ai_config.model else {},
                "ai_config_key": "thank-you-generator",
                "variation_name": variation_name,
                "config_enabled": ai_config.enabled
            }
        )
        
    except Exception as e:
        if tracker:
            tracker.track_error()
        print(f"Generation error details: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/ai-config/status")
async def get_ai_config_status():
    """Get current AI configuration status"""
    try:
        # Get AI config and feature flag status
        ai_config, tracker = get_ai_config_for_user("status-user", {
            "requestType": "status",
            "userType": "admin"
        })
        
        # For feature flag, we still need the context object
        user_context = Context.builder("status-user").set("requestType", "status").build()
        advanced_options_enabled = check_advanced_options_enabled(user_context)
        
        # Get variation name from tracker._variation_key
        variation_name = 'fallback'
        if tracker and hasattr(tracker, '_variation_key'):
            variation_name = tracker._variation_key
        elif ai_config:
            variation_name = 'config-active'
        
        return {
            "status": "active" if ai_config.enabled else "disabled",
            "current_provider": ai_config.provider.name if ai_config.provider else "unknown",
            "current_model": ai_config.model.name if ai_config.model else "unknown",
            "prompt_strategy": variation_name,  # Show actual variation name
            "ai_config_key": "thank-you-generator",
            "advanced_options_enabled": advanced_options_enabled,
            "config_enabled": ai_config.enabled,
            "variation_name": variation_name
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.get("/feature-flags/advanced-options")
async def get_advanced_options_status():
    """Get the status of the advanced options feature flag"""
    try:
        user_context = Context.builder("anonymous-user").build()
        enabled = check_advanced_options_enabled(user_context)
        
        return {
            "flag_key": "enable-advanced-options",
            "enabled": enabled,
            "description": "Controls whether advanced form options (tone, additional notes) are shown"
        }
    except Exception as e:
        return {
            "error": str(e),
            "enabled": False
        }

@app.post("/test-generate")
async def test_generate():
    """Test endpoint with sample data to verify AI Config is working"""
    
    try:
        # Get AI configuration from LaunchDarkly with test context
        ai_config, tracker = get_ai_config_for_user("test-generate-user", {
            "requestType": "test",
            "userType": "developer",
            "testMode": True
        })
        
        # Test building messages with realistic data
        from pydantic import BaseModel
        test_request = ThankYouRequest(
            gift_giver_name="Aunt Sarah",
            gift_description="beautiful crystal vase",
            relationship="family",
            additional_notes="She helped plan our wedding ceremony",
            next_meeting="at Christmas dinner"
        )
        
        messages = build_personalized_messages(test_request, ai_config)
        
        # Test OpenAI generation
        if openai_client:
            result = generate_with_openai(messages, ai_config)
            generation_result = result[:100] + "..." if len(result) > 100 else result
        else:
            generation_result = "OpenAI client not initialized - check API key"
        
        return {
            "status": "success",
            "ai_config_test": {
                "enabled": ai_config.enabled,
                "provider": ai_config.provider.name if ai_config.provider else "unknown",
                "model": ai_config.model.name if ai_config.model else "unknown",
                "model_params": getattr(ai_config.model, 'parameters', {}) if ai_config.model else {},
                "messages_count": len(ai_config.messages) if ai_config.messages else 0,
                "tracker_available": tracker is not None,
                "messages_built": len(messages),
                "generation_test": generation_result
            },
            "message": "AI Config loaded successfully!"
        }
        
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "AI Config test failed"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
