const urlPrefix = 'https://github.com';

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
    return `🍴 Forked ${formatRepoNameToUrl(
      item.payload.forkee.full_name
    )} from ${formatRepoNameToUrl(item.repo.name)}`;
  },
  ReleaseEvent: (item) => {
    return `📦 Released "${formatReleaseTag(
      item.payload.release,
      item.repo.name
    )}" in ${formatRepoNameToUrl(item.repo.name)}`;
  },
};

const getRecentActivity = async (tools, username, maxLines = 5) => {
  if (!tools) {
    console.error('No tools to run app!');
    return;
  }
  if (!username) {
    console.error('No username to get activity!');
    return;
  }
  const events = await tools.github.activity.listPublicEventsForUser({
    username: username,
    per_page: 100,
  });
  const content = events.data
    .filter((event) => serializers.hasOwnProperty(event.type))
    .slice(0, maxLines)
    .map((item) => serializers[item.type](item));
  return content;
};

module.exports = getRecentActivity;
