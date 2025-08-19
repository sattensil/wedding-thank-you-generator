import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CpuChipIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline'
import { AIConfigStatus as AIConfigStatusType } from '../types'

const AIConfigStatus: React.FC = () => {
  const [status, setStatus] = useState<AIConfigStatusType | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai-config/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        status: 'error',
        error: 'Failed to fetch AI config status'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="wedding-card p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <ArrowPathIcon className="h-5 w-5 animate-spin text-wedding-500" />
          <span className="text-sage-600">Loading AI Config status...</span>
        </div>
      </motion.div>
    )
  }

  if (!status) return null

  const isError = status.status === 'error'

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="wedding-card p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isError ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
            <CpuChipIcon className="h-5 w-5 text-wedding-500" />
          </div>
          
          <div>
            <span className="font-medium text-sage-800">
              LaunchDarkly AI Config
            </span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              isError 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {isError ? 'Error' : 'Active'}
            </span>
          </div>
        </div>

        {!isError && status.current_provider && (
          <div className="flex items-center gap-4 text-sm text-sage-600">
            <div>
              <span className="font-medium">Provider:</span> {status.current_provider}
            </div>
            <div>
              <span className="font-medium">Model:</span> {status.current_model}
            </div>
            <div>
              <span className="font-medium">Strategy:</span> {status.prompt_strategy}
            </div>
          </div>
        )}
        
        <button
          onClick={fetchStatus}
          className="p-2 text-sage-500 hover:text-sage-700 transition-colors rounded-lg hover:bg-sage-50"
          title="Refresh status"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      {isError && status.error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{status.error}</p>
        </div>
      )}
    </motion.div>
  )
}

export default AIConfigStatus

