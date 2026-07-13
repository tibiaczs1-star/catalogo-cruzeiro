"use strict";

function isPinnedArchiveItem(item = {}) {
  return /(?:^|-)social-sync-\d+$/i.test(String(item.editorialPriority || "").trim());
}

function selectPinnedArchiveStories(items = [], desiredCount = 30, diversify = (value) => value) {
  const limit = Math.max(1, Number(desiredCount || 30));
  const sourceItems = Array.isArray(items) ? items : [];
  const pinned = sourceItems
    .filter(isPinnedArchiveItem)
    .sort((left, right) => {
      const priorityDiff = Number(right.priority || 0) - Number(left.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(right.publishedAt || 0).getTime() - new Date(left.publishedAt || 0).getTime();
    })
    .slice(0, limit);
  const remainingLimit = limit - pinned.length;

  if (remainingLimit <= 0) return pinned;

  const regular = sourceItems.filter((item) => !isPinnedArchiveItem(item));
  const diversified = diversify(regular, remainingLimit);
  return [...pinned, ...(Array.isArray(diversified) ? diversified : [])].slice(0, limit);
}

module.exports = { isPinnedArchiveItem, selectPinnedArchiveStories };
