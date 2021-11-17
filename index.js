const core = require('@actions/core');
const github = require('@actions/github');
const { Toolkit } = require('actions-toolkit');

const urlPrefix = 'https://github.com';

/**
 * Returns the sentence case representation
 * @param {String} str - the string
 *
 * @returns {String}
 */
const capitalize = (str) => str.slice(0, 1).toUpperCase() + str.slice(1);

/**
 * Returns a URL in markdown format for PR's and issues
 * @param {Object | String} item - holds information concerning the issue/PR
 *
 * @returns {String}
 */
const toUrlFormat = (item) => {
  if (typeof item === 'object') {
    return Object.hasOwnProperty.call(item.payload, 'issue')
      ? `[#${item.payload.issue.number}](${urlPrefix}/${item.repo.name}/issues/${item.payload.issue.number})`
      : `[#${item.payload.pull_request.number}](${urlPrefix}/${item.repo.name}/pull/${item.payload.pull_request.number})`;
  }
  return `[${item}](${urlPrefix}/${item})`;
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
  //   "ForkEvent",
  // "ReleaseEvent",
  // "PushEvent";
};

const getRecentActivity = async (tools) => {
  if(!tools) {
    console.error('No tools to run app!')
  }
  const events = await tools.github.activity.listPublicEventsForUser({
    username: 'jahirfiquitiva',
  });
  console.log(JSON.stringify(events.data, null, 2));
  const content = events.data
    // Filter out any boring activity
    .filter((event) => serializers.hasOwnProperty(event.type))
    // We only have five lines to work with
    .slice(0, 5)
    // Call the serializer to construct a string
    .map((item) => serializers[item.type](item));
  console.log(JSON.stringify(content, null, 2));
};

Toolkit.run(
  async (tools) => {
    try {
      await getRecentActivity(tools);
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
