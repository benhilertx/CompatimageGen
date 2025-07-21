# Core Concepts of CompatimageGen

## Universal Email Logo Compatibility
CompatimageGen ensures logos display consistently across major email clients (Apple Mail, Gmail, Outlook Desktop, etc.), covering ~95% of market share, by generating a single HTML code block with layered fallbacks (SVG, PNG, VML) tailored to each client’s rendering capabilities, without requiring external image hosting.

## Input Flexibility
Accepts diverse inputs—SVG, PNG/JPEG images, or CSS-based logos—validating and optimizing them (e.g., minifying SVGs, compressing images) to ensure compatibility and manage file size constraints (<1MB).

## Automated Fallback Generation
Processes inputs to create optimized fallbacks:
- **SVG**: For vector-supporting clients like Apple Mail.
- **PNG**: Universal fallback for clients like Gmail with no SVG support.
- **VML**: For Outlook Desktop, mapping SVG shapes to VML via conditional comments.
Handles edge cases (e.g., complex SVGs) by warning users and defaulting to PNG.

## No Hosting Dependency
Embeds all assets as inline base64 data URIs or includes downloadable PNGs in a ZIP output, ensuring scalability and eliminating reliance on external servers.

## Estimated Previews
Provides text-based and minimal visual previews for Apple Mail, Gmail, and Outlook Desktop, estimating rendering based on known client behaviors (e.g., SVG for Apple Mail, PNG for Gmail, VML for Outlook), included in the output ZIP.

## Hackathon Alignment
Designed for the "Code with Kiro" hackathon, leveraging Kiro to scaffold UI (React/Next.js) and backend logic (Node.js, Sharp/SVGO), targeting productivity and workflow efficiency within a 6-week timeline ending August 25, 2025.

## Output Simplicity
Delivers a ZIP containing:
- HTML snippet with all fallbacks.
- Fallback PNG file.
- Markdown instructions for easy integration (e.g., pasting into Mailchimp).
- Preview results (text and PNGs) for major platforms.