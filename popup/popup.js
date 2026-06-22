document.addEventListener('DOMContentLoaded', () => {
  const statusBox = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const loader = document.getElementById('loader');
  const resultContainer = document.getElementById('result-container');
  const resultLabel = document.getElementById('result-label');
  const resultList = document.getElementById('result-list');
  const copyBtn = document.getElementById('copy-btn');

  const maxQrCodes = 20;
  let foundResults = [];

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
        
        const codes = readAllQRCodes(imageData);

        if (codes.length > 0) {
          showSuccess(codes);
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

  function readAllQRCodes(imageData) {
    const workingData = new Uint8ClampedArray(imageData.data);
    const results = [];

    for (let index = 0; index < maxQrCodes; index++) {
      const code = jsQR(workingData, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (!code) {
        break;
      }

      results.push(code.data);
      maskCodeArea(workingData, imageData.width, imageData.height, code.location);
    }

    return results;
  }

  function maskCodeArea(data, width, height, location) {
    const points = [
      location.topLeftCorner,
      location.topRightCorner,
      location.bottomRightCorner,
      location.bottomLeftCorner,
    ];

    const padding = Math.max(8, Math.round(getCodeSize(points) * 0.08));
    const minX = clamp(Math.floor(Math.min(...points.map((point) => point.x)) - padding), 0, width - 1);
    const maxX = clamp(Math.ceil(Math.max(...points.map((point) => point.x)) + padding), 0, width - 1);
    const minY = clamp(Math.floor(Math.min(...points.map((point) => point.y)) - padding), 0, height - 1);
    const maxY = clamp(Math.ceil(Math.max(...points.map((point) => point.y)) + padding), 0, height - 1);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = 255;
        data[pixelIndex + 1] = 255;
        data[pixelIndex + 2] = 255;
        data[pixelIndex + 3] = 255;
      }
    }
  }

  function getCodeSize(points) {
    const widths = [
      getDistance(points[0], points[1]),
      getDistance(points[3], points[2]),
    ];
    const heights = [
      getDistance(points[0], points[3]),
      getDistance(points[1], points[2]),
    ];

    return Math.max(...widths, ...heights);
  }

  function getDistance(firstPoint, secondPoint) {
    return Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function showSuccess(results) {
    foundResults = results;
    
    statusBox.classList.remove('error');
    statusBox.classList.add('success');
    loader.style.display = 'none';
    statusText.innerText = results.length === 1
      ? '1 QR code successfully scanned!'
      : `${results.length} QR codes successfully scanned!`;
    statusText.style.color = 'var(--success)';
    
    resultContainer.classList.remove('hidden');
    resultLabel.innerText = results.length === 1 ? 'Result Found' : 'Results Found';
    resultList.replaceChildren(...results.map((result, index) => createResultItem(result, index)));
  }

  function createResultItem(result, index) {
    const item = document.createElement('div');
    item.className = 'result-content';

    const indexLabel = document.createElement('span');
    indexLabel.className = 'result-index';
    indexLabel.innerText = `${index + 1}.`;

    const resultValue = document.createElement(isValidUrl(result) ? 'a' : 'span');
    resultValue.innerText = result;

    if (resultValue.tagName === 'A') {
      resultValue.href = result;
      resultValue.target = '_blank';
      resultValue.rel = 'noopener noreferrer';
    }

    item.append(indexLabel, resultValue);

    return item;
  }

  function showError(message) {
    statusBox.classList.remove('success');
    statusBox.classList.add('error');
    loader.style.display = 'none';
    statusText.innerText = message;
    statusText.style.color = '#ef4444';
  }

  copyBtn.addEventListener('click', () => {
    if (foundResults.length > 0) {
      navigator.clipboard.writeText(foundResults.join('\n')).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      });
    }
  });

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
      return false;
    }
  }
});
