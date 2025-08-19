import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ThankYouForm from './components/ThankYouForm'
import ThankYouDisplay from './components/ThankYouDisplay'
import AIConfigStatus from './components/AIConfigStatus'
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { ThankYouResponse } from './types'

function App() {
  const [generatedNote, setGeneratedNote] = useState<ThankYouResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate thank you note')
      }
      
      const result: ThankYouResponse = await response.json()
      setGeneratedNote(result)
    } catch (error) {
      console.error('Error generating thank you note:', error)
      // toast.error would be handled in the form component
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setGeneratedNote(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <HeartIcon className="h-8 w-8 text-wedding-500" />
            <h1 className="text-4xl font-serif font-semibold text-sage-800">
              Wedding Thank You Generator
            </h1>
            <SparklesIcon className="h-8 w-8 text-wedding-500" />
          </div>
          <p className="text-sage-600 text-lg max-w-2xl mx-auto">
            Create beautiful, personalized thank you notes for your wedding gifts using AI. 
            Powered by LaunchDarkly AI Config for intelligent model selection and optimization.
          </p>
        </motion.div>

        {/* AI Config Status */}
        <AIConfigStatus />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ThankYouForm 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onReset={handleReset}
              hasGeneratedNote={!!generatedNote}
            />
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {generatedNote ? (
                <ThankYouDisplay 
                  key="result"
                  thankYouData={generatedNote}
                  onReset={handleReset}
                />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="wedding-card p-8 h-96 flex items-center justify-center"
                >
                  <div className="text-center text-sage-500">
                    <SparklesIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Your personalized thank you note will appear here</p>
                    <p className="text-sm mt-2">Fill out the form to get started</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-sage-500 text-sm"
        >
          <p>Powered by LaunchDarkly AI Config • OpenAI GPT-4 • Anthropic Claude</p>
        </motion.footer>
      </div>
    </div>
  )
}

export default App

