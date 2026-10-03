import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { allTlsCitations, sourceLink } from '../../content/tls/citations';
import { SourcesModal } from './SourcesModal';

const sources = allTlsCitations.map((c) => ({ id: c.id, text: c.text, href: sourceLink(c) }));
const show = (over = {}) => render(<SourcesModal open onOpenChange={() => {}} title="Sources" sources={sources} {...over} />);

describe('SourcesModal', () => {
  it('lists every reference in order, numbered by its id', () => {
    show();
    const dialog = screen.getByRole('dialog', { name: 'Sources' });
    const items = within(dialog).getAllByRole('listitem');
    expect(items).toHaveLength(allTlsCitations.length);
    expect(items[0]).toHaveTextContent('Howard SC, Jones DP, Pui CH');
    expect(items[18]).toHaveAttribute('value', '19');
  });
  it('gives each reference an outbound link that opens in a new tab without leaking the opener', () => {
    show();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(allTlsCitations.length);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
    }
    expect(screen.getByRole('link', { name: 'Open reference 19 in a new tab' })).toHaveAttribute('href', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2390954');
    expect(screen.getByRole('link', { name: 'Open reference 5 in a new tab' })).toHaveAttribute('href', 'https://doi.org/10.1111/bjh.70092');
  });
  it('has no accessibility violations', async () => {
    show();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
