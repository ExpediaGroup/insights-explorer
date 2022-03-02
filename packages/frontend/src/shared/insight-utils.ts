import { InsightLink } from '../models/generated/graphql';

/**
 * Group links into sections, with a default section of `Links.
 *
 * Maintains the order of groups, and links within groups.
 *
 * @param insightLinks List of links
 * @returns Links grouped by `group` property
 */
export const groupInsightLinks = (insightLinks?: InsightLink[]) => {
  return (insightLinks ?? []).reduce<{ group: string; links: { url: string; name?: string }[] }[]>(
    (acc, { url, name, group }) => {
      if (group == null || group.length === 0) {
        group = 'Links';
      }

      const groupArray = acc.find(({ group: groupName }) => groupName === group);

      if (groupArray) {
        groupArray.links.push({ url, name });
      } else {
        acc.push({ group, links: [{ url, name }] });
      }

      return acc;
    },
    []
  );
};
