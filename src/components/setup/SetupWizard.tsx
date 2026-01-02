"use client";

import React, { useState } from 'react';
import StepWelcome from './StepWelcome';
import StepName from './StepName';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import StepPermissions from './StepPermissions';
import { Progress } from '@/components/ui/progress';

const TOTAL_STEPS = 5;

export default function SetupWizard() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(prev => (prev < TOTAL_STEPS ? prev + 1 : prev));
  const prevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev));

  const progressValue = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Progress value={progressValue} className="mb-8 h-2" />
        <div className="min-h-[500px]">
          {step === 1 && <StepWelcome onNext={nextStep} />}
          {step === 2 && <StepName onNext={nextStep} />}
          {step === 3 && <StepSubjects onNext={nextStep} onBack={prevStep} />}
          {step === 4 && <StepSchedule onNext={nextStep} onBack={prevStep} />}
          {step === 5 && <StepPermissions onBack={prevStep} />}
        </div>
      </div>
    </div>
  );
}
