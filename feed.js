const Parser = require('rss-parser');
const URL = require('url');

const getFeed = async (feedUrl) => {
  if (!feedUrl) {
    console.log('No url for feed');
    return [];
  }
  const feed = new Parser();
  const result = await feed.parseURL(feedUrl);
  console.log(result.items);
  return result.items;
};

module.exports = getFeed;
