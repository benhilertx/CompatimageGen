# Email Client Image Issues and Compatibility

## Apple Mail (52-58% market share)
- **Issues**: 
  - Supports inline SVG and most CSS, but complex animations or filters may fail.
  - Large base64 data URIs can slow rendering.
- **What Works**:
  - Inline SVG for crisp vectors.
  - PNG/JPEG via `<img>` or base64 data URI.
  - Inline CSS for styling.

## Gmail (27-31% market share)
- **Issues**:
  - No SVG support (web/mobile).
  - Strips `<head>` CSS and some inline styles (e.g., `position`).
  - Base64 data URIs increase HTML size, risking clipping in forwarded emails.
- **What Works**:
  - PNG/JPEG via `<img>` or base64 data URI.
  - Limited inline CSS (e.g., `width`, `height`, `margin`).

## Outlook Desktop/App (4-7% market share)
- **Issues**:
  - No SVG support.
  - Limited CSS support (e.g., no `border-radius`, `flexbox`).
  - Requires VML for vector graphics.
  - Base64 data URIs supported but bloat HTML.
- **What Works**:
  - VML via conditional comments (`<!--[if mso]>`).
  - PNG/JPEG via `<img>` or base64.
  - Basic inline CSS (e.g., `width`, `height`).

## Yahoo Mail (2-3% market share)
- **Issues**:
  - Partial SVG support (inconsistent across versions).
  - Limited CSS support, strips some properties.
- **What Works**:
  - PNG/JPEG via `<img>` or base64 data URI.
  - Inline SVG (fallback to PNG recommended).
  - Basic inline CSS.

## Google Android (1-2% market share)
- **Issues**:
  - No SVG support (similar to Gmail).
  - Strips some CSS properties.
  - Base64 data URIs may slow rendering.
- **What Works**:
  - PNG/JPEG via `<img>` or base64.
  - Limited inline CSS.

## Outlook.com (0.5-1% market share)
- **Issues**:
  - Partial SVG support (inconsistent).
  - Prefers VML for reliability.
  - Limited CSS support, similar to Outlook desktop.
- **What Works**:
  - VML via conditional comments.
  - PNG/JPEG via `<img>` or base64.
  - Inline SVG with PNG fallback.

## Thunderbird (0.2-0.5% market share)
- **Issues**:
  - Full SVG support but inconsistent CSS rendering.
  - Large base64 data URIs may cause delays.
- **What Works**:
  - Inline SVG.
  - PNG/JPEG via `<img>` or base64.
  - Most inline CSS.

## Samsung Mail (<1% market share)
- **Issues**:
  - No SVG support.
  - Limited CSS support, similar to Gmail.
- **What Works**:
  - PNG/JPEG via `<img>` or base64.
  - Basic inline CSS.

## QQ Mail (<1% market share)
- **Issues**:
  - No SVG support.
  - Strips some CSS properties.
  - Base64 data URIs may be blocked in some regions.
- **What Works**:
  - PNG/JPEG via `<img>` or base64.
  - Limited inline CSS.

## Others (Windows Mail, AOL, etc.) (<1% each)
- **Issues**:
  - Varying SVG/CSS support (AOL: no SVG; Windows Mail: partial SVG).
  - Inconsistent base64 handling.
- **What Works**:
  - PNG/JPEG via `<img>` or base64 (universal fallback).
  - Basic inline CSS.

## CompatimageGen Coverage
- Uses layered fallbacks (SVG, PNG, VML) to ensure compatibility across all listed clients.
- Inline data URIs and downloadable PNGs avoid hosting issues.
- Covers 95%+ of email client market share with robust, tested outputs.