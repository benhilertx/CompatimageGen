# Technical Approach: Universal Email Logo Code Block

## Objective
Create a single HTML code block that reliably displays a logo across email clients (Gmail, Outlook, Apple Mail, etc.) using layered fallbacks (SVG, PNG, VML) to handle client-specific rendering constraints without external hosting.

## Email Client Constraints
- **Gmail (Web/Mobile)**: No SVG support, strips head CSS, accepts inline data URIs (base64 PNG).
- **Outlook (Desktop)**: No SVG, supports VML via conditional comments (`<!--[if mso]>`), limited CSS.
- **Outlook.com**: Partial SVG support, prefers VML/PNG for consistency.
- **Apple Mail**: Full SVG support (inline or img).
- **Others (Yahoo, AOL)**: Vary, default to PNG.

## Technical Approach
LogoSync processes inputs (SVG/image/CSS) to generate one cohesive HTML block with cascading fallbacks, ensuring each client renders the best-supported format.

### Processing Steps
1. **Input Validation**:
   - Accept SVG, PNG/JPEG, or CSS logos.
   - Validate file size (<1MB) and format (e.g., parse SVG for complexity).
2. **Optimization & Conversion**:
   - **SVG**: Use SVGO to minify, Sharp to rasterize to PNG for fallback.
   - **Image**: Compress PNG/JPEG (Sharp), encode as base64 data URI.
   - **CSS**: Flatten to inline styles or convert to SVG (if vector-like, e.g., gradient circle). For complex CSS, rasterize to PNG.
   - **VML**: Map SVG shapes to VML (e.g., `<circle>` to `<v:oval>`) for Outlook. Flag complex SVGs for simplification.
3. **Code Block Generation**:
   - Layer fallbacks in one HTML snippet:
     - **VML** (Outlook) via `<!--[if mso]>` conditional comments.
     - **Inline SVG** for vector-supporting clients (Apple Mail).
     - **Base64 PNG** in `<foreignObject>` or `<img>` as universal fallback.
   - Ensure responsiveness (e.g., `max-width:100%; height:auto;`).
4. **Output**:
   - HTML snippet file (inline data URIs for SVG/PNG).
   - Fallback PNG file.
   - Markdown instructions (e.g., “Paste HTML into Mailchimp; attach PNG for Outlook”).

### Sample Code Block
For a red circle logo (SVG input):
```html
<!--[if mso]>
<v:oval xmlns:v="urn:schemas-microsoft-com:vml" style="width:150px;height:150px;" fillcolor="#ff0000" stroked="f" alt="Your Logo">
</v:oval>
<![endif]-->
<!--[if !mso]><!-->
<div style="mso-hide:all;">
  <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Your Logo">
    <title>Your Logo</title>
    <switch>
      <circle cx="75" cy="75" r="75" fill="#ff0000" />
      <foreignObject width="150" height="150">
        <img src="data:image/png;base64,iVBORw0KGgo..." alt="Your Logo" style="width:100%; height:auto;" />
      </foreignObject>
    </switch>
  </svg>
</div>
<!--<![endif]-->
```

### How It Works
- **Outlook Desktop**: Renders VML circle (red, 150x150px).
- **Apple Mail**: Uses inline SVG for crisp vector.
- **Gmail/Others**: Falls to base64 PNG in `<foreignObject>` or `<img>`.
- **CSS Input**: Inline styles in `<foreignObject>` (e.g., `<div style="background:#ff0000; border-radius:50%;">`) or rasterize to PNG if unsupported.

### Edge Cases & Mitigations
- **Complex SVGs**: Warn users if SVG has animations/gradients (unsupported in VML); offer PNG fallback.
- **Size**: Base64 bloats HTML (~33%), but logos are small (<10KB). Cap input size to manage.
- **Testing**: Recommend Litmus/Email on Acid for validation; simulate via local email clients.
- **CSS Logos**: Limited support in Outlook (flatten to inline or rasterize).

### Kiro’s Role
- **Development Aid**: Use Kiro to generate parser code (e.g., SVG-to-VML mapping), UI components (React drag-and-drop), and hooks for workflow automation (e.g., linting templates).
- **No Runtime Use**: Output code is deterministic, using hardcoded templates to meet strict client requirements.

### Feasibility
Achievable within hackathon timeline using Node.js (Sharp/SVGO for processing), JSZip for output, and Kiro for rapid prototyping. Covers ~95% of email client market share with robust fallbacks.