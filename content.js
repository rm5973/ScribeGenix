let isRecording = false;
let recordingSteps = [];
let stepCounter = 0;
let realtimePreviewEnabled = true;
let recordingMode = 'screenshot'; // 'screenshot' or 'video'
let mediaRecorder = null;
let recordedChunks = [];
let isVideoRecording = false;
let audioEnabled = false;
let manualStepMode = false;
let insertStepIndex = -1;
let inputFieldStates = new Map(); // Track input field interactions
let currentVideoStream = null;

// Enhanced element detection and description generation
class ActionDescriptor {
  static getSmartDescription(element, action) {
    const tagName = element.tagName.toLowerCase();
    const text = this.getElementText(element);
    const type = element.type || '';
    const placeholder = element.placeholder || '';
    const value = element.value || '';
    const ariaLabel = element.getAttribute('aria-label') || '';
    const title = element.title || '';
    
    // Priority: aria-label > title > text content > placeholder > tag-based description
    const identifier = ariaLabel || title || text || placeholder || this.getTagBasedDescription(element);
    
    switch (action) {
      case 'click':
        return this.getClickDescription(element, identifier, tagName, type);
      case 'input':
        return this.getInputDescription(element, identifier, value, placeholder);
      case 'scroll':
        return this.getScrollDescription();
      case 'keypress':
        return this.getKeypressDescription(element, identifier);
      default:
        return `Perform ${action} on ${identifier}`;
    }
  }

  static getElementText(element) {
    // Get the most relevant text content
    const directText = element.textContent?.trim() || '';
    const innerHTML = element.innerHTML?.trim() || '';
    
    // If element has only text content, return it
    if (directText && !innerHTML.includes('<')) {
      return directText.substring(0, 100);
    }
    
    // For elements with nested content, try to get the most relevant text
    const textNodes = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent?.trim())
      .filter(text => text && text.length > 0);
    
    if (textNodes.length > 0) {
      return textNodes[0].substring(0, 100);
    }
    
    return directText.substring(0, 100);
  }

  static getClickDescription(element, identifier, tagName, type) {
    switch (tagName) {
      case 'button':
        if (type === 'submit') {
          return `Submit form by clicking "${identifier}" button`;
        }
        return `Click "${identifier}" button`;
      
      case 'a':
        const href = element.href;
        if (href) {
          const domain = new URL(href).hostname;
          return `Navigate to ${domain} by clicking "${identifier}" link`;
        }
        return `Click "${identifier}" link`;
      
      case 'input':
        if (type === 'submit') {
          return `Submit form by clicking "${identifier}" button`;
        } else if (type === 'button') {
          return `Click "${identifier}" button`;
        } else if (type === 'checkbox') {
          return `${element.checked ? 'Check' : 'Uncheck'} "${identifier}" checkbox`;
        } else if (type === 'radio') {
          return `Select "${identifier}" radio option`;
        } else if (['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type)) {
          return `Click on "${identifier}" input field`;
        }
        return `Click on "${identifier}" input field`;
      
      case 'select':
        return `Open "${identifier}" dropdown menu`;
      
      case 'textarea':
        return `Click on "${identifier}" text area`;
      
      case 'div':
      case 'span':
        // Check if it's a clickable div/span (has click handlers or specific classes)
        if (element.onclick || element.classList.contains('btn') || element.classList.contains('button')) {
          return `Click "${identifier}" button`;
        }
        return `Click on "${identifier}" element`;
      
      case 'img':
        const alt = element.alt || '';
        return `Click on ${alt ? `"${alt}" image` : 'image'}`;
      
      case 'li':
        return `Select "${identifier}" from list`;
      
      default:
        return `Click on "${identifier}"`;
    }
  }

  static getInputDescription(element, identifier, value, placeholder) {
    const fieldName = identifier || placeholder || 'field';
    const inputType = element.type || 'text';
    
    switch (inputType) {
      case 'email':
        return `Enter email address in ${fieldName}`;
      case 'password':
        return `Enter password in ${fieldName}`;
      case 'search':
        return `Search in ${fieldName}`;
      case 'tel':
        return `Enter phone number in ${fieldName}`;
      case 'url':
        return `Enter URL in ${fieldName}`;
      case 'number':
        return `Enter number in ${fieldName}`;
      case 'date':
        return `Select date in ${fieldName}`;
      case 'textarea':
        return `Enter text in ${fieldName}`;
      default:
        return `Enter text in ${fieldName}`;
    }
  }

  static getScrollDescription() {
    const scrollPercentage = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    return `Scroll down to ${scrollPercentage}% of the page`;
  }

  static getKeypressDescription(element, identifier) {
    return `Press Enter key in ${identifier || 'current field'}`;
  }

  static getTagBasedDescription(element) {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    
    if (id) return `element with ID "${id}"`;
    if (className) return `${tagName} with class "${className.split(' ')[0]}"`;
    return tagName;
  }
}

// Real-time preview system
class RealtimePreview {
  static showActionPreview(element, action, description) {
    if (!realtimePreviewEnabled) return;
    
    // Create floating preview
    const preview = document.createElement('div');
    preview.className = 'realtime-action-preview';
    preview.innerHTML = `
      <div class="preview-header">
        <div class="preview-icon">📸</div>
        <div class="preview-text">
          <div class="preview-action">${action.toUpperCase()}</div>
          <div class="preview-description">${description}</div>
        </div>
      </div>
      <div class="preview-progress">
        <div class="progress-bar"></div>
      </div>
    `;
    
    document.body.appendChild(preview);
    
    // Position near the element
    if (element) {
      const rect = element.getBoundingClientRect();
      preview.style.top = Math.max(10, rect.top - 80) + 'px';
      preview.style.left = Math.min(window.innerWidth - 320, rect.left) + 'px';
    }
    
    // Auto-remove after animation
    setTimeout(() => {
      preview.remove();
    }, 3000);
  }

  static showScreenshotCapture() {
    const overlay = document.createElement('div');
    overlay.className = 'screenshot-capture-overlay';
    overlay.innerHTML = `
      <div class="capture-indicator">
        <div class="capture-flash"></div>
        <div class="capture-text">📷 Capturing Screenshot...</div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
    }, 1000);
  }

  static updateStepCounter(count) {
    const indicator = document.getElementById('recording-indicator');
    if (indicator) {
      const counter = indicator.querySelector('.recording-counter');
      if (counter) {
        counter.textContent = count;
        counter.classList.add('counter-update');
        setTimeout(() => {
          counter.classList.remove('counter-update');
        }, 300);
      }
    }
  }
}

// Video recording functionality
class VideoRecorder {
  static async startVideoRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: audioEnabled
      });

      currentVideoStream = stream;

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        
        // Convert blob to base64 for storage and transmission
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;
          
          // Send video data to side panel
          chrome.runtime.sendMessage({
            action: 'videoRecorded',
            videoData: base64Data,
            mimeType: blob.type,
            size: blob.size,
            timestamp: Date.now()
          });
          
          // Also save to storage
          chrome.storage.local.set({
            videoRecording: {
              data: base64Data,
              mimeType: blob.type,
              size: blob.size,
              timestamp: Date.now()
            }
          });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      isVideoRecording = true;

      // Stop all tracks when recording stops
      stream.getTracks().forEach(track => {
        track.onended = () => {
          isVideoRecording = false;
          currentVideoStream = null;
        };
      });

      return true;
    } catch (error) {
      console.error('Error starting video recording:', error);
      return false;
    }
  }

  static stopVideoRecording() {
    if (mediaRecorder && isVideoRecording) {
      mediaRecorder.stop();
      
      // Stop all tracks
      if (currentVideoStream) {
        currentVideoStream.getTracks().forEach(track => {
          track.stop();
        });
        currentVideoStream = null;
      }
      
      isVideoRecording = false;
    }
  }
}

// Manual step insertion functionality
class ManualStepManager {
  static showManualStepDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'manual-step-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay">
        <div class="dialog-content">
          <h3>Add Manual Step</h3>
          <textarea id="manualStepDescription" placeholder="Enter step description..."></textarea>
          <div class="dialog-actions">
            <button id="addManualStep" class="btn-primary">Add Step</button>
            <button id="cancelManualStep" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const textarea = dialog.querySelector('#manualStepDescription');
    const addBtn = dialog.querySelector('#addManualStep');
    const cancelBtn = dialog.querySelector('#cancelManualStep');
    
    textarea.focus();
    
    addBtn.addEventListener('click', () => {
      const description = textarea.value.trim();
      if (description) {
        this.addManualStep(description);
      }
      dialog.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });
    
    // Close on escape
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        dialog.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }
  
  static addManualStep(description) {
    const stepId = insertStepIndex >= 0 ? insertStepIndex + 1 : stepCounter + 1;
    
    const step = {
      id: stepId,
      action: 'manual',
      description: description,
      screenshot: null,
      timestamp: Date.now(),
      url: window.location.href,
      element: null,
      isManual: true
    };
    
    if (insertStepIndex >= 0) {
      // Insert at specific position
      recordingSteps.splice(insertStepIndex, 0, step);
      // Update IDs of subsequent steps
      for (let i = insertStepIndex + 1; i < recordingSteps.length; i++) {
        recordingSteps[i].id = i + 1;
      }
      insertStepIndex = -1;
    } else {
      // Add at the end
      recordingSteps.push(step);
      stepCounter++;
    }
    
    // Save to storage
    chrome.storage.local.set({ recordingSteps });
    
    // Send to side panel
    chrome.runtime.sendMessage({
      action: 'stepCompleted',
      step: step
    });
    
    manualStepMode = false;
  }
}

// Enhanced event handlers with improved input handling
let inputDebounceTimers = new Map();

function startRecording() {
  isRecording = true;
  stepCounter = 0;
  recordingSteps = [];
  inputFieldStates.clear();
  
  showRecordingIndicator();
  
  // Start video recording if in video mode
  if (recordingMode === 'video') {
    VideoRecorder.startVideoRecording().then(success => {
      if (!success) {
        console.error('Failed to start video recording');
        // Continue with screenshot mode as fallback
        recordingMode = 'screenshot';
      }
    });
  }
  
  // Enhanced event listeners
  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('scroll', handleScroll, true);
  document.addEventListener('keydown', handleKeydown, true);
  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('focus', handleFocus, true);
  
  // Send real-time status to side panel
  chrome.runtime.sendMessage({
    action: 'recordingStarted',
    timestamp: Date.now(),
    mode: recordingMode
  });
}

function stopRecording() {
  isRecording = false;
  
  hideRecordingIndicator();
  
  // Stop video recording if active
  if (recordingMode === 'video') {
    VideoRecorder.stopVideoRecording();
  }
  
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('scroll', handleScroll, true);
  document.removeEventListener('keydown', handleKeydown, true);
  document.removeEventListener('submit', handleSubmit, true);
  document.removeEventListener('focus', handleFocus, true);
  
  // Clear input timers and states
  inputDebounceTimers.clear();
  inputFieldStates.clear();
  
  // Send real-time status to side panel
  chrome.runtime.sendMessage({
    action: 'recordingStopped',
    timestamp: Date.now(),
    totalSteps: stepCounter
  });
}

function getElementKey(element) {
  return element.id || element.name || element.className || element.tagName + '_' + Array.from(element.parentNode.children).indexOf(element);
}

function handleClick(event) {
  if (manualStepMode) return;
  
  const element = event.target;
  const tagName = element.tagName.toLowerCase();
  const type = element.type || '';
  const elementKey = getElementKey(element);
  
  // For input fields and textareas, only capture one click per field
  if ((tagName === 'input' && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type)) || tagName === 'textarea') {
    // Check if we've already captured a click for this field
    if (inputFieldStates.has(elementKey) && inputFieldStates.get(elementKey).clicked) {
      return; // Skip this click
    }
    
    // Mark this field as clicked
    inputFieldStates.set(elementKey, { clicked: true, hasInput: false });
  }
  
  const description = ActionDescriptor.getSmartDescription(element, 'click');
  
  // Show real-time preview immediately
  RealtimePreview.showActionPreview(element, 'click', description);
  
  setTimeout(() => {
    captureStep('click', element, description);
  }, 100);
}

function handleFocus(event) {
  if (manualStepMode) return;
  
  const element = event.target;
  const tagName = element.tagName.toLowerCase();
  const type = element.type || '';
  const elementKey = getElementKey(element);
  
  // Only handle focus for input fields and textareas if not already clicked
  if ((tagName === 'input' && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type)) || tagName === 'textarea') {
    if (!inputFieldStates.has(elementKey) || !inputFieldStates.get(elementKey).clicked) {
      const description = ActionDescriptor.getSmartDescription(element, 'click');
      
      // Mark this field as clicked
      inputFieldStates.set(elementKey, { clicked: true, hasInput: false });
      
      // Show real-time preview
      RealtimePreview.showActionPreview(element, 'focus', description);
      
      setTimeout(() => {
        captureStep('click', element, description);
      }, 100);
    }
  }
}

function handleInput(event) {
  if (manualStepMode) return;
  
  const element = event.target;
  const elementKey = getElementKey(element);
  
  // Clear existing timer for this element
  if (inputDebounceTimers.has(elementKey)) {
    clearTimeout(inputDebounceTimers.get(elementKey));
  }
  
  // Set new timer
  const timer = setTimeout(() => {
    // Check if we should capture input for this field
    const fieldState = inputFieldStates.get(elementKey);
    if (!fieldState || fieldState.hasInput) {
      return; // Skip if already captured input for this field
    }
    
    // Mark that we've captured input for this field
    inputFieldStates.set(elementKey, { ...fieldState, hasInput: true });
    
    const description = ActionDescriptor.getSmartDescription(element, 'input');
    
    // Show real-time preview
    RealtimePreview.showActionPreview(element, 'input', description);
    
    captureStep('input', element, description);
    inputDebounceTimers.delete(elementKey);
  }, 2000); // 2 second debounce
  
  inputDebounceTimers.set(elementKey, timer);
}

function handleChange(event) {
  if (manualStepMode) return;
  
  const element = event.target;
  if (element.tagName.toLowerCase() === 'select') {
    const selectedOption = element.options[element.selectedIndex];
    const description = `Select "${selectedOption.text}" from ${element.name || 'dropdown'}`;
    
    RealtimePreview.showActionPreview(element, 'change', description);
    
    setTimeout(() => {
      captureStep('change', element, description);
    }, 100);
  }
}

function handleScroll(event) {
  if (manualStepMode) return;
  
  clearTimeout(handleScroll.timeout);
  handleScroll.timeout = setTimeout(() => {
    const description = ActionDescriptor.getSmartDescription(null, 'scroll');
    RealtimePreview.showActionPreview(null, 'scroll', description);
    captureStep('scroll', null, description);
  }, 1000);
}

function handleKeydown(event) {
  if (manualStepMode) return;
  
  if (event.key === 'Enter' && !event.shiftKey) {
    const element = event.target;
    const description = ActionDescriptor.getSmartDescription(element, 'keypress');
    
    RealtimePreview.showActionPreview(element, 'keypress', description);
    
    setTimeout(() => {
      captureStep('keypress', element, description);
    }, 100);
  }
}

function handleSubmit(event) {
  if (manualStepMode) return;
  
  const form = event.target;
  const formName = form.name || form.id || 'form';
  const description = `Submit ${formName}`;
  
  RealtimePreview.showActionPreview(form, 'submit', description);
  
  setTimeout(() => {
    captureStep('submit', form, description);
  }, 100);
}

// Enhanced element info capture
function getElementInfo(element) {
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  return {
    tagName: element.tagName,
    className: element.className,
    id: element.id,
    innerText: element.innerText?.substring(0, 200) || '',
    placeholder: element.placeholder || '',
    value: element.value || '',
    href: element.href || '',
    type: element.type || '',
    name: element.name || '',
    ariaLabel: element.getAttribute('aria-label') || '',
    title: element.title || '',
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    },
    styles: {
      backgroundColor: computedStyle.backgroundColor,
      color: computedStyle.color,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily
    }
  };
}

// Enhanced screenshot capture with real-time feedback
async function captureStep(action, element, description) {
  if (!isRecording) return;
  
  let actualStepId;
  if (insertStepIndex >= 0) {
    actualStepId = insertStepIndex + 1;
  } else {
    stepCounter++;
    actualStepId = stepCounter;
  }
  
  // Show screenshot capture indicator only for screenshot mode
  if (recordingMode === 'screenshot') {
    RealtimePreview.showScreenshotCapture();
  }
  
  // Update step counter in real-time
  RealtimePreview.updateStepCounter(actualStepId);
  
  // Highlight the element before capturing
  let highlightElement = null;
  if (element) {
    highlightElement = highlightElementTemporarily(element);
  }
  
  // Send real-time step preview to side panel
  chrome.runtime.sendMessage({
    action: 'stepPreview',
    step: {
      id: actualStepId,
      action,
      description,
      timestamp: Date.now(),
      url: window.location.href
    }
  });
  
  // Capture screenshot with slight delay to ensure highlighting is visible
  setTimeout(async () => {
    let screenshot = null;
    
    if (recordingMode === 'screenshot') {
      screenshot = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
          resolve(response?.screenshot || null);
        });
      });
    }
    
    // Remove highlight
    if (highlightElement) {
      highlightElement.remove();
    }
    
    const step = {
      id: actualStepId,
      action,
      description,
      screenshot,
      timestamp: Date.now(),
      url: window.location.href,
      element: element ? getElementInfo(element) : null
    };
    
    if (insertStepIndex >= 0) {
      // Insert at specific position
      recordingSteps.splice(insertStepIndex, 0, step);
      // Update IDs of subsequent steps
      for (let i = insertStepIndex + 1; i < recordingSteps.length; i++) {
        recordingSteps[i].id = i + 1;
      }
      insertStepIndex = -1;
    } else {
      recordingSteps.push(step);
    }
    
    // Save to storage
    chrome.storage.local.set({ recordingSteps });
    
    // Send completed step to side panel
    chrome.runtime.sendMessage({
      action: 'stepCompleted',
      step
    });
  }, 300);
}

// Enhanced element highlighting with animation
function highlightElementTemporarily(element) {
  const highlight = document.createElement('div');
  const rect = element.getBoundingClientRect();
  
  highlight.style.position = 'fixed';
  highlight.style.top = rect.top + 'px';
  highlight.style.left = rect.left + 'px';
  highlight.style.width = rect.width + 'px';
  highlight.style.height = rect.height + 'px';
  highlight.style.border = '3px solid #3b82f6';
  highlight.style.borderRadius = '6px';
  highlight.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  highlight.style.pointerEvents = 'none';
  highlight.style.zIndex = '10001';
  highlight.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)';
  highlight.style.animation = 'highlightPulse 0.6s ease-out';
  
  document.body.appendChild(highlight);
  
  return highlight;
}

// Enhanced recording indicator with mode display
function showRecordingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'recording-indicator';
  indicator.innerHTML = `
    <div class="recording-pulse"></div>
    <span>Recording ${recordingMode === 'video' ? 'Video' : 'Steps'}...</span>
    <div class="recording-counter">0</div>
    <div class="recording-status">Live</div>
    ${recordingMode === 'video' ? '<div class="video-indicator">🎥</div>' : ''}
  `;
  document.body.appendChild(indicator);
}

function hideRecordingIndicator() {
  const indicator = document.getElementById('recording-indicator');
  if (indicator) {
    indicator.classList.add('recording-complete');
    setTimeout(() => {
      indicator.remove();
    }, 1000);
  }
}

// Message handling with enhanced functionality
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
      recordingMode = request.mode || 'screenshot';
      audioEnabled = request.audioEnabled || false;
      startRecording();
      sendResponse({ success: true });
      break;
    case 'stopRecording':
      stopRecording();
      sendResponse({ success: true });
      break;
    case 'getSteps':
      sendResponse({ steps: recordingSteps });
      break;
    case 'clearSteps':
      recordingSteps = [];
      stepCounter = 0;
      inputFieldStates.clear();
      chrome.storage.local.set({ recordingSteps: [] });
      sendResponse({ success: true });
      break;
    case 'toggleRealtimePreview':
      realtimePreviewEnabled = request.enabled;
      sendResponse({ success: true });
      break;
    case 'addManualStep':
      ManualStepManager.showManualStepDialog();
      sendResponse({ success: true });
      break;
    case 'insertStepAt':
      insertStepIndex = request.index;
      manualStepMode = true;
      sendResponse({ success: true });
      break;
    case 'setRecordingMode':
      recordingMode = request.mode;
      audioEnabled = request.audioEnabled || false;
      sendResponse({ success: true });
      break;
  }
});

// Initialize
chrome.storage.local.get(['recordingSteps'], (result) => {
  if (result.recordingSteps) {
    recordingSteps = result.recordingSteps;
    stepCounter = recordingSteps.length;
  }
});