import { atom, selector, useRecoilValue } from 'recoil';
import {
  Story,
  getStoryPath,
  CURRENT_STORY,
  docStoryToId,
  getComponentName,
  StoryComponent,
} from '@component-controls/core';
import { storeState, useStore, useActiveTab, useConfig } from './store';

export const storyIdState = atom<string | undefined>({
  key: 'story_id',
  default: undefined,
});

export const currentStoryState = selector<Story | undefined>({
  key: 'current_story',
  get: ({ get }) => {
    const id = get(storyIdState);
    if (!id) {
      return undefined;
    }
    const store = get(storeState);
    return store.stories[id];
  },
  set: ({ get }, newValue) => {
    if (newValue) {
      const id = get(storyIdState);
      if (id) {
        const store = get(storeState);
        store.updateStory(newValue as Story);
      }
    }
  },
});

export const useCurrentStory = (): Story | undefined =>
  useRecoilValue(currentStoryState);

export const useStoryById = (storyId: string) => {
  const store = useStore();
  return store.stories[storyId];
};

/**
 * returns the url path to a story.
 */
export const useStoryPath = (storyId: string): string => {
  const store = useStore();
  const activeTab = useActiveTab();
  const config = useConfig();
  const story = store.stories[storyId];
  if (!story) {
    return '';
  }
  const doc = store.docs[story?.doc || ''];
  return getStoryPath(story.id, doc, config?.pages, activeTab);
};

export const useGetStoryPath = () => {
  const store = useStore();
  const config = useConfig();
  return (storyId: string, activeTab?: string): string => {
    const story = store.stories[storyId];
    const doc = story && story.doc ? store.docs[story.doc] : undefined;
    return getStoryPath(storyId, doc, config?.pages, activeTab);
  };
};

export const getStoryIdFromName = () => (name: string): string | undefined => {
  const store = useStore();
  for (const title in store.docs) {
    const doc = store.docs[title];
    const storyId = docStoryToId(title, name);
    if (doc.stories && doc.stories.indexOf(storyId) > -1) {
      return storyId;
    }
  }
  return undefined;
};

export interface StoryInputProps {
  id?: string;
  name?: string;
}

export const useStoryId = ({
  id = CURRENT_STORY,
  name,
}: StoryInputProps): string | undefined => {
  const currentStoryId = useRecoilValue(storyIdState);
  const storyIdFromName = getStoryIdFromName();
  return name
    ? storyIdFromName(name)
    : id === CURRENT_STORY
    ? currentStoryId
    : id;
};

export const useStory = (props: StoryInputProps): Story | undefined => {
  const storyId = useStoryId(props);
  return storyId ? useStoryById(storyId) : undefined;
};

export const useGetStory = () => (props: StoryInputProps) => useStory(props);

export const useStoryComponent = (
  props: StoryInputProps,
): StoryComponent | undefined => {
  const storyId = useStoryId(props);
  const store = useStore();
  const story: Story | undefined = storyId ? store.stories[storyId] : undefined;
  const storyComponent: any = story?.component;

  const componentName = getComponentName(storyComponent);
  const doc = story && story.doc ? store.docs[story.doc] : undefined;
  const component =
    componentName && doc && doc.componentsLookup[componentName]
      ? store.components[doc.componentsLookup[componentName]]
      : undefined;
  return component;
};