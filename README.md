# Wedding Thank You Note Generator

A smart thank you note generator for wedding gifts that uses AI to create authentic, personalized notes. Built with LaunchDarkly AI Config for intelligent model management and feature flag control.

## Features

- **AI-Powered Personalization**: Generate heartfelt thank you notes based on:
  - Gift received and gift giver's name
  - Relationship to the couple (family, friend, colleague)
  - Additional context notes (e.g., "helped plan our wedding")
  - When you'll see them next (e.g., "at Christmas dinner")
  - Tone controlled by LaunchDarkly AI Config variations

- **LaunchDarkly AI Config**: Complete AI model management with:
  - Multiple variations (e.g., "warm-personal", "formal-professional")
  - Dynamic prompt templates with variable substitution
  - Real-time model and parameter switching
  - A/B testing of different AI strategies
  - Template variables: `{gift_description}`, `{gift_giver_name}`, `{relationship}`, `{additional_notes}`, `{next_meeting}`

- **Feature Flag Control**: `enable-advanced-options` flag toggles advanced form fields
- **Beautiful UI**: Modern, responsive interface with conditional field rendering  
- **Real-time Status**: Live AI configuration monitoring with variation name display
- **No Fallbacks**: Production-ready implementation requiring proper LaunchDarkly setup

## Tech Stack

- **Backend**: Python FastAPI with LaunchDarkly AI Config
- **Frontend**: React with Vite, TypeScript, Tailwind CSS, Framer Motion
- **AI Models**: OpenAI GPT-4, Anthropic Claude (via AI Config)
- **Feature Management**: LaunchDarkly AI Config + Feature Flags
- **UI Components**: Headless UI, Heroicons
- **Deployment**: Ready for Vercel/Railway

## Setup

### Backend
```bash
cd backend
source ../venv/bin/activate
pip install -r ../requirements.txt
cp .env.example .env
# Add your API keys to .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
LAUNCHDARKLY_SDK_KEY=your_launchdarkly_sdk_key_here

# Application Configuration
ENVIRONMENT=development
BACKEND_HOST=localhost
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

## LaunchDarkly AI Config Setup

This project uses LaunchDarkly's AI Config feature for intelligent model management:

### 1. AI Config Key: `thank-you-generator`

The application looks for an AI Config with the key `thank-you-generator` that controls:
- **Model Selection**: Choose between OpenAI GPT-4 and Anthropic Claude
- **Prompt Templates**: Customize the system prompts and user prompt templates
- **Model Parameters**: Fine-tune temperature, max_tokens, top_p, etc.
- **Provider Settings**: Switch between AI providers seamlessly

### 2. Default Configuration Structure

```json
{
  "model": {
    "name": "gpt-4",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 300,
      "top_p": 1.0
    }
  },
  "prompt": {
    "system": "You are a helpful assistant that writes personalized wedding thank you notes.",
    "template": "Write a heartfelt thank you note for {gift_description} from {gift_giver_name}.",
    "strategy": "default"
  },
  "provider": "openai"
}
```

### 3. Feature Flag Setup

Create a boolean feature flag in LaunchDarkly:

- **Flag Key**: `enable-advanced-options`
- **Name**: "Enable Advanced Options"  
- **Description**: "Controls whether advanced form options (additional notes, next meeting) are shown"
- **Type**: Boolean
- **Variations**: 
  - `show-advanced` → `true`
  - `hide-advanced` → `false`

This flag controls whether users see the "Additional Notes" and "When will you see them next?" fields in the form.

## API Endpoints

- **POST** `/generate` - Generate thank you note
- **GET** `/ai-config/status` - Get current AI Config status and variation name
- **GET** `/feature-flags/advanced-options` - Check advanced options flag status
- **POST** `/test-generate` - Test endpoint for development

## Project Structure

```
wedding-thank-you-generator/
├── backend/
│   ├── main.py              # FastAPI application with LaunchDarkly integration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── types/           # TypeScript interfaces
│   │   └── main.tsx         # Application entry point
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite configuration
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Key Implementation Details

### LaunchDarkly Integration
- **No Fallbacks**: Application requires proper LaunchDarkly setup
- **Rich User Context**: Uses user attributes for targeting rules
- **Template Variables**: AI Config prompts support variable substitution
- **Variation Tracking**: Displays active variation name in UI

### Template Variables Available
- `{gift_description}` - What gift was received
- `{gift_giver_name}` - Who gave the gift  
- `{relationship}` - Relationship to the couple
- `{additional_notes}` - Optional context (if provided)
- `{next_meeting}` - When you'll see them next (if provided)
