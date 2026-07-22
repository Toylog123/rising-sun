import { useCallback } from 'react';

export function useScrollReveal() {
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    node.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-700');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.remove('opacity-0', 'translate-y-4');
          node.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(node);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
  }, []);
  return ref;
}
