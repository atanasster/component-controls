import {
  Store,
  getDefaultStore,
  Story,
  Document,
  mergeConfig,
  deepMerge,
  defaultRunConfig,
  convertConfig,
  docStoryToId,
  storyNameFromExport,
  defDocType,
  PageConfiguration,
  Pages,
  PageLayoutProps,
  mapDynamicStories,
  mergeStoryProps,
  getStoryControls,
} from '@component-controls/core';
import { LoadingStore } from '@component-controls/loader';
import { render as reactRender } from '@component-controls/render/react';

export { LoadingStore };

export const loadStore = (store: LoadingStore, building?: boolean): Store => {
  const globalStore: Store = getDefaultStore();
  try {
    const {
      error,
      stores,
      packages: loadedPackages,
      components: loadedComponents,
      config = {},
      buildConfig = {},
    } = store;
    if (stores) {
      globalStore.config = mergeConfig(
        defaultRunConfig,
        convertConfig(mergeConfig(buildConfig, config)),
      );
      if (!globalStore.config.renderFn) {
        globalStore.config.renderFn = reactRender;
      }
      globalStore.search = store.search;

      stores.forEach(s => {
        const storeDoc = s.doc;
        const storeStories = s.stories;
        if (storeDoc && storeStories && s.stories) {
          const page =
            (globalStore.config.pages?.[
              storeDoc.type || defDocType
            ] as PageConfiguration) || defaultRunConfig.pages?.[defDocType];
          const pageLayout: PageLayoutProps = {
            contextSidebar: page.contextSidebar,
            fullPage: page.fullPage,
            navSidebar: page.navSidebar,
          };
          storeDoc.renderFn = storeDoc.renderFn || globalStore.config.renderFn;
          //storybook compat
          storeDoc.controls = storeDoc.controls || (storeDoc as any).args;
          const doc: Document = deepMerge<Document>(
            pageLayout,
            mergeStoryProps(store.config, storeDoc),
          );
          globalStore.docs[doc.title] = doc;
          Object.keys(storeStories).forEach((storyName: string) => {
            const exportedStory: Story = storeStories[storyName];
            const stories: Story[] = mapDynamicStories(
              exportedStory,
              doc,
              building,
            );
            stories.forEach(docStory => {
              const id = docStory.id || docStory.name;
              if (doc.title && id) {
                const story = {
                  ...docStory,
                  id: docStoryToId(doc.title, id),
                  rawId: id,
                  name: storyNameFromExport(docStory.name),
                  doc: doc.title,
                };
                //storybook compat
                story.controls = story.controls || (story as any).args;
                Object.assign(story, mergeStoryProps(doc, story));
                story.controls = getStoryControls(story, doc, loadedComponents);
                if (!doc.stories) {
                  doc.stories = [];
                }
                doc.stories.push(story.id);
                globalStore.stories[story.id] = story;
              }
            });
          });
        }
      });
      globalStore.error = error;
      globalStore.packages = loadedPackages;
      globalStore.components = loadedComponents;
      const { storySort } = globalStore.config || {};
      let pages: Pages = Object.keys(globalStore.docs).map(
        key => globalStore.docs[key],
      );
      if (storySort) {
        pages = pages.sort((a: Document, b: Document) => {
          const sort = storySort(a.title, b.title);
          if (sort !== 0) {
            return sort;
          }
          return pages.indexOf(a) - pages.indexOf(b);
        });
      }
      //split documents by their common 'parent'
      const sortedDocs = pages
        .map(doc => {
          const levels = doc.title.split('/');
          const parent = levels.slice(0, -1).join('/');
          return { id: doc, parent };
        })
        .sort((a, b) => {
          if (a.parent === b.parent) {
            return (
              (globalStore.docs[a.id.title].order || 0) -
              (globalStore.docs[b.id.title].order || 0)
            );
          }
          return 0;
        });
      globalStore.docs = sortedDocs.reduce((acc, d) => {
        const doc = d.id;
        return { ...acc, [doc.title]: doc };
      }, {});
    }
  } catch (e) {
    console.error(e);
  }
  return globalStore;
};
