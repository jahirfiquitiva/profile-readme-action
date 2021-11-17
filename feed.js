const Parser = require('rss-parser');

const transformFeedItem = (feedItem) => {
  return `[${feedItem.title}](${feedItem.link})`;
};

const getFeed = async (feedUrl, maxLines = 5) => {
  if (!feedUrl) {
    console.log('No url for feed');
    return [];
  }
  const feed = new Parser();
  const result = await feed.parseURL(feedUrl);
  return result.items
    .map((item) => {
      try {
        return { ...item, date: new Date(item.isoDate) };
      } catch (e) {
        return { ...item, date: new Date(item.pubDate) };
      }
    })
    .sort((a, b) => b.date - a.date)
    .slice(0, maxLines)
    .map(transformFeedItem)
    .map((item, index) => `${index + 1}. ${item}`);
};

module.exports = getFeed;
