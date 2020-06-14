/** @jsx jsx */
import { FC, ReactNode, useRef, useContext } from 'react';
import { jsx, Box, Flex } from 'theme-ui';
import * as qs from 'qs';
import { PageType } from '@component-controls/specification';
import { Tabs, Tab, TabList, TabPanel } from '@component-controls/components';
import { PageContainer, BlockContext } from '@component-controls/blocks';

import { SideContext } from '../SideContext';
import { Sidebar } from '../Sidebar';
export interface PageConfig {
  key: string;
  title: string;
  render: () => ReactNode;
}

export type PagesConfig = (route: string) => PageConfig[];

export interface DocPageProps {
  pagesFn: PagesConfig;
  type: PageType;
}
export const BasePage: FC<DocPageProps> = ({ pagesFn, type }) => {
  const pages = typeof pagesFn === 'function' ? pagesFn('') : [];
  const pageRef = useRef<HTMLDivElement>(null);
  const params =
    typeof window !== 'undefined'
      ? qs.parse(window.location.search.substring(1))
      : {};
  const tabIndex = Math.max(
    pages.findIndex(page => page.key === params['view']),
    0,
  );
  return (
    <Flex sx={{ flex: '1 0 auto' }}>
      <Sidebar type={type} />
      <Box sx={{ flexGrow: 1 }} id="content">
        <Tabs
          fontSize={16}
          selectedIndex={tabIndex}
          onSelect={index => {
            const key = pages[index]?.key;
            if (key) {
              const params = qs.parse(window.location.search.substring(1));
              params['view'] = key;
              const newHREF = `${window.location.origin}${
                window.location.pathname
              }?${qs.stringify(params)}${window.location.hash}`;
              window.location.href = newHREF;
              return false;
            }
            return true;
          }}
        >
          {pages && pages.length > 1 && (
            <TabList>
              {pages.map(page => (
                <Tab key={`tab_${page.key}`}>{page.title}</Tab>
              ))}
            </TabList>
          )}

          <PageContainer variant={`pagecontainer.${type}`} ref={pageRef}>
            {pages &&
              pages.map(page => (
                <TabPanel key={`panel_${page.key}`}>{page.render()}</TabPanel>
              ))}
          </PageContainer>
        </Tabs>
      </Box>
      <SideContext pageRef={pageRef} />
    </Flex>
  );
};

export const DocPage: FC<DocPageProps> = ({ type = 'story', ...props }) => {
  const { storeProvider, docId } = useContext(BlockContext);
  const doc = docId ? storeProvider.getStoryDoc(docId) : undefined;
  const { pages } = storeProvider.config || {};
  const page = pages ? pages[type] : undefined;

  const hasNoSideBars =
    (doc && doc.sidebars === false) || (page && page.sidebars === false);
  const isFullPage =
    (doc && doc.fullPage === true) || (page && !!page.fullPage);
  if (hasNoSideBars || isFullPage) {
    return (
      <PageContainer
        variant={`pagecontainer.${isFullPage ? 'full' : type}`}
        id="content"
      />
    );
  }
  return <BasePage type={type} {...props} />;
};