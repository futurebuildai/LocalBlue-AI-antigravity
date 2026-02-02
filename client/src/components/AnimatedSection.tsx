import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";

type AnimationType = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-up";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "animate-on-scroll",
        `animate-${animation}`,
        isVisible && "visible",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
