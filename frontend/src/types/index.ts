export interface ThankYouRequest {
  gift_giver_name: string
  gift_description: string
  relationship: string
  additional_notes?: string
  next_meeting?: string
}

export interface ThankYouResponse {
  thank_you_note: string
  ai_model_used: string
  prompt_strategy: string
  generation_metadata: {
    provider: string
    model_parameters: Record<string, any>
    prompt_template: string
    ai_config_key: string
  }
}

export interface AIConfigStatus {
  status: 'active' | 'error'
  current_provider?: string
  current_model?: string
  prompt_strategy?: string
  ai_config_key?: string
  advanced_options_enabled?: boolean
  error?: string
}

export interface AdvancedOptionsStatus {
  flag_key: string
  enabled: boolean
  description: string
  error?: string
}
