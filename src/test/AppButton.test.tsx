// src/components/common/AppButton.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AppButton from '../components/AppButton';

// 'describe' block groups related tests together
describe('AppButton Component', () => {

  // 'it' or 'test' defines a single test case
  it('should render the button with the correct text', () => {
    // 1. Arrange: Render the component
    render(<AppButton>Click Me</AppButton>);

    // 2. Act & 3. Assert: Find the button and check if it's in the document
    const buttonElement = screen.getByText(/click me/i);
    expect(buttonElement).toBeInTheDocument();
  });

  it('should call the onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn(); // Create a mock function

    // Arrange
    render(<AppButton onClick={handleClick}>Submit</AppButton>);
    const buttonElement = screen.getByText('Submit');

    // Act: Simulate a user click
    await user.click(buttonElement);

    // Assert: Check if the mock function was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', () => {
    // Arrange
    render(<AppButton disabled>Disabled Button</AppButton>);
    const buttonElement = screen.getByText('Disabled Button');

    // Assert
    expect(buttonElement).toBeDisabled();
  });

  it('should show a loader when isLoading is true', () => {
    // Arrange
    render(<AppButton isLoading>Loading...</AppButton>);
    
    // Assert
    const loader = screen.getByRole('progressbar');
    expect(loader).toBeInTheDocument();

    // Also, check that the button text is NOT visible
    const buttonText = screen.queryByText('Loading...');
    expect(buttonText).not.toBeInTheDocument();
  });
});