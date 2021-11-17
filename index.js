const core = require('@actions/core');
const github = require('@actions/github');
const { Toolkit } = require('actions-toolkit');

const getFeed = require('./feed');

const urlPrefix = 'https://github.com';
// Get config
const GH_USERNAME = core.getInput('GH_USERNAME');
const COMMIT_MSG = core.getInput('COMMIT_MSG');
const MAX_ACTIVITY_LINES = core.getInput('MAX_ACTIVITY_LINES');
const ACTIVITY_TO_HTML = core.getInput('ACTIVITY_TO_HTML');
const MAX_FEED_LINES = core.getInput('MAX_FEED_LINES');
const FEED_TO_HTML = core.getInput('FEED_TO_HTML');
const FEED_URL = core.getInput('FEED_URL');

const capitalize = (str) => str.slice(0, 1).toUpperCase() + str.slice(1);

const toUrlFormat = (item) => {
  if (typeof item === 'object') {
    return Object.hasOwnProperty.call(item.payload, 'issue')
      ? `[#${item.payload.issue.number}](${urlPrefix}/${item.repo.name}/issues/${item.payload.issue.number})`
      : `[#${item.payload.pull_request.number}](${urlPrefix}/${item.repo.name}/pull/${item.payload.pull_request.number})`;
  }
  return `[${item}](${urlPrefix}/${item})`;
};

const formatRepoNameToUrl = (repoName) => {
  return `[${repoName}](${urlPrefix}/${repoName})`;
};

const formatReleaseTag = (release, repoName) => {
  const { tag_name, name } = release;
  return `"[${name}](${urlPrefix}/${repoName}/releases/tag/${tag_name})"`;
};

const serializers = {
  IssueCommentEvent: (item) => {
    return `🗣 Commented on ${toUrlFormat(item)} in ${toUrlFormat(item.repo.name)}`;
  },
  IssuesEvent: (item) => {
    return `❗️ ${capitalize(item.payload.action)} issue ${toUrlFormat(item)} in ${toUrlFormat(
      item.repo.name
    )}`;
  },
  PullRequestEvent: (item) => {
    const emoji = item.payload.action === 'opened' ? '💪' : '❌';
    const line = item.payload.pull_request.merged
      ? '🎉 Merged'
      : `${emoji} ${capitalize(item.payload.action)}`;
    return `${line} PR ${toUrlFormat(item)} in ${toUrlFormat(item.repo.name)}`;
  },
  ForkEvent: (item) => {
    console.log(item);
    return `🍴 Forked ${formatRepoNameToUrl(
      item.payload.forkee.full_name
    )} from ${formatRepoNameToUrl(item.repo.name)}`;
  },
  ReleaseEvent: (item) => {
    console.log(item);
    return `📦 Released "${formatReleaseTag(
      item.payload.release,
      item.repo.name
    )}" in ${formatRepoNameToUrl(item.repo.name)}`;
  },
};

const getRecentActivity = async (tools) => {
  if (!tools) {
    console.error('No tools to run app!');
  }
  const events = await tools.github.activity.listPublicEventsForUser({
    username: GH_USERNAME,
    per_page: 100,
  });
  const content = events.data
    .filter((event) => serializers.hasOwnProperty(event.type))
    .slice(0, MAX_ACTIVITY_LINES)
    .map((item) => serializers[item.type](item));
  return content;
};

Toolkit.run(
  async (tools) => {
    try {
      const recentActivityLines = await getRecentActivity(tools).catch(() => []);
      console.log(recentActivityLines);
      const feedData = await getFeed(FEED_URL, MAX_BLOGS_LINES).catch(() => []);
      console.log(feedData);
      tools.log.info('Info message');
      tools.log.debug('Debug message');
      tools.log.success('Success message');
      // `who-to-greet` input defined in action metadata file
      const nameToGreet = core.getInput('who-to-greet');
      console.log(`Hello ${nameToGreet}!`);
      const time = new Date().toTimeString();
      core.setOutput('time', time);
      // Get the JSON webhook payload for the event that triggered the workflow
      const payload = JSON.stringify(github.context.payload, undefined, 2);
      console.log(`The event payload: ${payload}`);
    } catch (error) {
      core.setFailed(error.message);
    }
    tools.exit.success('Pushed to remote repository');
  },
  {
    event: ['schedule', 'workflow_dispatch', 'push'],
    secrets: ['GITHUB_TOKEN'],
  }
);
