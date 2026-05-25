import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button.jsx';

describe('Button', () => {
  it('renders its children inside a <button> by default', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('fires the onClick handler when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole('button', { name: /tap/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forwards arbitrary props (type, aria-label, data-*)', () => {
    render(<Button type="submit" aria-label="save form" data-testid="save">Save</Button>);
    const btn = screen.getByTestId('save');
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toHaveAttribute('aria-label', 'save form');
  });

  it('honors the `as` prop to render a different tag (e.g. <a>)', () => {
    render(<Button as="a" href="/somewhere">Link</Button>);
    const link = screen.getByRole('link', { name: /link/i });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/somewhere');
  });

  it('appends the user-provided className alongside the variant classes', () => {
    render(<Button className="custom-extra">X</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/custom-extra/);
  });

  it('applies variant-specific classes for the primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole('button', { name: /primary/i });
    // Primary variant uses the brand gradient.
    expect(btn.className).toMatch(/bg-grad-brand/);
  });

  it('respects the disabled attribute', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Nope</Button>);
    const btn = screen.getByRole('button', { name: /nope/i });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
