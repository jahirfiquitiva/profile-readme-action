const core = require('@actions/core');
const { Toolkit } = require('actions-toolkit');
const fs = require('fs');
const { markdown } = require('markdown');
const { spawn } = require('child_process');

const getRecentActivity = require('./activity');
const getFeed = require('./feed');

// Get config
const GH_USERNAME = core.getInput('GH_USERNAME');
const COMMIT_MSG = core.getInput('COMMIT_MSG');
const MAX_ACTIVITY_LINES = core.getInput('MAX_ACTIVITY_LINES');
const ACTIVITY_TO_HTML = core.getInput('ACTIVITY_TO_HTML').toString().includes('true');
const MAX_FEED_LINES = core.getInput('MAX_FEED_LINES');
const FEED_TO_HTML = core.getInput('FEED_TO_HTML').toString().includes('true');
const FEED_URL = core.getInput('FEED_URL');

const mdToHtml = (md) => markdown.toHTML(md);

const removeOutterTags = (html) => {
  return html.substring(4, html.length - 5);
};

const exec = (cmd, args = []) =>
  new Promise((resolve, reject) => {
    const app = spawn(cmd, args, { stdio: 'pipe' });
    let stdout = '';
    app.stdout.on('data', (data) => {
      stdout = data;
    });
    app.on('close', (code) => {
      if (code !== 0 && !stdout.includes('nothing to commit')) {
        err = new Error(`Invalid status code: ${code}`);
        err.code = code;
        return reject(err);
      }
      return resolve(code);
    });
    app.on('error', reject);
  });

const commitFile = async () => {
  await exec('git', [
    'config',
    '--global',
    'user.email',
    '41898282+github-actions[bot]@users.noreply.github.com',
  ]);
  await exec('git', ['config', '--global', 'user.name', 'github-actions[bot]']);
  await exec('git', ['add', 'README.md']);
  await exec('git', ['commit', '-m', COMMIT_MSG]);
  await exec('git', ['push']);
};

const readmeAction = async (tools) => {
  tools.log.info('Getting user recent activity...');
  const recentActivityLines = await getRecentActivity(tools, GH_USERNAME, MAX_ACTIVITY_LINES).catch(
    (error) => {
      tools.log.error(error.message || 'Unexpected error getting recent activity!');
      return [];
    }
  );
  tools.log.success('Finished getting user recent activity:');

  let activityLinesAsText = recentActivityLines.join('\n');
  if (ACTIVITY_TO_HTML) {
    tools.log.info('Parsing activity markdown to HTML...');
    activityLinesAsText = removeOutterTags(mdToHtml(activityLinesAsText));
  }

  tools.log.info('Getting feed posts...');
  const feedData = await getFeed(FEED_URL, MAX_FEED_LINES).catch((error) => {
    tools.log.error(error.message || 'Unexpected error getting feed posts!');
    return [];
  });
  tools.log.success('Finished getting user feed posts:');

  let feedLinesAsText = feedData.join('\n');
  if (FEED_TO_HTML) {
    tools.log.info('Parsing feed posts markdown to HTML...');
    feedLinesAsText = removeOutterTags(mdToHtml(feedLinesAsText));
  }

  const readmeContent = fs
    .readFileSync('./TEMPLATE.md', 'utf-8')
    .split('\n')
    .map((line) => {
      const content = line.trim();
      switch (content) {
        case '<!--{{activity}}-->':
          return activityLinesAsText;
        case '<!--{{feed}}-->':
          return feedLinesAsText;
        default:
          return content;
      }
    });

  // Update README
  fs.writeFileSync('./README.md', readmeContent.join('\n'));
};

Toolkit.run(
  async (tools) => {
    try {
      await readmeAction(tools);

      // Commit to the remote repository
      try {
        await commitFile();
      } catch (err) {
        tools.log.debug('Something went wrong');
        return tools.exit.failure(err);
      }
    } catch (error) {
      core.setFailed(error.message);
      tools.exit.failure(error.message || 'Unexpected error!');
    }
    tools.exit.success('Pushed to remote repository');
  },
  {
    event: ['schedule', 'workflow_dispatch', 'push'],
    secrets: ['GITHUB_TOKEN'],
  }
);
