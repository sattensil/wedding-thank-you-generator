import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { ThankYouRequest, AdvancedOptionsStatus } from '../types'

interface ThankYouFormProps {
  onGenerate: (data: ThankYouRequest) => Promise<void>
  isGenerating: boolean
  onReset: () => void
  hasGeneratedNote: boolean
}

const ThankYouForm: React.FC<ThankYouFormProps> = ({ 
  onGenerate, 
  isGenerating, 
  onReset, 
  hasGeneratedNote 
}) => {
  const [formData, setFormData] = useState<ThankYouRequest>({
    gift_giver_name: '',
    gift_description: '',
    relationship: 'friend',
    additional_notes: '',
    next_meeting: ''
  })

  const [advancedOptionsEnabled, setAdvancedOptionsEnabled] = useState(false)
  const [loadingAdvancedOptions, setLoadingAdvancedOptions] = useState(true)

  // Check if advanced options are enabled
  useEffect(() => {
    const checkAdvancedOptions = async () => {
      try {
        const response = await fetch('/api/feature-flags/advanced-options')
        const data: AdvancedOptionsStatus = await response.json()
        setAdvancedOptionsEnabled(data.enabled)
      } catch (error) {
        console.error('Failed to check advanced options flag:', error)
        setAdvancedOptionsEnabled(false)
      } finally {
        setLoadingAdvancedOptions(false)
      }
    }

    checkAdvancedOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.gift_giver_name.trim() || !formData.gift_description.trim()) {
      toast.error('Please fill in the gift giver name and gift description')
      return
    }

    try {
      await onGenerate(formData)
      toast.success('Thank you note generated successfully!')
    } catch (error) {
      toast.error('Failed to generate thank you note. Please try again.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData({
      gift_giver_name: '',
      gift_description: '',
      relationship: 'friend',
      additional_notes: '',
      next_meeting: ''
    })
    onReset()
    toast.success('Form reset')
  }

  return (
    <div className="wedding-card p-6">
      <h2 className="text-2xl font-serif font-semibold text-sage-800 mb-6">
        Gift Details
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gift Giver Name */}
        <div>
          <label htmlFor="gift_giver_name" className="block text-sm font-medium text-sage-700 mb-2">
            Gift Giver's Name *
          </label>
          <input
            type="text"
            id="gift_giver_name"
            name="gift_giver_name"
            value={formData.gift_giver_name}
            onChange={handleInputChange}
            className="wedding-input"
            placeholder="e.g., Aunt Sarah, John and Mary Smith"
            required
          />
        </div>

        {/* Gift Description */}
        <div>
          <label htmlFor="gift_description" className="block text-sm font-medium text-sage-700 mb-2">
            Gift Description *
          </label>
          <input
            type="text"
            id="gift_description"
            name="gift_description"
            value={formData.gift_description}
            onChange={handleInputChange}
            className="wedding-input"
            placeholder="e.g., beautiful crystal vase, kitchen knife set, $100 gift card"
            required
          />
        </div>

        {/* Relationship */}
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-sage-700 mb-2">
            Relationship
          </label>
          <select
            id="relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleInputChange}
            className="wedding-input"
          >
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="colleague">Colleague</option>
            <option value="family friend">Family Friend</option>
          </select>
        </div>

        {/* Advanced Options - Conditionally Rendered */}
        {advancedOptionsEnabled && (
          <>
            {/* Next Meeting */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="next_meeting" className="block text-sm font-medium text-sage-700 mb-2">
                When will you see them next?
              </label>
              <input
                type="text"
                id="next_meeting"
                name="next_meeting"
                value={formData.next_meeting || ''}
                onChange={handleInputChange}
                placeholder="e.g., 'at Christmas dinner', 'next summer', 'soon'"
                className="wedding-input"
              />
            </motion.div>

            {/* Additional Notes */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <label htmlFor="additional_notes" className="block text-sm font-medium text-sage-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="additional_notes"
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows={3}
                className="wedding-input resize-none"
                placeholder="Any special memories, how you'll use the gift, etc."
              />
            </motion.div>
          </>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            type="submit"
            disabled={isGenerating}
            className="wedding-button flex-1 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGenerating ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                Generate Thank You Note
              </>
            )}
          </motion.button>

          {hasGeneratedNote && (
            <motion.button
              type="button"
              onClick={handleReset}
              className="wedding-button-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reset
            </motion.button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ThankYouForm
