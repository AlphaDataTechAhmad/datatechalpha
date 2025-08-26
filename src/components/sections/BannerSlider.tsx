import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import dynamic from 'next/dynamic';

const BannerSlider: React.FC = () => {
  return (
    <div className="w-[95%] mx-auto max-w-[1800px] relative z-0 mt-8">
      {/* Background with gradient and grid pattern matching home page */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-900 dark:to-dark-800 -z-10" />
      <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)] dark:shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.5)]">
        <Carousel
          showArrows={true}
          showStatus={false}
          showIndicators={true}
          infiniteLoop={true}
          autoPlay={true}
          interval={5000}
          stopOnHover={false}
          showThumbs={false}
          className="banner-carousel"
          renderArrowPrev={(onClickHandler, hasPrev, label) =>
            hasPrev && (
              <button
                type="button"
                onClick={onClickHandler}
                title={label}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )
          }
          renderArrowNext={(onClickHandler, hasNext, label) =>
            hasNext && (
              <button
                type="button"
                onClick={onClickHandler}
                title={label}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          }
        >
          <div className="relative w-full h-[50px] sm:h-[80px] md:h-[220px] lg:h-[80px] xl:h-[320px] overflow-hidden">
            <img
              src="https://iili.io/Fvu0YdP.png"
              alt="Special Offer - Enroll Now"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="relative w-full h-[50px] sm:h-[80px] md:h-[220px] lg:h-[80px] xl:h-[320px] overflow-hidden">
            <img
              src="https://iili.io/FvAwfst.png"
              alt="Special Offer - Enroll Now"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default BannerSlider;
