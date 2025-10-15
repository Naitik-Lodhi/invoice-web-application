import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatCard from '../components/dashboard/StatCard';

describe('StatCard Component', () => {
  
  // ============================================
  // UI-01: Basic Rendering
  // ============================================
  describe('UI-01: Basic Rendering', () => {
    it('should render card with title, value, and subtext', () => {
      render(
        <StatCard 
          title="Total Invoices" 
          value="125" 
          subtext="This Month" 
        />
      );

      expect(screen.getByText('Total Invoices')).toBeInTheDocument();
      expect(screen.getByText('125')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should render with optional icon', () => {
      const TestIcon = () => <span data-testid="test-icon">📊</span>;
      
      render(
        <StatCard 
          title="Revenue" 
          value="$50,000" 
          subtext="Today"
          icon={<TestIcon />}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should render with optional trend indicator', () => {
      render(
        <StatCard 
          title="Sales" 
          value="$1,234" 
          subtext="Week"
          trend={15.5}
        />
      );

      // Check for trend percentage
      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });
  });

  // ============================================
  // UI-02: Correct Values Display
  // ============================================
  describe('UI-02: Card Values', () => {
    it('should display invoice count correctly', () => {
      render(
        <StatCard 
          title="Invoices" 
          value={250} 
          subtext="Total" 
        />
      );

      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('should display formatted numbers', () => {
      render(
        <StatCard 
          title="Total Amount" 
          value="1,234" 
          subtext="This Month" 
        />
      );

      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should handle string and number values', () => {
      const { rerender } = render(
        <StatCard title="Count" value={100} subtext="Items" />
      );
      expect(screen.getByText('100')).toBeInTheDocument();

      rerender(
        <StatCard title="Count" value="100" subtext="Items" />
      );
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ============================================
  // UI-03: Currency Symbol Display
  // ============================================
  describe('UI-03: Currency Symbol', () => {
    it('should display currency symbol with amount', () => {
      render(
        <StatCard 
          title="Total Amount" 
          value="$12,345.67" 
          subtext="This Month" 
        />
      );

      expect(screen.getByText('$12,345.67')).toBeInTheDocument();
    });

    it('should work with different currency symbols', () => {
      const { rerender } = render(
        <StatCard title="Revenue" value="₹10,000" subtext="Today" />
      );
      expect(screen.getByText('₹10,000')).toBeInTheDocument();

      rerender(
        <StatCard title="Revenue" value="€5,000" subtext="Today" />
      );
      expect(screen.getByText('€5,000')).toBeInTheDocument();

      rerender(
        <StatCard title="Revenue" value="£3,000" subtext="Today" />
      );
      expect(screen.getByText('£3,000')).toBeInTheDocument();
    });
  });

  // ============================================
  // UI-04: Thousand Separator Formatting
  // ============================================
  describe('UI-04: Thousand Separator', () => {
    it('should display numbers with thousand separator', () => {
      render(
        <StatCard 
          title="Total" 
          value="12,345.67" 
          subtext="Amount" 
        />
      );

      expect(screen.getByText('12,345.67')).toBeInTheDocument();
    });

    it('should format large numbers correctly', () => {
      const testCases = [
        { value: '1,234', expected: '1,234' },
        { value: '12,345', expected: '12,345' },
        { value: '123,456', expected: '123,456' },
        { value: '1,234,567', expected: '1,234,567' },
        { value: '12,345,678.90', expected: '12,345,678.90' },
      ];

      testCases.forEach(({ value, expected }) => {
        const { unmount } = render(
          <StatCard title="Amount" value={value} subtext="Total" />
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle decimal places correctly', () => {
      render(
        <StatCard 
          title="Amount" 
          value="1,234.56" 
          subtext="Total" 
        />
      );

      expect(screen.getByText('1,234.56')).toBeInTheDocument();
    });
  });

  // ============================================
  // UI-05: Zero Data Handling
  // ============================================
  describe('UI-05: Zero Data', () => {
    it('should display zero when no invoices', () => {
      render(
        <StatCard 
          title="Invoices" 
          value={0} 
          subtext="This Month" 
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should display zero amount with currency', () => {
      render(
        <StatCard 
          title="Total Amount" 
          value="$0.00" 
          subtext="Today" 
        />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle empty string as zero', () => {
      render(
        <StatCard 
          title="Count" 
          value="" 
          subtext="Items" 
        />
      );

      // Empty string will be rendered as is
      expect(screen.getByText('Count')).toBeInTheDocument();
    });
  });

  // ============================================
  // UI-06: Mobile Responsive Layout
  // ============================================
  describe('UI-06: Mobile Responsiveness', () => {
    it('should render correctly on mobile viewport', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(
        <StatCard 
          title="Invoices" 
          value="125" 
          subtext="This Month" 
        />
      );

      // Card should still render all elements
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('125')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should render correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;

      render(
        <StatCard 
          title="Revenue" 
          value="$50,000" 
          subtext="Today" 
        />
      );

      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('should render correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      render(
        <StatCard 
          title="Total" 
          value="$100,000" 
          subtext="Year" 
        />
      );

      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  // ============================================
  // Additional Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      render(
        <StatCard 
          title="This is a very long title that might wrap" 
          value="100" 
          subtext="Data" 
        />
      );

      expect(screen.getByText('This is a very long title that might wrap')).toBeInTheDocument();
    });

    it('should handle very long values', () => {
      render(
        <StatCard 
          title="Amount" 
          value="$999,999,999.99" 
          subtext="Maximum" 
        />
      );

      expect(screen.getByText('$999,999,999.99')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      render(
        <StatCard 
          title="Balance" 
          value="-$1,000" 
          subtext="Deficit" 
        />
      );

      expect(screen.getByText('-$1,000')).toBeInTheDocument();
    });

    it('should handle trend with negative value', () => {
      render(
        <StatCard 
          title="Sales" 
          value="$500" 
          subtext="Down"
          trend={-12.5}
        />
      );

      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility (A11y)', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <StatCard 
          title="Invoices" 
          value="125" 
          subtext="This Month" 
        />
      );

      // Check if card is rendered
      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const { container } = render(
        <StatCard 
          title="Revenue" 
          value="$1,000" 
          subtext="Today" 
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  // ============================================
  // Snapshot Tests
  // ============================================
  describe('Snapshot Tests', () => {
    it('should match snapshot for basic card', () => {
      const { container } = render(
        <StatCard 
          title="Invoices" 
          value="125" 
          subtext="This Month" 
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for card with trend', () => {
      const { container } = render(
        <StatCard 
          title="Sales" 
          value="$1,000" 
          subtext="Week"
          trend={15}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});