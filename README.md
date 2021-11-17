# Profile Readme

This is a GitHub action I created for my [GitHub profile's README](https://github.com/jahirfiquitiva/jahirfiquitiva)

It gets the user's recent activity and the most recent posts from an RSS feed.

## Credits

This project is heavily based on @jamesgeorge007 [GitHub Activity Readme](https://github.com/jamesgeorge007/github-activity-readme) and @actions-js [Profile Readme](https://github.com/actions-js/profile-readme)

Full credits belong to them. I just adapted the code to match my needs

---

## Instructions

- Create a file named `TEMPLATE.md` with the base content you want.
- *(Optional)* Add the comment `<!--{{activity}}-->` within `TEMPLATE.md`. You can find an example [here](https://github.com/jahirfiquitiva/profile-readme/blob/main/TEMPLATE.md).
- *(Optional)* Add the comment `<!--{{feed}}-->` within `TEMPLATE.md`. You can find an example [here](https://github.com/jahirfiquitiva/profile-readme/blob/main/TEMPLATE.md).

- It's the time to create a workflow file.

`.github/workflows/update-readme.yml`

```yml
name: Update README

on:
  workflow_dispatch:
  push:
  schedule:
    - cron: '0 0/4 * * *'

jobs:
  update_readme:
    runs-on: ubuntu-latest
    name: Job to update readme
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Update readme with activity and feed
        uses: jahirfiquitiva/profile-readme@main
        id: readme
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          FEED_URL: 'https://hnrss.org/frontpage'
          FEED_TO_HTML: true
          MAX_FEED_LINES: 4
          ACTIVITY_TO_HTML: true
```

The above job runs every four hours, you can change it as you wish based on the [cron syntax](https://jasonet.co/posts/scheduled-actions/#the-cron-syntax).

Please note that only those public events that belong to the following list show up:-

- `IssueEvent`
- `IssueCommentEvent`
- `PullRequestEvent`
- `ForkEvent`
- `ReleaseEvent`

You can find an example [here](https://github.com/jahirfiquitiva/jahirfiquitiva/blob/master/.github/workflows/main.yml).

### Override defaults

Use the following `input params` to customize it for your use case:-

| Input Param | Default Value | Description |
|--------|--------|--------|
| `COMMIT_MSG` | :sparkles: Update README with the recent activity and blog posts | Commit message used while committing to the repo |
| `MAX_ACTIVITY_LINES` | 5 | The maximum number of lines populated in your readme file |
| `ACTIVITY_TO_HTML` | false | Whether to convert activity markdown to html |
| `FEED_URL` |   | The RSS url to get feed from |
| `MAX_FEED_LINES` | 5 | The maximum number of lines for feed populated in your readme file |
| `FEED_TO_HTML` | false | Whether to convert blogs markdown to html |
