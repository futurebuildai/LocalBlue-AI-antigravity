import { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  showCursor?: boolean;
}

export function TypewriterText({ 
  text, 
  className = "", 
  speed = 50, 
  delay = 0,
  showCursor = true 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const startTyping = () => {
      timeout = setTimeout(() => {
        const typeNextChar = () => {
          if (currentIndex < text.length) {
            setDisplayedText(text.slice(0, currentIndex + 1));
            currentIndex++;
            timeout = setTimeout(typeNextChar, speed);
          } else {
            setIsComplete(true);
          }
        };
        typeNextChar();
      }, delay);
    };

    startTyping();

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && <span className="typewriter-cursor" />}
    </span>
  );
}

interface TypewriterLinesProps {
  lines: { text: string; className?: string }[];
  baseDelay?: number;
  lineDelay?: number;
  speed?: number;
}

export function TypewriterLines({ 
  lines, 
  baseDelay = 0, 
  lineDelay = 1000, 
  speed = 40 
}: TypewriterLinesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <TypewriterText
          key={index}
          text={line.text}
          className={line.className}
          speed={speed}
          delay={baseDelay + (index * lineDelay)}
          showCursor={index === lines.length - 1}
        />
      ))}
    </>
  );
}
