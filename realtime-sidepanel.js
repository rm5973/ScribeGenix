class RealtimeGuideRecorder {
  constructor() {
    this.isRecording = false;
    this.steps = [];
    this.currentTab = 'steps';
    this.realtimeStep = null;
    this.showRealtimePreview = true;
    this.recordingMode = 'screenshot'; // 'screenshot' or 'video'
    this.audioEnabled = false;
    this.videoBlob = null;
    
    this.initElements();
    this.bindEvents();
    this.loadSteps();
    this.updateUI();
    this.setupRealtimeListeners();
  }

  initElements() {
    this.startBtn = document.getElementById('startBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.stepsList = document.getElementById('stepsList');
    this.emptyState = document.getElementById('emptyState');
    this.stepCount = document.getElementById('stepCount');
    this.previewBtn = document.getElementById('previewBtn');
    this.saveExportBtn = document.getElementById('saveExportBtn');
    this.exportHtml = document.getElementById('exportHtml');
    this.exportPdf = document.getElementById('exportPdf');
    this.exportMarkdown = document.getElementById('exportMarkdown');
    this.exportVideo = document.getElementById('exportVideo');
    this.guideTitle = document.getElementById('guideTitle');
    this.guideDescription = document.getElementById('guideDescription');
    this.tabs = document.querySelectorAll('.tab');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.recordingModeSelect = document.getElementById('recordingMode');
    this.audioEnabledCheckbox = document.getElementById('audioEnabled');
    this.addManualStepBtn = document.getElementById('addManualStep');
    
    // Real-time elements
    this.realtimeContainer = this.createRealtimeContainer();
  }

  createRealtimeContainer() {
    const container = document.createElement('div');
    container.id = 'realtime-container';
    container.className = 'realtime-container hidden';
    container.innerHTML = `
      <div class="realtime-header">
        <div class="realtime-indicator">
          <div class="pulse-dot"></div>
          <span>Live Preview</span>
        </div>
        <button class="realtime-toggle" onclick="recorder.toggleRealtimePreview()">Hide</button>
      </div>
      <div class="realtime-step" id="realtimeStep"></div>
    `;
    
    const stepsTab = document.getElementById('steps-tab');
    stepsTab.insertBefore(container, stepsTab.firstChild);
    
    return container;
  }

  setupRealtimeListeners() {
    // Listen for real-time messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'recordingStarted':
          this.handleRecordingStarted(request.mode);
          break;
        case 'recordingStopped':
          this.handleRecordingStopped(request.totalSteps);
          break;
        case 'stepPreview':
          this.handleStepPreview(request.step);
          break;
        case 'stepCompleted':
          this.handleStepCompleted(request.step);
          break;
        case 'videoRecorded':
          this.handleVideoRecorded(request.videoUrl, request.blob);
          break;
      }
    });
  }

  handleRecordingStarted(mode) {
    this.isRecording = true;
    this.recordingMode = mode || 'screenshot';
    this.steps = [];
    this.realtimeStep = null;
    this.showRealtimeContainer();
    this.updateRecordingUI();
  }

  handleRecordingStopped(totalSteps) {
    this.isRecording = false;
    this.realtimeStep = null;
    this.hideRealtimeContainer();
    this.updateRecordingUI();
    this.showCompletionMessage(totalSteps);
  }

  handleStepPreview(step) {
    this.realtimeStep = step;
    this.showRealtimeStep(step);
  }

  handleStepCompleted(step) {
    // Find if step already exists (for insertions)
    const existingIndex = this.steps.findIndex(s => s.id === step.id);
    if (existingIndex >= 0) {
      this.steps[existingIndex] = step;
    } else {
      this.steps.push(step);
    }
    
    // Sort steps by ID
    this.steps.sort((a, b) => a.id - b.id);
    
    this.realtimeStep = null;
    this.hideRealtimeStep();
    this.updateUI();
    this.saveSteps();
    this.showStepCompletedAnimation(step);
  }

  handleVideoRecorded(videoUrl, blob) {
    this.videoBlob = blob;
    console.log('Video recorded:', videoUrl);
  }

  showRealtimeContainer() {
    if (this.showRealtimePreview) {
      this.realtimeContainer.classList.remove('hidden');
    }
  }

  hideRealtimeContainer() {
    this.realtimeContainer.classList.add('hidden');
  }

  showRealtimeStep(step) {
    if (!this.showRealtimePreview) return;
    
    const realtimeStepEl = document.getElementById('realtimeStep');
    realtimeStepEl.innerHTML = `
      <div class="realtime-step-content">
        <div class="step-preview-header">
          <div class="step-preview-number">${step.id}</div>
          <div class="step-preview-info">
            <div class="step-preview-action">${step.action.toUpperCase()}</div>
            <div class="step-preview-description">${step.description}</div>
          </div>
          <div class="step-preview-status">
            <div class="processing-spinner"></div>
            <span>Processing...</span>
          </div>
        </div>
        <div class="step-preview-placeholder">
          <div class="screenshot-placeholder">
            <div class="placeholder-icon">📸</div>
            <div class="placeholder-text">${this.recordingMode === 'video' ? 'Recording video...' : 'Capturing screenshot...'}</div>
          </div>
        </div>
      </div>
    `;
    
    realtimeStepEl.classList.add('active');
  }

  hideRealtimeStep() {
    const realtimeStepEl = document.getElementById('realtimeStep');
    realtimeStepEl.classList.remove('active');
    
    setTimeout(() => {
      realtimeStepEl.innerHTML = '';
    }, 300);
  }

  showStepCompletedAnimation(step) {
    // Create a temporary completion indicator
    const completion = document.createElement('div');
    completion.className = 'step-completion-indicator';
    completion.innerHTML = `
      <div class="completion-icon">✅</div>
      <div class="completion-text">Step ${step.id} captured!</div>
    `;
    
    document.body.appendChild(completion);
    
    setTimeout(() => {
      completion.remove();
    }, 2000);
  }

  showCompletionMessage(totalSteps) {
    const message = document.createElement('div');
    message.className = 'recording-completion-message';
    message.innerHTML = `
      <div class="completion-header">
        <div class="completion-icon">🎉</div>
        <h3>Recording Complete!</h3>
      </div>
      <p>Successfully captured ${totalSteps} steps${this.recordingMode === 'video' ? ' with video' : ''}</p>
      <button onclick="this.parentElement.remove()" class="completion-close">Close</button>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentElement) {
        message.remove();
      }
    }, 5000);
  }

  toggleRealtimePreview() {
    this.showRealtimePreview = !this.showRealtimePreview;
    
    if (this.showRealtimePreview) {
      this.showRealtimeContainer();
    } else {
      this.hideRealtimeContainer();
    }
    
    // Update content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleRealtimePreview',
        enabled: this.showRealtimePreview
      });
    });
    
    // Update toggle button text
    const toggleBtn = document.querySelector('.realtime-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = this.showRealtimePreview ? 'Hide' : 'Show';
    }
  }

  updateRecordingUI() {
    if (this.isRecording) {
      this.startBtn.disabled = true;
      this.stopBtn.disabled = false;
      this.startBtn.innerHTML = `<span>⏺</span> Recording ${this.recordingMode === 'video' ? 'Video' : 'Steps'}...`;
      this.startBtn.classList.add('recording-active');
    } else {
      this.startBtn.disabled = false;
      this.stopBtn.disabled = true;
      this.startBtn.innerHTML = '<span>●</span> Start Recording';
      this.startBtn.classList.remove('recording-active');
    }
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.startRecording());
    this.stopBtn.addEventListener('click', () => this.stopRecording());
    this.clearBtn.addEventListener('click', () => this.clearSteps());
    this.previewBtn.addEventListener('click', () => this.preview());
    this.saveExportBtn.addEventListener('click', () => this.quickExport());
    this.exportHtml.addEventListener('click', () => this.exportAsHtml());
    this.exportPdf.addEventListener('click', () => this.exportAsPdf());
    this.exportMarkdown.addEventListener('click', () => this.exportAsMarkdown());
    this.exportVideo.addEventListener('click', () => this.exportAsVideo());
    this.addManualStepBtn.addEventListener('click', () => this.addManualStep());

    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Auto-save title and description
    this.guideTitle.addEventListener('input', () => this.saveSettings());
    this.guideDescription.addEventListener('input', () => this.saveSettings());
    
    // Recording mode change
    if (this.recordingModeSelect) {
      this.recordingModeSelect.addEventListener('change', () => {
        this.recordingMode = this.recordingModeSelect.value;
        this.updateRecordingModeUI();
      });
    }
    
    if (this.audioEnabledCheckbox) {
      this.audioEnabledCheckbox.addEventListener('change', () => {
        this.audioEnabled = this.audioEnabledCheckbox.checked;
      });
    }
  }

  updateRecordingModeUI() {
    const audioOption = document.getElementById('audioOption');
    if (audioOption) {
      audioOption.style.display = this.recordingMode === 'video' ? 'block' : 'none';
    }
  }

  async startRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { 
        action: 'startRecording',
        mode: this.recordingMode,
        audioEnabled: this.audioEnabled
      });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  async stopRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' });
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }

  async clearSteps() {
    if (this.steps.length > 0) {
      const confirmed = confirm('Are you sure you want to clear all recorded steps?');
      if (!confirmed) return;
    }
    
    this.steps = [];
    this.realtimeStep = null;
    this.videoBlob = null;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'clearSteps' });
    } catch (error) {
      console.error('Error clearing steps:', error);
    }
    
    this.updateUI();
    this.saveSteps();
  }

  async addManualStep() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'addManualStep' });
    } catch (error) {
      console.error('Error adding manual step:', error);
    }
  }

  async insertStepAt(index) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { 
        action: 'insertStepAt',
        index: index
      });
    } catch (error) {
      console.error('Error inserting step:', error);
    }
  }

  async loadSteps() {
    try {
      const result = await chrome.storage.local.get(['recordingSteps', 'guideSettings']);
      this.steps = result.recordingSteps || [];
      
      if (result.guideSettings) {
        this.guideTitle.value = result.guideSettings.title || 'My Step Guide';
        this.guideDescription.value = result.guideSettings.description || '';
      }
      
      this.updateUI();
    } catch (error) {
      console.error('Error loading steps:', error);
    }
  }

  async saveSteps() {
    try {
      await chrome.storage.local.set({ recordingSteps: this.steps });
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        guideSettings: {
          title: this.guideTitle.value,
          description: this.guideDescription.value
        }
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  updateUI() {
    this.stepCount.textContent = this.steps.length;
    
    if (this.steps.length === 0 && !this.realtimeStep) {
      this.stepsList.classList.add('hidden');
      this.emptyState.classList.remove('hidden');
    } else {
      this.stepsList.classList.remove('hidden');
      this.emptyState.classList.add('hidden');
      this.renderSteps();
    }
  }

  renderSteps() {
    this.stepsList.innerHTML = '';
    
    this.steps.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.className = 'step-item';
      stepElement.innerHTML = `
        <div class="step-header">
          <div class="step-number">${step.id}</div>
          <div class="step-description">${step.description}</div>
          <div class="step-actions">
            <button class="step-action-btn" onclick="recorder.insertStepAt(${index})" title="Insert step after this">➕</button>
            <button class="step-action-btn" onclick="recorder.deleteStep(${index})" title="Delete step">🗑️</button>
            <div class="step-timestamp">${new Date(step.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
        ${step.screenshot ? `<img src="${step.screenshot}" alt="Step ${step.id}" class="step-screenshot">` : ''}
        <div class="step-meta">
          <span class="step-action-badge ${step.isManual ? 'manual' : ''}">${step.action}</span>
          <span class="step-url">${new URL(step.url).hostname}</span>
        </div>
      `;
      
      // Add click handler for step editing
      stepElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('step-action-btn')) {
          this.editStep(step);
        }
      });
      
      // Add entrance animation
      stepElement.style.animation = `stepSlideIn 0.3s ease-out ${index * 0.1}s both`;
      
      this.stepsList.appendChild(stepElement);
    });
  }

  deleteStep(index) {
    if (confirm('Are you sure you want to delete this step?')) {
      this.steps.splice(index, 1);
      // Update step IDs
      this.steps.forEach((step, i) => {
        step.id = i + 1;
      });
      this.updateUI();
      this.saveSteps();
    }
  }

  editStep(step) {
    // Future implementation for step editing
    console.log('Editing step:', step);
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
  }

  preview() {
    if (this.steps.length === 0) {
      alert('No steps to preview. Start recording first.');
      return;
    }
    
    const previewWindow = window.open('', '_blank', 'width=900,height=700');
    const htmlContent = this.generateHtmlContent();
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  }

  quickExport() {
    if (this.steps.length === 0) {
      alert('No steps to export. Start recording first.');
      return;
    }
    
    // Default to HTML export
    this.exportAsHtml();
  }

  generateHtmlContent() {
    const title = this.guideTitle.value || 'Step Guide';
    const description = this.guideDescription.value || '';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      background: #f8fafc;
      color: #1e293b;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      background: white; 
      padding: 40px 30px; 
      border-radius: 16px; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    
    .header h1 { 
      color: #1e293b; 
      margin-bottom: 15px; 
      font-size: 2.5rem;
      font-weight: 700;
    }
    
    .header p { 
      color: #64748b; 
      font-size: 1.1rem;
      margin-bottom: 10px;
    }
    
    .header .meta {
      color: #94a3b8;
      font-size: 0.9rem;
    }
    
    .step { 
      margin-bottom: 30px; 
      background: white; 
      border-radius: 16px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s;
    }
    
    .step:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .step-header { 
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
      color: white; 
      padding: 24px; 
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .step-number { 
      background: rgba(255, 255, 255, 0.2); 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    
    .step-description { 
      font-weight: 500; 
      font-size: 1.1rem; 
      line-height: 1.4;
    }
    
    .step-screenshot { 
      width: 100%; 
      height: auto; 
      display: block;
      max-height: 400px;
      object-fit: cover;
    }
    
    .step-meta { 
      padding: 16px 24px; 
      font-size: 0.9rem; 
      color: #64748b; 
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .step-action {
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #475569;
    }
    
    .step-action.manual {
      background: #fef3c7;
      color: #92400e;
    }
    
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .container { padding: 10px; }
      .header { padding: 20px; }
      .header h1 { font-size: 2rem; }
      .step-header { padding: 16px; }
      .step-meta { padding: 12px 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      ${description ? `<p>${description}</p>` : ''}
      <div class="meta">
        Generated on ${new Date().toLocaleDateString()} • ${this.steps.length} steps
      </div>
    </div>
    
    <div class="steps">
      ${this.steps.map(step => `
        <div class="step">
          <div class="step-header">
            <div class="step-number">${step.id}</div>
            <div class="step-description">${step.description}</div>
          </div>
          ${step.screenshot ? `<img src="${step.screenshot}" alt="Step ${step.id}" class="step-screenshot">` : ''}
          <div class="step-meta">
            <span class="step-action ${step.isManual ? 'manual' : ''}">${step.action}</span>
            <span>${new Date(step.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>This guide was generated using Guide Recorder</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  generateMarkdownContent() {
    const title = this.guideTitle.value || 'Step Guide';
    const description = this.guideDescription.value || '';
    
    let markdown = `# ${title}\n\n`;
    
    if (description) {
      markdown += `${description}\n\n`;
    }
    
    markdown += `*Generated on ${new Date().toLocaleDateString()} • ${this.steps.length} steps*\n\n`;
    markdown += `---\n\n`;
    
    this.steps.forEach(step => {
      markdown += `## Step ${step.id}: ${step.description}\n\n`;
      
      if (step.screenshot) {
        markdown += `![Step ${step.id}](${step.screenshot})\n\n`;
      }
      
      markdown += `**Action:** ${step.action}${step.isManual ? ' (Manual)' : ''}\n`;
      markdown += `**Time:** ${new Date(step.timestamp).toLocaleTimeString()}\n\n`;
      markdown += `---\n\n`;
    });
    
    return markdown;
  }

  exportAsHtml() {
    if (this.steps.length === 0) {
      alert('No steps to export. Start recording first.');
      return;
    }
    
    const htmlContent = this.generateHtmlContent();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.guideTitle.value.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    // Show success message
    this.showExportSuccess('HTML');
  }

  exportAsMarkdown() {
    if (this.steps.length === 0) {
      alert('No steps to export. Start recording first.');
      return;
    }
    
    const markdownContent = this.generateMarkdownContent();
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.guideTitle.value.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    // Show success message
    this.showExportSuccess('Markdown');
  }

  async exportAsPdf() {
    if (this.steps.length === 0) {
      alert('No steps to export. Start recording first.');
      return;
    }
    
    if (typeof window.jsPDF === 'undefined') {
      alert('PDF library not loaded. Please try again.');
      return;
    }
    
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    const title = this.guideTitle.value || 'Step Guide';
    const description = this.guideDescription.value || '';
    
    // Add title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (doc.internal.pageSize.width - titleWidth) / 2, 30);
    
    // Add description
    if (description) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(description, 170);
      doc.text(lines, 20, 45);
    }
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 65);
    
    let yPosition = 80;
    const pageHeight = doc.internal.pageSize.height;
    
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Step number and description
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      
      const stepText = `${step.id}. ${step.description}`;
      const lines = doc.splitTextToSize(stepText, 170);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 7;
      
      // Step details
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Action: ${step.action}${step.isManual ? ' (Manual)' : ''}`, 20, yPosition);
      doc.text(`Time: ${new Date(step.timestamp).toLocaleTimeString()}`, 120, yPosition);
      yPosition += 15;
      
      // Add screenshot if available
      if (step.screenshot) {
        try {
          const imgWidth = 170;
          const imgHeight = 100;
          
          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 30;
          }
          
          doc.addImage(step.screenshot, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
      
      yPosition += 10;
    }
    
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    this.showExportSuccess('PDF');
  }

  exportAsVideo() {
    if (this.steps.length === 0) {
      alert('No steps to export. Start recording first.');
      return;
    }
    
    if (this.recordingMode !== 'video') {
      alert('Video export is only available when recording in video mode. Please record in video mode first.');
      return;
    }
    
    if (!this.videoBlob || !(this.videoBlob instanceof Blob)) {
      alert('No video recording available. Please record a video first.');
      return;
    }

    const url = URL.createObjectURL(this.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.guideTitle.value.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recording.webm`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showExportSuccess('Video');
  }

  showExportSuccess(format) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      animation: successSlideIn 0.3s ease-out;
      max-width: 300px;
    `;
    message.textContent = `${format} export completed successfully!`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.animation = 'successSlideOut 0.3s ease-out forwards';
      setTimeout(() => message.remove(), 300);
    }, 4000);
  }
}

// Add CSS for enhanced features
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
  .setting-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    margin-top: 4px;
    transition: border-color 0.2s;
  }

  .setting-select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .manual-step-btn {
    background: #f59e0b !important;
    color: white !important;
    border: none !important;
    margin-bottom: 16px;
  }

  .manual-step-btn:hover {
    background: #d97706 !important;
  }

  .btn-export.markdown {
    background: #059669;
  }

  .btn-export.markdown:hover {
    background: #047857;
  }

  .step-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .step-action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  }

  .step-action-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .step-timestamp {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
  }

  .step-action-badge.manual {
    background: #fef3c7;
    color: #92400e;
  }

  .realtime-container {
    background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
    border: 2px dashed #3b82f6;
    border-radius: 12px;
    margin-bottom: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .realtime-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(59, 130, 246, 0.1);
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  }

  .realtime-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  .realtime-toggle {
    background: none;
    border: 1px solid #3b82f6;
    color: #3b82f6;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .realtime-toggle:hover {
    background: #3b82f6;
    color: white;
  }

  .realtime-step {
    padding: 16px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }

  .realtime-step.active {
    opacity: 1;
    transform: translateY(0);
  }

  .step-preview-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .step-preview-number {
    background: #3b82f6;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
    animation: numberPulse 1s ease-out;
  }

  @keyframes numberPulse {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .step-preview-info {
    flex: 1;
  }

  .step-preview-action {
    font-size: 11px;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .step-preview-description {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    line-height: 1.4;
  }

  .step-preview-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
  }

  .processing-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .screenshot-placeholder {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    color: #64748b;
  }

  .placeholder-icon {
    font-size: 24px;
    margin-bottom: 8px;
    animation: iconFloat 2s ease-in-out infinite;
  }

  @keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .placeholder-text {
    font-size: 14px;
    font-weight: 500;
  }

  .step-completion-indicator {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #22c55e;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 10001;
    animation: completionPop 0.5s ease-out;
  }

  @keyframes completionPop {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }

  .completion-icon {
    font-size: 32px;
    text-align: center;
    margin-bottom: 8px;
  }

  .completion-text {
    font-size: 14px;
    font-weight: 600;
    color: #22c55e;
    text-align: center;
  }

  .recording-completion-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    z-index: 10002;
    text-align: center;
    min-width: 300px;
    animation: messageSlideIn 0.4s ease-out;
  }

  @keyframes messageSlideIn {
    0% { transform: translate(-50%, -60%) scale(0.9); opacity: 0; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }

  .completion-header {
    margin-bottom: 16px;
  }

  .completion-header .completion-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .completion-header h3 {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
  }

  .completion-close {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 16px;
    transition: background 0.2s;
  }

  .completion-close:hover {
    background: #2563eb;
  }

  .recording-active {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
    animation: recordingPulse 2s infinite;
  }

  @keyframes recordingPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  }

  @keyframes stepSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes successSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes successSlideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  .step-item {
    transition: all 0.3s ease;
  }

  .step-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .step-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    position: relative;
  }

  .hidden {
    display: none !important;
  }
`;

document.head.appendChild(enhancedStyles);

// Initialize the enhanced recorder when the page loads
let recorder;
document.addEventListener('DOMContentLoaded', () => {
  recorder = new RealtimeGuideRecorder();
});