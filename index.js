const core = require('@actions/core');
const { Toolkit } = require('actions-toolkit');

const { markdown } = require('markdown');

const getRecentActivity = require('./activity');
const getFeed = require('./feed');

// Get config
const GH_USERNAME = core.getInput('GH_USERNAME');
const COMMIT_MSG = core.getInput('COMMIT_MSG');
const MAX_ACTIVITY_LINES = core.getInput('MAX_ACTIVITY_LINES');
const ACTIVITY_TO_HTML = core.getInput('ACTIVITY_TO_HTML');
const MAX_FEED_LINES = core.getInput('MAX_FEED_LINES');
const FEED_TO_HTML = core.getInput('FEED_TO_HTML');
const FEED_URL = core.getInput('FEED_URL');

const mdToHtml = (md) => markdown.toHTML(md);

const removeOutterTags = (html) => {
  return html.substring(4, html.length - 5);
};

Toolkit.run(
  async (tools) => {
    try {
      tools.log.info('Getting user recent activity...');
      const recentActivityLines = await getRecentActivity(
        tools,
        GH_USERNAME,
        MAX_ACTIVITY_LINES
      ).catch((error) => {
        tools.log.error(error.message || 'Unexpected error getting recent activity!');
        return [];
      });
      tools.log.success('Finished getting user recent activity:');

      const activityLinesAsText = recentActivityLines.join('\n');
      console.log(activityLinesAsText);
      if (ACTIVITY_TO_HTML) {
        tools.log.info('Parsing activity markdown to HTML...');
        const htmlRecentActivity = removeOutterTags(mdToHtml(activityLinesAsText));
        console.log(htmlRecentActivity);
      }

      tools.log.info('Getting feed posts...');
      const feedData = await getFeed(FEED_URL, MAX_FEED_LINES).catch((error) => {
        tools.log.error(error.message || 'Unexpected error getting feed posts!');
        return [];
      });
      tools.log.success('Finished getting user feed posts:');

      const feedLinesAsText = feedData.join('\n');
      console.log(feedLinesAsText);
      if (FEED_TO_HTML) {
        tools.log.info('Parsing feed posts markdown to HTML...');
        const htmlFeedPosts = removeOutterTags(mdToHtml(feedLinesAsText));
        console.log(htmlFeedPosts);
      }
    } catch (error) {
      core.setFailed(error.message);
      tools.exit.errpr(error.message || 'Unexpected error!');
    }
    tools.exit.success('Pushed to remote repository');
  },
  {
    event: ['schedule', 'workflow_dispatch', 'push'],
    secrets: ['GITHUB_TOKEN'],
  }
);
