import React from 'react';
import styled from 'styled-components';
import { ArrowRight } from 'lucide-react';

interface GradientButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  className = '',
  href,
  icon,
  onClick,
}) => {
  const buttonContent = (
    <>
      {children}
      {icon && <span className="button-icon">{icon}</span>}
    </>
  );

  const commonProps = {
    className: `gradient-button ${className}`,
    onClick,
    children: buttonContent,
  };

  return (
    <StyledWrapper>
      <div className="container">
        {href ? (
          <a href={href} {...commonProps} />
        ) : (
          <button type="button" {...commonProps} />
        )}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: inline-block;
  
  .container {
    position: relative;
    padding: 3px;
    background: linear-gradient(90deg, #03a9f4, #f441a5);
    border-radius: 0.9em;
    transition: all 0.4s ease;
    display: inline-block;
  }

  .gradient-button {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.8rem 1.8rem;
    border-radius: 0.7em;
    border: none;
    background-color: #000;
    color: #fff;
    cursor: pointer;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    position: relative;
    z-index: 1;
    width: 100%;
    justify-content: center;

    .button-icon {
      display: flex;
      transition: transform 0.3s ease;
    }

    &:hover {
      .button-icon {
        transform: translateX(4px);
      }
    }
  }

  .container::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    border-radius: 0.9em;
    z-index: -10;
    filter: blur(0);
    transition: filter 0.4s ease;
  }

  .container:hover::before {
    background: linear-gradient(90deg, #03a9f4, #f441a5);
    filter: blur(1.2em);
  }
  
  .container:active::before {
    filter: blur(0.2em);
  }
`;

export default GradientButton;
