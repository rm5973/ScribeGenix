let isRecording = false;
let recordingSteps = [];
let stepCounter = 0;
let realtimePreviewEnabled = true;

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
        }
        return `Click on "${identifier}" input field`;
      
      case 'select':
        return `Open "${identifier}" dropdown menu`;
      
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
        return `Enter email address "${value}" in ${fieldName}`;
      case 'password':
        return `Enter password in ${fieldName}`;
      case 'search':
        return `Search for "${value}" in ${fieldName}`;
      case 'tel':
        return `Enter phone number "${value}" in ${fieldName}`;
      case 'url':
        return `Enter URL "${value}" in ${fieldName}`;
      case 'number':
        return `Enter number "${value}" in ${fieldName}`;
      case 'date':
        return `Select date "${value}" in ${fieldName}`;
      case 'textarea':
        return `Enter text in ${fieldName}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
      default:
        return `Enter "${value}" in ${fieldName}`;
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
      
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
    }, 1000);
  }

//<div class="capture-indicator">
        //<div class="capture-flash"></div>
        
      //</div>
  // <div class="capture-text"> 📷 Capturing Screenshot...</div>

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

// Enhanced event handlers with real-time feedback
function startRecording() {
  isRecording = true;
  stepCounter = 0;
  recordingSteps = [];
  
  showRecordingIndicator();
  
  // Enhanced event listeners with real-time preview
  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('scroll', handleScroll, true);
  document.addEventListener('keydown', handleKeydown, true);
  document.addEventListener('focus', handleFocus, true);
  document.addEventListener('submit', handleSubmit, true);
  
  // Send real-time status to side panel
  chrome.runtime.sendMessage({
    action: 'recordingStarted',
    timestamp: Date.now()
  });
}

function stopRecording() {
  isRecording = false;
  
  hideRecordingIndicator();
  
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('scroll', handleScroll, true);
  document.removeEventListener('keydown', handleKeydown, true);
  document.removeEventListener('focus', handleFocus, true);
  document.removeEventListener('submit', handleSubmit, true);
  
  // Send real-time status to side panel
  chrome.runtime.sendMessage({
    action: 'recordingStopped',
    timestamp: Date.now(),
    totalSteps: stepCounter
  });
}

function handleClick(event) {
  const element = event.target;
  const description = ActionDescriptor.getSmartDescription(element, 'click');
  
  // Show real-time preview immediately
  RealtimePreview.showActionPreview(element, 'click', description);
  
  setTimeout(() => {
    captureStep('click', element, description);
  }, 100);
}

function handleInput(event) {
  const element = event.target;
  const description = ActionDescriptor.getSmartDescription(element, 'input');
  
  // Show real-time preview
  RealtimePreview.showActionPreview(element, 'input', description);
  
  // Debounce input events to avoid too many steps
  clearTimeout(handleInput.timeout);
  handleInput.timeout = setTimeout(() => {
    captureStep('input', element, description);
  }, 1000);
}

function handleChange(event) {
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
  clearTimeout(handleScroll.timeout);
  handleScroll.timeout = setTimeout(() => {
    const description = ActionDescriptor.getSmartDescription(null, 'scroll');
    RealtimePreview.showActionPreview(null, 'scroll', description);
    captureStep('scroll', null, description);
  }, 1000);
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    const element = event.target;
    const description = ActionDescriptor.getSmartDescription(element, 'keypress');
    
    RealtimePreview.showActionPreview(element, 'keypress', description);
    
    setTimeout(() => {
      captureStep('keypress', element, description);
    }, 100);
  }
}

function handleFocus(event) {
  const element = event.target;
  if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
    const fieldName = element.placeholder || element.name || 'field';
    const description = `Focus on ${fieldName} input field`;
    
    RealtimePreview.showActionPreview(element, 'focus', description);
    
    setTimeout(() => {
      captureStep('focus', element, description);
    }, 100);
  }
}

function handleSubmit(event) {
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
  
  stepCounter++;
  
  // Show screenshot capture indicator
  RealtimePreview.showScreenshotCapture();
  
  // Update step counter in real-time
  RealtimePreview.updateStepCounter(stepCounter);
  
  // Highlight the element before capturing
  let highlightElement = null;
  if (element) {
    highlightElement = highlightElementTemporarily(element);
  }
  
  // Send real-time step preview to side panel
  chrome.runtime.sendMessage({
    action: 'stepPreview',
    step: {
      id: stepCounter,
      action,
      description,
      timestamp: Date.now(),
      url: window.location.href
    }
  });
  
  // Capture screenshot with slight delay to ensure highlighting is visible
  setTimeout(async () => {
    const screenshot = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
        resolve(response?.screenshot || null);
      });
    });
    
    // Remove highlight
    if (highlightElement) {
      highlightElement.remove();
    }
    
    const step = {
      id: stepCounter,
      action,
      description,
      screenshot,
      timestamp: Date.now(),
      url: window.location.href,
      element: element ? getElementInfo(element) : null
    };
    
    recordingSteps.push(step);
    
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

// Enhanced recording indicator with real-time updates
function showRecordingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'recording-indicator';
  indicator.innerHTML = `
    <div class="recording-pulse"></div>
    <span>Recording Guide...</span>
    <div class="recording-counter">0</div>
    <div class="recording-status">Live</div>
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

// Message handling with real-time support
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
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
      chrome.storage.local.set({ recordingSteps: [] });
      sendResponse({ success: true });
      break;
    case 'toggleRealtimePreview':
      realtimePreviewEnabled = request.enabled;
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