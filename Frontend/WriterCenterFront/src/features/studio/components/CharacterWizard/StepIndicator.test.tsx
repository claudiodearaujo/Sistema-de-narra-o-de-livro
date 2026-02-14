/**
 * Tests for StepIndicator Component
 * Tests visual indicators, navigation, and state display
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepIndicator } from './StepIndicator';

describe('StepIndicator', () => {
  const defaultProps = {
    currentStep: 1,
    totalSteps: 7,
    completionPercentage: 50,
    stepLabels: [
      'Dados Básicos',
      'Identidade',
      'Físico',
      'Rosto',
      'Olhos',
      'Cabelo',
      'Vestuário',
    ],
    onStepClick: vi.fn(),
    isBasicStepValid: true,
  };

  it('should render step indicator', () => {
    render(<StepIndicator {...defaultProps} />);

    expect(screen.getByText('Etapa 1 de 7')).toBeInTheDocument();
    expect(screen.getByText('Dados Básicos')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display progress bar', () => {
    const { container } = render(<StepIndicator {...defaultProps} />);

    const progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display all step dots', () => {
    const { container } = render(<StepIndicator {...defaultProps} />);

    const stepDots = container.querySelectorAll('button[aria-label^="Etapa"]');
    expect(stepDots).toHaveLength(7);
  });

  it('should highlight current step', () => {
    const { container } = render(
      <StepIndicator {...defaultProps} currentStep={3} />
    );

    const stepDots = container.querySelectorAll('button');
    // Step 3 dot should be active (amber color)
    expect(stepDots[2]).toHaveClass('bg-amber-500');
  });

  it('should show check mark for completed steps', () => {
    const { container } = render(
      <StepIndicator {...defaultProps} currentStep={5} />
    );

    const stepDots = container.querySelectorAll('button');
    // Steps 1-4 are completed
    expect(stepDots[0]).toHaveClass('bg-green-500');
    expect(stepDots[1]).toHaveClass('bg-green-500');
  });

  it('should allow clicking steps if valid', async () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <StepIndicator {...defaultProps} onStepClick={onStepClick} />
    );

    const stepDots = container.querySelectorAll('button');
    const user = userEvent.setup();

    await user.click(stepDots[2]); // Click step 3

    expect(onStepClick).toHaveBeenCalledWith(3);
  });

  it('should disable steps if basic step is not valid', async () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <StepIndicator
        {...defaultProps}
        isBasicStepValid={false}
        onStepClick={onStepClick}
      />
    );

    const stepDots = container.querySelectorAll('button');
    const user = userEvent.setup();

    // Try clicking step 3 when basic step is invalid
    await user.click(stepDots[2]);

    // Should not call onStepClick because button is disabled
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('should update progress percentage display', () => {
    const { rerender } = render(
      <StepIndicator {...defaultProps} completionPercentage={25} />
    );

    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(
      <StepIndicator {...defaultProps} completionPercentage={75} />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should show correct step label', () => {
    const { rerender } = render(
      <StepIndicator {...defaultProps} currentStep={1} />
    );

    expect(screen.getByText('Dados Básicos')).toBeInTheDocument();

    rerender(
      <StepIndicator {...defaultProps} currentStep={4} />
    );

    expect(screen.getByText('Rosto')).toBeInTheDocument();
  });

  it('should apply correct color based on percentage', () => {
    const { container: container1 } = render(
      <StepIndicator {...defaultProps} completionPercentage={20} />
    );

    // < 30% should be red
    let progressBar = container1.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();

    const { container: container2 } = render(
      <StepIndicator {...defaultProps} completionPercentage={50} />
    );

    // 30-70% should be yellow
    progressBar = container2.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();

    const { container: container3 } = render(
      <StepIndicator {...defaultProps} completionPercentage={80} />
    );

    // > 70% should be green
    progressBar = container3.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should render "Preenchido" label', () => {
    render(<StepIndicator {...defaultProps} />);

    expect(screen.getByText('Preenchido')).toBeInTheDocument();
  });
});
