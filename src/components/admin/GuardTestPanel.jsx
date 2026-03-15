import React, { useState } from 'react';
import { Shield, Send, CheckCircle, XCircle, AlertCircle, Code, Terminal } from 'lucide-react';

const GuardTestPanel = () => {
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testPythonGuard = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/chat/test-guard?message=${encodeURIComponent(testMessage || 'Hello, this is a test message')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        guardAvailable: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!testResult) return <Shield className="text-gray-400" size={20} />;
    if (testResult.guardAvailable) return <CheckCircle className="text-green-500" size={20} />;
    return <XCircle className="text-red-500" size={20} />;
  };

  const getStatusText = () => {
    if (!testResult) return 'Not tested';
    if (testResult.guardAvailable) return 'Python Guard Available';
    return 'Python Guard Unavailable';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Python Guard Service Test
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Test your Python guard service running on <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">localhost:8000</code>
          </p>
        </div>

        <div className="p-6">
          {/* Status Indicator */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {getStatusIcon()}
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {getStatusText()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {testResult ? 'Last tested: ' + new Date().toLocaleTimeString() : 'Click "Test Guard" to check connection'}
              </div>
            </div>
          </div>

          {/* Test Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Message
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a message to test your Python guard..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && testPythonGuard()}
              />
              <button
                onClick={testPythonGuard}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Send size={16} />
                )}
                <span>Test Guard</span>
              </button>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <Terminal size={20} />
                <span>Test Results</span>
              </h3>

              {/* Status */}
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                  ) : (
                    <XCircle className="text-red-600 dark:text-red-400" size={20} />
                  )}
                  <span className={`font-medium ${
                    testResult.success 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>
                
                {testResult.error && (
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {testResult.error}
                  </div>
                )}
              </div>

              {/* Response Details */}
              {testResult.success && testResult.response && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                    <Code size={16} />
                    <span>Guard Response</span>
                  </h4>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border">
                    {JSON.stringify(testResult.response, null, 2)}
                  </pre>
                </div>
              )}

              {/* Integration Guide */}
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="text-blue-600 dark:text-blue-400 mt-0.5" size={16} />
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Expected Python Guard API Format:
                    </div>
                    <div className="text-blue-700 dark:text-blue-300 space-y-2">
                      <div><strong>Endpoint:</strong> <code>POST http://localhost:8000/chat</code></div>
                      <div><strong>Request Body:</strong></div>
                      <pre className="text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded mt-1">
{`{
  "message": "user message text",
  "userId": "user_id",
  "context": "thriftit_support"
}`}
                      </pre>
                      <div><strong>Expected Response:</strong></div>
                      <pre className="text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded mt-1">
{`{
  "response": "bot response text",
  "suggestions": ["suggestion1", "suggestion2"],
  "switchToHuman": false
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardTestPanel;