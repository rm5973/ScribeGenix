class EnhancedGuideRecorder {
  constructor() {
    this.isRecording = false;
    this.steps = [];
    this.currentTab = 'steps';
    
    this.initElements();
    this.bindEvents();
    this.loadSteps();
    this.updateUI();
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
    this.exportVideo = document.getElementById('exportVideo');
    this.guideTitle = document.getElementById('guideTitle');
    this.guideDescription = document.getElementById('guideDescription');
    this.tabs = document.querySelectorAll('.tab');
    this.tabPanes = document.querySelectorAll('.tab-pane');
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.startRecording());
    this.stopBtn.addEventListener('click', () => this.stopRecording());
    this.clearBtn.addEventListener('click', () => this.clearSteps());
    this.previewBtn.addEventListener('click', () => this.preview());
    this.saveExportBtn.addEventListener('click', () => this.quickExport());
    this.exportHtml.addEventListener('click', () => this.exportAsHtml());
    this.exportPdf.addEventListener('click', () => this.exportAsPdf());
    this.exportVideo.addEventListener('click', () => this.exportAsVideo());

    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Auto-save title and description
    this.guideTitle.addEventListener('input', () => this.saveSettings());
    this.guideDescription.addEventListener('input', () => this.saveSettings());

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'stepAdded') {
        this.steps.push(request.step);
        this.updateUI();
        this.saveSteps();
      }
    });
  }

async startRecording() {
  this.isRecording = true;
  this.startBtn.disabled = true;
  this.stopBtn.disabled = false;
  this.startBtn.innerHTML = '<span>⏺</span> Recording...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'startRecording' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Content script not found, injecting manually:', chrome.runtime.lastError.message);

        // Inject content.js manually
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });

        // Try again after injecting
        chrome.tabs.sendMessage(tab.id, { action: 'startRecording' }, (response2) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to communicate with content script even after injection:', chrome.runtime.lastError.message);
            alert("Unable to start recording. Please refresh the page and try again.");
          } else {
            console.log('✅ Content script responded after injection:', response2);
          }
        });
      } else {
        console.log('✅ Content script responded:', response);
      }
    });

  } catch (err) {
    console.error('Error accessing active tab:', err);
  }

  this.updateUI();
}


  async stopRecording() {
    this.isRecording = false;
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.startBtn.innerHTML = '<span>●</span> Start Recording';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' });
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
    
    this.updateUI();
  }

  async clearSteps() {
    if (this.steps.length > 0) {
      const confirmed = confirm('Are you sure you want to clear all recorded steps?');
      if (!confirmed) return;
    }
    
    this.steps = [];
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'clearSteps' });
    } catch (error) {
      console.error('Error clearing steps:', error);
    }
    
    this.updateUI();
    this.saveSteps();
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
    
    if (this.steps.length === 0) {
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
        </div>
        ${step.screenshot ? `<img src="${step.screenshot}" alt="Step ${step.id}" class="step-screenshot">` : ''}
        <div class="step-meta">
          <span>Action: ${step.action}</span>
          <span>${new Date(step.timestamp).toLocaleTimeString()}</span>
        </div>
      `;
      
      // Add click handler for step editing
      stepElement.addEventListener('click', () => this.editStep(step));
      
      this.stepsList.appendChild(stepElement);
    });
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
            <span class="step-action">${step.action}</span>
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
      doc.text(`Action: ${step.action}`, 20, yPosition);
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
    
    // Future implementation for video export
    alert('Video export feature is coming soon! For now, you can use HTML or PDF export to create beautiful step guides.');
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
    `;
    message.textContent = `${format} export completed successfully!`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }
}

// Initialize the enhanced recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new EnhancedGuideRecorder();
});