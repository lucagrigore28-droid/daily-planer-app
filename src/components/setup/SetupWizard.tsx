
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepName from './StepName';
import StepTheme from './StepTheme';
import StepSubjects from './StepSubjects';
import StepSchedule from './StepSchedule';
import StepNotifications from './StepNotifications';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import StepWelcome from './StepWelcome';

const TOTAL_STEPS = 6;

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const nextStep = () => setStep(prev => (prev < TOTAL_STEPS ? prev + 1 : prev));
  const prevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev));
  
  const handleBackToLogin = () => {
    router.push('/login');
  };

  const progressValue = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const renderStep = () => {
    switch (step) {
      case 1: return <StepWelcome onNext={nextStep} />;
      case 2: return <StepName onNext={nextStep} onBack={prevStep} />;
      case 3: return <StepTheme onNext={nextStep} onBack={prevStep} />;
      case 4: return <StepSubjects onNext={nextStep} onBack={prevStep} />;
      case 5: return <StepSchedule onNext={nextStep} onBack={prevStep} />;
      case 6: return <StepNotifications onNext={nextStep} onBack={prevStep} />;
      default: return <StepWelcome onNext={nextStep} />;
    }
  }

  return (
    <div className={cn(
        "flex min-h-screen flex-col items-center justify-center p-4",
        step > 1 ? "bg-gradient-primary-accent" : "bg-background"
      )}>
      <div className={cn(
        "w-full flex flex-col justify-between",
        step > 1 ? "max-w-2xl min-h-[550px]" : "h-screen"
        )}>
        <div className={cn("flex-grow flex items-center", step === 1 && "justify-center")}>
            <div className="w-full fade-in-up">
              {renderStep()}
            </div>
        </div>
        {step > 1 && (
            <div className="mt-8">
                <Progress value={progressValue} className="h-2" />
            </div>
        )}
      </div>
    </div>
  );
}
