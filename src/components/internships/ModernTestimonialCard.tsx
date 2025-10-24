import React from 'react';
import { motion } from 'framer-motion';

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  testimonial: string;
  avatar: string;
  companyLogo?: string;
  rating?: number;
  package?: string;
  year?: string;
  district?: string;
  state?: string;
  accentColor?: string;
}

const ModernTestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  role,
  company,
  testimonial,
  avatar,
  companyLogo,
  rating = 5,
  package: pkg,
  year,
  district,
  state,
  accentColor = '#4f46e5',
}) => {
  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.4 },
        y: { duration: 0.4 }
      }}
      style={{
        '--accent': accentColor,
        '--accent-light': `${accentColor}1a`,
        '--accent-dark': '${accentColor}cc',
      } as React.CSSProperties}
    >
      <div className="card-content">
        {companyLogo && (
          <div className="company-logo">
            <img 
              src={companyLogo} 
              alt={`${company} logo`}
              className="logo"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="star" viewBox="0 0 24 24" width="16" height="16">
              <path 
                fill={i < rating ? 'currentColor' : 'none'} 
                stroke="currentColor"
                strokeWidth="1.5"
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          ))}
        </div>
        
        {testimonial && (
          <div className="testimonial-text">
            <p>"{testimonial}"</p>
          </div>
        )}
        
        <div className="user-info">
          <div className="avatar-container">
            <img 
              src={avatar} 
              alt={name}
              className="avatar"
              loading="lazy"
              width="80"
              height="80"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${accentColor.replace('#', '')}&color=fff`;
              }}
            />
          </div>
          <div className="user-details">
            <h3 className="name">{name}</h3>
            <p className="role">{role} @ {company}</p>
            
            {/* Additional Info Grid */}
            {(pkg || year || district || state) && (
              <div className="additional-info">
                {pkg && (
                  <div className="info-item">
                    <span className="info-label">Package</span>
                    <span className="info-value">{pkg}</span>
                  </div>
                )}
                {year && (
                  <div className="info-item">
                    <span className="info-label">Year</span>
                    <span className="info-value">{year}</span>
                  </div>
                )}
                {district && state ? (
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{district}, {state}</span>
                  </div>
                ) : (
                  <>
                    {district && (
                      <div className="info-item">
                        <span className="info-label">District</span>
                        <span className="info-value">{district}</span>
                      </div>
                    )}
                    {state && (
                      <div className="info-item">
                        <span className="info-label">State</span>
                        <span className="info-value">{state}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
      </div>

      <style jsx>{`
        .card {
          width: 100%;
          max-width: 400px;
          min-height: 280px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          margin: 0 auto;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          will-change: transform, box-shadow;
          backface-visibility: hidden;
          transform: translateZ(0);
          -webkit-font-smoothing: antialiased;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 1;
        }
        
        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, var(--accent-light) 0%, transparent 30%),
            radial-gradient(circle at 80% 70%, var(--accent-light) 0%, transparent 30%);
          opacity: 0.15;
          z-index: -1;
          transition: opacity 0.3s ease;
        }
        
        .card:hover::before {
          opacity: 0.25;
        }

        .card:hover {
          transform: translateY(-8px) translateZ(0);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .card-content {
          padding: 2.25rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          position: relative;
          z-index: 2;
        }

        .company-logo {
          margin-bottom: 1.5rem;
          height: 30px;
          display: flex;
          align-items: center;
        }
        
        .company-logo img {
          max-height: 100%;
          max-width: 150px;
          object-fit: contain;
        }
        
        .rating {
          display: flex;
          gap: 4px;
          margin-bottom: 1.5rem;
        }
        
        .star {
          color: #ffd700;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 60px;
        }

        .avatar-container {
          width: 60px;
          height: 60px;
          min-width: 60px;
          border-radius: 16px;
          overflow: hidden;
          margin-right: 1rem;
          border: 2px solid var(--accent);
          background: #2d2d2d;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px var(--accent-light);
        }
        
        .card:hover .avatar-container {
          transform: scale(1.05);
          box-shadow: 0 6px 20px var(--accent-light);
        }

        .avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .avatar-container:hover .avatar {
          transform: scale(1.05);
        }

        .user-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .name {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role {
          font-size: 0.875rem;
          color: #a0a0a0;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .additional-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 0.7rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.1rem;
        }
        
        .info-value {
          font-size: 0.85rem;
          color: #e0e0e0;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .testimonial-text {
          flex: 1;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #f0f0f0;
          margin: 0 0 1.5rem 0;
          position: relative;
          padding: 1.5rem 0.5rem;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-weight: 400;
          letter-spacing: 0.01em;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(5px);
        }

        .testimonial-text p {
          margin: 0;
        }

        .testimonial-text::before,
        .testimonial-text::after {
          content: '"';
          font-size: 4rem;
          color: var(--accent);
          position: absolute;
          opacity: 0.15;
          font-family: Georgia, serif;
          line-height: 1;
          font-weight: 700;
        }

        .testimonial-text::before {
          top: -0.25rem;
          left: 0.5rem;
        }

        .testimonial-text::after {
          bottom: -1.5rem;
          right: 0.75rem;
        }

        /* Social links styles removed as requested */

        .social-icon:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .card {
            max-width: 100%;
            min-height: 300px;
          }
          
          .card-content {
            padding: 1.75rem 1.25rem;
          }
          
          .testimonial-text {
            font-size: 0.95rem;
            padding: 1.25rem 0.75rem;
            min-height: 80px;
          }
          
          .avatar-container {
            width: 50px;
            height: 50px;
            min-width: 50px;
            border-radius: 12px;
          }
          
          .name {
            font-size: 1.1rem;
          }
          
          .role {
            font-size: 0.8rem;
          }
          
          .testimonial-text::before,
          .testimonial-text::after {
            font-size: 3rem;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ModernTestimonialCard;
