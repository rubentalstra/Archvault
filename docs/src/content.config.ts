import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { changelogsLoader } from 'starlight-changelogs/loader';
// Enable when starlight-versions is activated:
// import { docsVersionsLoader } from 'starlight-versions/loader';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      {
        provider: 'github',
        base: 'changelog',
        owner: 'rubentalstra',
        repo: 'ArchVault',
      },
    ]),
  }),
  // Enable when starlight-versions is activated:
  // versions: defineCollection({ loader: docsVersionsLoader() }),
};
