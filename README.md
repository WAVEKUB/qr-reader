# QR Code Reader

A Chrome/Chromium extension that scans the visible area of the current tab for QR codes and displays the decoded results in the extension popup.

## Features

- Scans the currently visible page area.
- Detects up to 20 QR codes in one scan.
- Shows decoded URLs as clickable links.
- Copies all decoded results to the clipboard.
- Runs locally with a bundled `jsQR` decoder.

## Project Structure

```text
.
├── manifest.json
├── lib/
│   └── jsQR.js
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.js
```

## Install for Development

1. Open Chrome or another Chromium-based browser.
2. Go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select this project folder.
6. Pin or open the `QR Code Reader` extension.

## Usage

1. Open a page that has one or more visible QR codes.
2. Click the extension icon.
3. Wait for the scan to finish.
4. Copy the decoded results or open any decoded URL.

The extension scans only the visible viewport captured by the browser. QR codes below the fold, hidden behind overlays, or inside restricted browser pages may not be available to the extension.

## Package

A packaged extension archive is available at:

```text
dist/qr-code-reader-1.0.zip
```

To rebuild the package from the repository root:

```sh
mkdir -p dist
python3 -m zipfile -c dist/qr-code-reader-1.0.zip manifest.json popup lib
```

The package contains only the files required to load the extension:

- `manifest.json`
- `popup/`
- `lib/`

## Permissions

The extension requests the `activeTab` permission so it can capture and scan the visible area of the current tab when the popup is opened.

## Third-Party Code

This project includes `jsQR` 1.4.0 in `lib/jsQR.js` for QR code decoding.
