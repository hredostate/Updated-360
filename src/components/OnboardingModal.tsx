import React, { useState } from 'react';
import type { TourSlide } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourContent: TourSlide[];
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, tourContent }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < tourContent.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(); // Finish on the last step
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const slide = tourContent[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in p-4">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4 text-center">
        <div className="text-6xl mb-4">{slide.icon}</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{slide.title}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 min-h-[4rem]">{slide.description}</p>

        <div className="flex justify-center items-center my-6 space-x-2">
          {tourContent.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30"
            >
              Previous
            </button>
          ) : (
            <div /> // Placeholder to keep layout consistent
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            {currentStep === tourContent.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;