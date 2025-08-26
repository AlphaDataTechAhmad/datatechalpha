import React from 'react';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  color?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  href,
  className = '',
  color = '#7808d0',
}) => {
  return (
    <StyledWrapper>
      <a 
        href={href} 
        className={`button ${className}`} 
        style={{ '--clr': color } as React.CSSProperties}
      >
        <span className="button__icon-wrapper">
          <ChevronRight className="button__icon-svg" size={14} />
          <ChevronRight className="button__icon-svg button__icon-svg--copy" size={14} />
        </span>
        {children}
      </a>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    line-height: 1;
    text-decoration: none;
    display: inline-flex;
    border: none;
    cursor: pointer;
    align-items: center;
    gap: 0.75rem;
    background-color: var(--clr, #7808d0);
    color: #fff;
    border-radius: 10rem;
    font-weight: 600;
    padding: 0.8rem 1.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s ease;
    font-size: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid transparent;
  }

  .button:hover {
    background-color: #000;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .button__icon-wrapper {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    position: relative;
    color: var(--clr, #7808d0);
    background-color: #fff;
    border-radius: 50%;
    display: grid;
    place-items: center;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .button:hover .button__icon-wrapper {
    color: #000;
  }

  .button__icon-svg {
    transition: transform 0.3s ease-in-out;
  }

  .button__icon-svg--copy {
    position: absolute;
    transform: translate(-150%, 150%);
  }

  .button:hover .button__icon-svg:first-child {
    transform: translate(150%, -150%);
  }

  .button:hover .button__icon-svg--copy {
    transition-delay: 0.1s;
    transform: translate(0);
  }
`;

export default AnimatedButton;
