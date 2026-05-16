document.addEventListener('DOMContentLoaded', () => {
  const statusBox = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const loader = document.getElementById('loader');
  const resultContainer = document.getElementById('result-container');
  const resultLink = document.getElementById('result-link');
  const copyBtn = document.getElementById('copy-btn');

  let foundUrl = '';

  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      showError('Could not find active tab.');
      return;
    }

    const activeTab = tabs[0];

    // Capture the visible area of the tab
    chrome.tabs.captureVisibleTab(activeTab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        showError('Failed to capture screen: ' + chrome.runtime.lastError.message);
        return;
      }

      if (!dataUrl) {
        showError('Failed to capture screen.');
        return;
      }

      processImage(dataUrl);
    });
  });

  function processImage(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use jsQR to decode the QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          showSuccess(code.data);
        } else {
          showError('No QR code found on the screen.');
        }
      } catch (err) {
        showError('Error processing image.');
        console.error(err);
      }
    };
    
    img.onerror = () => {
      showError('Failed to load captured image.');
    };
    
    img.src = dataUrl;
  }

  function showSuccess(data) {
    foundUrl = data;
    
    statusBox.classList.remove('error');
    statusBox.classList.add('success');
    loader.style.display = 'none';
    statusText.innerText = 'QR Code successfully scanned!';
    statusText.style.color = 'var(--success)';
    
    resultContainer.classList.remove('hidden');
    resultLink.href = data;
    resultLink.innerText = data;
  }

  function showError(message) {
    statusBox.classList.remove('success');
    statusBox.classList.add('error');
    loader.style.display = 'none';
    statusText.innerText = message;
    statusText.style.color = '#ef4444';
  }

  copyBtn.addEventListener('click', () => {
    if (foundUrl) {
      navigator.clipboard.writeText(foundUrl).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      });
    }
  });
});
