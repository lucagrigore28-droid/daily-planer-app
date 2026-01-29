"use client";

import React, { useState, useContext } from 'react';
import StepName from './StepName';
import StepTheme from './StepTheme';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import { Progress } from '@/components/ui/progress';
import SplashScreen from '../SplashScreen';
import { AppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 3;

type SetupWizardProps = {
  onFinish: () => void;
};

export default function SetupWizard({ onFinish }: SetupWizardProps) {
  const [step, setStep] = useState(0); // 0 is splash screen
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const context = useContext(AppContext);

  const handleFinishSetup = () => {
    context?.updateUser({ setupComplete: true });
    onFinish();
  };
  
  const nextStep = () => {
    setAnimationDirection('forward');
    setStep(prev => prev + 1);
  };
  const prevStep = () => {
    setAnimationDirection('backward');
    setStep(prev => prev - 1);
  };

  if (step === 0) {
    return <SplashScreen onNext={nextStep} />;
  }

  const progressValue = (step / TOTAL_STEPS) * 100;

  const animationClass = 
    step === 1
      ? 'fade-in-up'
      : animationDirection === 'forward' 
        ? 'animate-slide-in-from-right' 
        : 'animate-slide-in-from-left';

  const renderStep = () => {
    switch (step) {
      case 1: return <StepName onNext={nextStep} />;
      case 2: return <StepSubjects onNext={nextStep} onBack={prevStep} />;
      case 3: return <StepSchedule onNext={handleFinishSetup} onBack={prevStep} />;
      default: return null; // Should not happen
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-primary-accent p-4 overflow-hidden">
      <div className="w-full flex flex-col justify-between max-w-2xl min-h-[550px]">
        <div className="flex-grow flex items-center">
            <div key={step} className={cn("w-full", animationClass)}>
              {renderStep()}
            </div>
        </div>
        <div className="mt-8">
            <Progress value={progressValue} className="h-2" />
        </div>
      </div>
    </div>
  );
}
