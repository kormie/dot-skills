// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://kormie.github.io',
  base: '/dot-skills/',
  integrations: [
    starlight({
      title: 'dot-skills',
      description:
        'Documentation for dot-skills — a Claude Code plugin marketplace',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/kormie/dot-skills',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', slug: 'getting-started/overview' },
            { label: 'Installation', slug: 'getting-started/installation' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Kanban Board', slug: 'guides/kanban-board' },
            { label: 'Workstreams', slug: 'guides/workstreams' },
            { label: 'API Reference', slug: 'guides/api-reference' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Plugin Structure', slug: 'reference/plugin-structure' },
            { label: 'Ticket Format', slug: 'reference/ticket-format' },
            { label: 'Design Docs', slug: 'reference/design-docs' },
          ],
        },
      ],
    }),
  ],
});
