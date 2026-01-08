"use client";

import React, { useState, useContext } from 'react';
import StepName from './StepName';
import StepTheme from './StepTheme';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import StepNotifications from './StepNotifications';
import { Progress } from '@/components/ui/progress';
import { AppContext } from '@/contexts/AppContext';

const TOTAL_STEPS = 5;

type SetupWizardProps = {
  onFinish: () => void;
};

export default function SetupWizard({ onFinish }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const context = useContext(AppContext);

  const handleFinishSetup = () => {
    context?.updateUser({ setupComplete: true });
    onFinish();
  };
  
  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const progressValue = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1: 
        // StepName is special, it doesn't get an `onBack` that goes to a previous wizard step.
        // Its back button should always lead to the login page.
        return <StepName onNext={nextStep} />;
      case 2: 
        return <StepTheme onNext={nextStep} onBack={prevStep} />;
      case 3: 
        return <StepSubjects onNext={nextStep} onBack={prevStep} />;
      case 4: 
        return <StepSchedule onNext={nextStep} onBack={prevStep} />;
      case 5: 
        return <StepNotifications onNext={handleFinishSetup} onBack={prevStep} />;
      default: 
        return null;
    }
  };

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
