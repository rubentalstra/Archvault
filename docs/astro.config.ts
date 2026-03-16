import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
    site: 'https://archvault.dev',
    integrations: [
        starlight({
            title: 'ArchVault',
            favicon: '/favicon.svg',
            logo: {
                light: './src/assets/logo-light.svg',
                dark: './src/assets/logo-dark.svg',
            },
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/rubentalstra/ArchVault',
                },
            ],
            editLink: {
                baseUrl:
                    'https://github.com/rubentalstra/ArchVault/edit/main/docs/',
            },
            customCss: ['./src/styles/custom.css'],
            sidebar: [
                {
                    label: 'Getting Started',
                    items: [
                        {slug: 'getting-started/introduction'},
                        {slug: 'getting-started/quick-start-docker'},
                        {slug: 'getting-started/quick-start-manual'},
                        {slug: 'getting-started/core-concepts'},
                    ],
                },
                {
                    label: 'User Guide',
                    items: [
                        {slug: 'guide/dashboard'},
                        {
                            label: 'Organizations & Teams',
                            autogenerate: {directory: 'guide/organizations'},
                        },
                        {
                            label: 'Workspaces',
                            autogenerate: {directory: 'guide/workspaces'},
                        },
                        {
                            label: 'Diagrams',
                            autogenerate: {directory: 'guide/diagrams'},
                        },
                        {
                            label: 'Visual Editor',
                            autogenerate: {directory: 'guide/editor'},
                        },
                        {
                            label: 'Account & Profile',
                            autogenerate: {directory: 'guide/account'},
                        },
                    ],
                },
                {
                    label: 'Administration',
                    badge: {text: 'Admin', variant: 'caution'},
                    items: [
                        {
                            label: 'Deployment',
                            autogenerate: {directory: 'admin/deployment'},
                        },
                        {
                            label: 'Database',
                            autogenerate: {directory: 'admin/database'},
                        },
                        {
                            label: 'Auth & Security',
                            autogenerate: {directory: 'admin/auth'},
                        },
                        {
                            label: 'Multi-Tenancy',
                            autogenerate: {directory: 'admin/multi-tenancy'},
                        },
                        {
                            label: 'Operations',
                            autogenerate: {directory: 'admin/operations'},
                        },
                    ],
                },
                {
                    label: 'Architecture',
                    collapsed: true,
                    autogenerate: {directory: 'architecture'},
                },
                {
                    label: 'Community',
                    collapsed: true,
                    autogenerate: {directory: 'community'},
                },
            ],
            head: [
                {
                    tag: 'meta',
                    attrs: {
                        property: 'og:image',
                        content: 'https://archvault.dev/og-image.png',
                    },
                },
            ],
            lastUpdated: true,
            pagination: true,
            tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 3},
        }),
    ],
});
