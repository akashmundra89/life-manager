import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState.jsx';

describe('EmptyState', () => {
  it('renders just the bare container with no slots filled', () => {
    const { container } = render(<EmptyState />);
    // There should be a single wrapper div with the glass-soft class.
    expect(container.firstChild).toHaveClass('glass-soft');
  });

  it('renders the title and hint when supplied', () => {
    render(<EmptyState title="Nothing yet" hint="Add your first item." />);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first item.')).toBeInTheDocument();
  });

  it('renders the icon slot when supplied', () => {
    render(
      <EmptyState
        icon={<svg data-testid="icon" />}
        title="With icon"
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders the action slot when supplied', () => {
    render(
      <EmptyState
        title="With action"
        action={<button>Add</button>}
      />,
    );
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('respects custom className alongside its built-ins', () => {
    const { container } = render(<EmptyState className="extra-class" title="t" />);
    expect(container.firstChild).toHaveClass('extra-class');
    expect(container.firstChild).toHaveClass('glass-soft');
  });
});
