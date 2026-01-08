
"use client";

import React, { useState, useContext } from 'react';
import StepName from './StepName';
import StepTheme from './StepTheme';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import StepNotifications from './StepNotifications';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import SplashScreen from '../SplashScreen';
import { AppContext } from '@/contexts/AppContext';

const TOTAL_STEPS = 5; // Welcome is not a step in the wizard progress

export default function SetupWizard() {
  const [step, setStep] = useState(0); // Start at 0 for splash screen
  const context = useContext(AppContext);

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    } else {
       // This is the final step, update context to trigger dashboard view
       context?.updateUser({ setupComplete: true });
    }
  };
  
  const prevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev));

  if (step === 0) {
    return <SplashScreen onNext={() => setStep(1)} />;
  }

  const progressValue = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1: return <StepName onNext={nextStep} />;
      case 2: return <StepTheme onNext={nextStep} onBack={prevStep} />;
      case 3: return <StepSubjects onNext={nextStep} onBack={prevStep} />;
      case 4: return <StepSchedule onNext={nextStep} onBack={prevStep} />;
      case 5: return <StepNotifications onNext={nextStep} onBack={prevStep} />;
      default: return <SplashScreen onNext={() => setStep(1)} />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-primary-accent p-4">
      <div className="w-full flex flex-col justify-between max-w-2xl min-h-[550px]">
        <div className="flex-grow flex items-center">
            <div className="w-full fade-in-up">
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
