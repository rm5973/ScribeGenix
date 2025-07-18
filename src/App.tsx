import React, { useState, useEffect } from 'react';
import { Play, Square, Trash2, Download, Eye, Settings, FileText, Video, Image, Clock, Camera, Plus, Mic, MicOff } from 'lucide-react';

interface Step {
  id: number;
  action: string;
  description: string;
  screenshot: string;
  timestamp: number;
  url: string;
  element?: any;
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeTab, setActiveTab] = useState('steps');
  const [guideTitle, setGuideTitle] = useState('My Step Guide');
  const [guideDescription, setGuideDescription] = useState('');
  const [realtimeStep, setRealtimeStep] = useState<Step | null>(null);
  const [showRealtimePreview, setShowRealtimePreview] = useState(true);
  const [recordingMode, setRecordingMode] = useState<'screenshot' | 'video'>('screenshot');
  const [audioEnabled, setAudioEnabled] = useState(false);

  const tabs = [
    { id: 'steps', label: 'Steps', icon: FileText },
    { id: 'annotate', label: 'Annotate', icon: Image },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'export', label: 'Export', icon: Download }
  ];

  const startRecording = () => {
    setIsRecording(true);
    setSteps([]);
    setRealtimeStep(null);
    console.log('Starting recording...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRealtimeStep(null);
    console.log('Stopping recording...');
  };

  const clearSteps = () => {
    setSteps([]);
    setRealtimeStep(null);
    console.log('Clearing steps...');
  };

  const exportAsHtml = () => {
    const htmlContent = generateHtmlContent();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guideTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    console.log('Exporting as PDF...');
  };

  const exportAsVideo = () => {
    console.log('Exporting as video...');
  };

  const addManualStep = () => {
    const description = prompt('Enter step description:');
    if (description) {
      const newStep: Step = {
        id: steps.length + 1,
        action: 'manual',
        description,
        screenshot: '',
        timestamp: Date.now(),
        url: 'https://example.com',
        element: null
      };
      setSteps(prev => [...prev, newStep]);
    }
  };

  const insertStepAfter = (index: number) => {
    const description = prompt('Enter step description:');
    if (description) {
      const newStep: Step = {
        id: index + 2,
        action: 'manual',
        description,
        screenshot: '',
        timestamp: Date.now(),
        url: 'https://example.com',
        element: null
      };
      
      const newSteps = [...steps];
      newSteps.splice(index + 1, 0, newStep);
      
      // Update IDs for subsequent steps
      newSteps.forEach((step, i) => {
        step.id = i + 1;
      });
      
      setSteps(newSteps);
    }
  };

  const deleteStep = (index: number) => {
    if (confirm('Are you sure you want to delete this step?')) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Update IDs
      newSteps.forEach((step, i) => {
        step.id = i + 1;
      });
      setSteps(newSteps);
    }
  };

  const generateHtmlContent = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${guideTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .header { text-align: center; margin-bottom: 40px; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header h1 { color: #1e293b; margin-bottom: 10px; font-size: 2.5rem; }
    .header p { color: #64748b; font-size: 1.1rem; }
    .step { margin-bottom: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .step-header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 20px; }
    .step-number { background: rgba(255, 255, 255, 0.2); width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 15px; }
    .step-description { font-weight: 500; font-size: 1.1rem; }
    .step-screenshot { width: 100%; height: auto; display: block; }
    .step-meta { padding: 15px 20px; font-size: 0.9rem; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${guideTitle}</h1>
    ${guideDescription ? `<p>${guideDescription}</p>` : ''}
    <p><small>Generated on ${new Date().toLocaleDateString()}</small></p>
  </div>
  
  <div class="steps">
    ${steps.map(step => `
      <div class="step">
        <div class="step-header">
          <span class="step-number">${step.id}</span>
          <span class="step-description">${step.description}</span>
        </div>
        ${step.screenshot ? `<img src="${step.screenshot}" alt="Step ${step.id}" class="step-screenshot">` : ''}
        <div class="step-meta">
          Action: ${step.action} | Time: ${new Date(step.timestamp).toLocaleTimeString()}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  };

  // Simulate real-time step updates
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const mockStep: Step = {
        id: steps.length + 1,
        action: 'click',
        description: `Click on "${['Submit', 'Login', 'Search', 'Next', 'Save'][Math.floor(Math.random() * 5)]}" button`,
        screenshot: `https://images.pexels.com/photos/${[1181298, 1181244, 1181263, 1181316, 1181354][Math.floor(Math.random() * 5)]}/pexels-photo-${[1181298, 1181244, 1181263, 1181316, 1181354][Math.floor(Math.random() * 5)]}.jpeg?auto=compress&cs=tinysrgb&w=400&h=200`,
        timestamp: Date.now(),
        url: 'https://example.com'
      };

      // Show real-time preview
      setRealtimeStep(mockStep);

      // Add to steps after a brief delay
      setTimeout(() => {
        setSteps(prev => [...prev, mockStep]);
        setRealtimeStep(null);
      }, 1500);
    }, 3000);

    return () => clearInterval(interval);
  }, [isRecording, steps.length]);

  // Mock data for demonstration
  useEffect(() => {
    const mockSteps: Step[] = [
      {
        id: 1,
        action: 'click',
        description: 'Click on "Project 360" button',
        screenshot: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
        timestamp: Date.now() - 120000,
        url: 'https://example.com'
      },
      {
        id: 2,
        action: 'scroll',
        description: 'Scroll down to view more content',
        screenshot: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
        timestamp: Date.now() - 60000,
        url: 'https://example.com'
      }
    ];
    if (!isRecording) {
      setSteps(mockSteps);
    }
  }, [isRecording]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              {recordingMode === 'video' ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </div>
            <h1 className="text-lg font-semibold">Guide Recorder</h1>
          </div>
          <div className="flex items-center space-x-2">
            {isRecording && (
              <div className="flex items-center space-x-2 bg-red-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording {recordingMode === 'video' ? 'Video' : 'Steps'}</span>
              </div>
            )}
            {recordingMode === 'video' && audioEnabled && (
              <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded-full">
                <Mic className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Audio</span>
              </div>
            )}
            <button className="text-white/80 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Preview Banner */}
      {isRecording && showRealtimePreview && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Real-time Preview</span>
            </div>
            <button 
              onClick={() => setShowRealtimePreview(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Hide
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {recordingMode === 'video' ? <Video className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRecording ? `Recording ${recordingMode === 'video' ? 'Video' : 'Steps'}...` : `Start ${recordingMode === 'video' ? 'Video' : 'Step'} Recording`}</span>
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Square className="w-4 h-4" />
            <span>Stop Recording</span>
          </button>
          <button
            onClick={clearSteps}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={addManualStep}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            title="Add Manual Step"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'steps' && (
          <div className="p-4 space-y-4">
            {/* Real-time Step Preview */}
            {realtimeStep && isRecording && showRealtimePreview && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-300 overflow-hidden animate-pulse">
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold animate-bounce">
                      {realtimeStep.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Capturing now...</span>
                      </div>
                      <p className="text-gray-900 font-medium mt-1">{realtimeStep.description}</p>
                    </div>
                  </div>
                  {realtimeStep.screenshot && (
                    <div className="relative">
                      <img 
                        src={realtimeStep.screenshot} 
                        alt="Real-time capture"
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-blue-500/20 rounded-md flex items-center justify-center">
                        <div className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
                          Processing...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Existing Steps */}
            {steps.length === 0 && !realtimeStep ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No steps recorded yet</h3>
                <p className="text-gray-500">Click "Start Recording" to begin capturing user actions</p>
              </div>
            ) : (
              steps.map(step => (
                <div key={step.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-md">
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {step.id}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{step.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-md ${step.action === 'manual' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {step.action}
                          </span>
                          <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => insertStepAfter(steps.indexOf(step))}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Insert step after this"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteStep(steps.indexOf(step))}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {step.screenshot && (
                    <img 
                      src={step.screenshot} 
                      alt={`Step ${step.id}`}
                      className="w-full h-32 object-cover"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'annotate' && (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Annotation Tools</h3>
              <p className="text-gray-500">Add annotations and highlights to your recorded steps</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recording Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recording Mode</label>
                  <select 
                    value={recordingMode} 
                    onChange={(e) => setRecordingMode(e.target.value as 'screenshot' | 'video')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="screenshot">Screenshot Steps</option>
                    <option value="video">Video Recording</option>
                  </select>
                </div>
                {recordingMode === 'video' && (
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={audioEnabled} 
                      onChange={(e) => setAudioEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600" 
                    />
                    <span className="text-sm text-gray-700 flex items-center space-x-1">
                      {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      <span>Enable audio recording</span>
                    </span>
                  </label>
                )}
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={showRealtimePreview} onChange={(e) => setShowRealtimePreview(e.target.checked)} className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Show real-time preview</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Capture scroll events</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Capture key presses</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Auto-generate descriptions</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Highlight elements during capture</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guide Title</label>
                  <input
                    type="text"
                    value={guideTitle}
                    onChange={(e) => setGuideTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter guide title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={guideDescription}
                    onChange={(e) => setGuideDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Brief description of this guide"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={exportAsHtml}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export as HTML</span>
                </button>
                <button
                  onClick={exportAsPdf}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={exportAsVideo}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  disabled={recordingMode !== 'video'}
                >
                  <Video className="w-4 h-4" />
                  <span>Export as Video (MP4)</span>
                </button>
                {recordingMode !== 'video' && (
                  <p className="text-sm text-gray-500 text-center">Video export requires video recording mode</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {steps.length} steps recorded
            {isRecording && <span className="ml-2 text-green-600 font-medium">• Live</span>}
            {recordingMode === 'video' && <span className="ml-2 text-purple-600 font-medium">• Video Mode</span>}
          </span>
          <div className="flex space-x-2">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Save & Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;