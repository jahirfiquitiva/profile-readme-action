const core = require('@actions/core');
const github = require('@actions/github');
const { Toolkit } = require('actions-toolkit');

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
      console.log(recentActivityLines);

      tools.log.info('Getting feed posts...');
      const feedData = await getFeed(FEED_URL, MAX_FEED_LINES).catch((error) => {
        tools.log.error(error.message || 'Unexpected error getting feed posts!');
        return [];
      });
      tools.log.success('Finished getting user feed posts:');
      console.log(feedData);
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
