import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type SplitTextProps = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  stagger?: number;
  onLetterAnimationComplete?: () => void;
};

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  stagger = 0.02,
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const animationRef = useRef<gsap.core.Timeline>();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const chars = text.split('');

    // Clear any existing content
    container.innerHTML = '';

    // Create spans for each character/word/line
    const elements = chars.map((char, index) => {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'pre';
      span.textContent = char === ' ' ? '\u00A0' : char;
      container.appendChild(span);
      return span;
    });

    // Set up the animation timeline
    animationRef.current = gsap.timeline({
      paused: true,
      onComplete: () => {
        if (onLetterAnimationComplete) {
          onLetterAnimationComplete();
        }
      },
    });

    // Animate each character
    elements.forEach((element, i) => {
      gsap.set(element, from);
      animationRef.current?.to(
        element,
        {
          ...to,
          ease,
          duration,
          delay: delay + i * stagger,
        },
        0
      );
    });

    // Set up intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animationRef.current?.play();
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(container);

    // Clean up
    return () => {
      animationRef.current?.kill();
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [text, delay, duration, ease, from, to, threshold, rootMargin, stagger, onLetterAnimationComplete]);

  return <div ref={containerRef} className={`split-text ${className}`} />;
};

export default SplitText;
