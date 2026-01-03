"use client";

import React, { useState } from 'react';
import StepWelcome from './StepWelcome';
import StepName from './StepName';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import StepNotifications from './StepNotifications';
import { Progress } from '@/components/ui/progress';

const TOTAL_STEPS = 5;

export default function SetupWizard() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(prev => (prev < TOTAL_STEPS ? prev + 1 : prev));
  const prevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev));

  const progressValue = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1: return <StepWelcome onNext={nextStep} />;
      case 2: return <StepName onNext={nextStep} />;
      case 3: return <StepSubjects onNext={nextStep} onBack={prevStep} />;
      case 4: return <StepSchedule onNext={nextStep} onBack={prevStep} />;
      case 5: return <StepNotifications onNext={nextStep} onBack={prevStep} />;
      default: return <StepWelcome onNext={nextStep} />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Progress value={progressValue} className="mb-8 h-2" />
        <div className="min-h-[500px] fade-in-up">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
