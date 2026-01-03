"use client";

import React, { useState } from 'react';
import StepWelcome from './StepWelcome';
import StepName from './StepName';
import StepTheme from './StepTheme';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import StepNotifications from './StepNotifications';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 6;

export default function SetupWizard() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(prev => (prev < TOTAL_STEPS ? prev + 1 : prev));
  const prevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev));

  const progressValue = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1: return <StepWelcome onNext={nextStep} />;
      case 2: return <StepName onNext={nextStep} />;
      case 3: return <StepTheme onNext={nextStep} onBack={prevStep} />;
      case 4: return <StepSubjects onNext={nextStep} onBack={prevStep} />;
      case 5: return <StepSchedule onNext={nextStep} onBack={prevStep} />;
      case 6: return <StepNotifications onNext={nextStep} onBack={prevStep} />;
      default: return <StepWelcome onNext={nextStep} />;
    }
  }

  const isWelcomeStep = step === 1;

  return (
    <div className={cn(
        "flex min-h-screen flex-col items-center justify-center p-4",
        !isWelcomeStep && "bg-gradient-primary-accent"
      )}>
      <div className={cn("w-full max-w-2xl flex flex-col justify-between", isWelcomeStep ? "h-full" : "min-h-[550px]")}>
        <div className="flex-grow flex items-center">
            <div className="w-full fade-in-up">
              {renderStep()}
            </div>
        </div>
        {!isWelcomeStep && (
            <div className="mt-8">
                <Progress value={progressValue} className="h-2" />
            </div>
        )}
      </div>
    </div>
  );
}
