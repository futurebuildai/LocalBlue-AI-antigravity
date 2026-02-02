import { useEffect, useState } from "react";

interface UseScrollSpyOptions {
  sectionIds: string[];
  offset?: number;
}

export function useScrollSpy({ sectionIds, offset = 64 }: UseScrollSpyOptions): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionVisibility: Map<string, { isVisible: boolean; top: number }> = new Map();

    const updateActiveSection = () => {
      const visibleSections = Array.from(sectionVisibility.entries())
        .filter(([_, data]) => data.isVisible)
        .sort((a, b) => a[1].top - b[1].top);

      if (visibleSections.length > 0) {
        setActiveSection(visibleSections[0][0]);
      } else {
        setActiveSection(null);
      }
    };

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          const rect = entry.boundingClientRect;
          sectionVisibility.set(id, {
            isVisible: entry.isIntersecting,
            top: rect.top,
          });
          updateActiveSection();
        },
        {
          rootMargin: `-${offset}px 0px -50% 0px`,
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sectionIds, offset]);

  return activeSection;
}
