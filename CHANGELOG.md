# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2024-09-14

### Fixed

- Missing mention condition when `mention_if` invalid  [#7].
- Handle Slack throw error when sending message [#8].

### Added

- Add unit test for all existing functions [#8].
- Add coverage information to the project [#5].
- Update README.md with new example and documentation [#4] [#8].
- Add proper project description and metadata [#8].

### Changed

- Default token to `${{ github.token }}` [#4].

### Removed

- Remove `SLACK_WEBHOOK` environment usage, use `url` input on `with` instead [#4].

## [1.0.0] - 2024-09-05

First release of `slackify` action, a GitHub Action to send a notification to Slack [#2].

### Added

- Notify result of GitHub Actions job to Slack Webhook, including detail of github context and commit information.
- Mention to channel members with condition.

[#8]: https://github.com/ilhamsyahids/slackify/pull/8
[#7]: https://github.com/ilhamsyahids/slackify/pull/7
[#5]: https://github.com/ilhamsyahids/slackify/pull/5
[#4]: https://github.com/ilhamsyahids/slackify/pull/4
[#2]: https://github.com/ilhamsyahids/slackify/pull/2

[Unreleased]: https://github.com/ilhamsyahids/slackify/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/ilhamsyahids/slackify/releases/tag/v1.1.0
[1.0.0]: https://github.com/ilhamsyahids/slackify/releases/tag/v1.0.0
