// Utility functions for cleaning and formatting AI chat messages

// Clean AI responses by removing internal progress markers and formatting
export function cleanMessageContent(content: string): string {
  // Remove <!--PROGRESS:{...}--> markers (internal tracking data)
  let cleaned = content.replace(/<!--PROGRESS:\{[^}]*\}-->/g, '');
  // Also handle multi-line progress markers that may span multiple lines
  cleaned = cleaned.replace(/<!--PROGRESS:[\s\S]*?-->/g, '');
  // Remove any remaining HTML-style comments
  cleaned = cleaned.replace(/<!--[^>]*-->/g, '');
  // Remove READY_TO_GENERATE markers
  cleaned = cleaned.replace(/READY_TO_GENERATE/g, '');
  // Trim excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

// Render text with basic markdown formatting (bold, italic)
export function FormattedMessage({ content }: { content: string }) {
  const cleaned = cleanMessageContent(content);
  
  // Split by markdown patterns and render with formatting
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        // Bold text: **text**
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        // Italic text: *text*
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
