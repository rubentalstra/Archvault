import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightChangelogs from 'starlight-changelogs';
import starlightLinksValidator from 'starlight-links-validator';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightKbd from 'starlight-kbd';
import starlightHeadingBadges from 'starlight-heading-badges';
// starlight-versions is installed but not active yet — enable when docs are ready for versioning
// import starlightVersions from 'starlight-versions';
import starlightScrollToTop from 'starlight-scroll-to-top';
import starlightSidebarSwipe from 'starlight-sidebar-swipe';

export default defineConfig({
    site: 'https://archvault.dev',
    integrations: [
        starlight({
            plugins: [
                starlightChangelogs(),
                starlightLinksValidator(),
                starlightImageZoom(),
                starlightLlmsTxt({
                    projectName: 'ArchVault',
                    description:
                        'Visual C4 architecture platform for modeling software systems (Levels 1-3), creating diagrams, building reusable architecture blocks, and sharing via a community registry.',
                }),
                starlightKbd({
                    types: [
                        {
                            id: 'mac',
                            label: 'macOS',
                            detector: 'apple',
                            default: false,
                        },
                        {
                            id: 'windows',
                            label: 'Windows',
                            detector: 'windows',
                            default: true,
                        },
                        {
                            id: 'linux',
                            label: 'Linux',
                            detector: 'linux',
                            default: false,
                        },
                    ],
                }),
                starlightHeadingBadges(),
                starlightScrollToTop({
                    position: 'right',
                    threshold: 30,
                    smoothScroll: true,
                    tooltipText: {
                        en: 'Scroll to top',
                        nl: 'Naar boven',
                    },
                }),
                starlightSidebarSwipe(),
                // Enable when ready to create a versioned snapshot:
                // starlightVersions({ versions: [{ slug: '0.x' }] }),
            ],
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
                    items: [
                        {label: 'Changelog', link: '/changelog/'},
                        {
                            label: 'Resources',
                            autogenerate: {directory: 'community'},
                        },
                    ],
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
