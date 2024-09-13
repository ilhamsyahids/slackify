/* eslint-disable @typescript-eslint/unbound-method */

import * as core from '@actions/core'
import { IncomingWebhookDefaultArguments } from '@slack/webhook'
import * as github from '../src/github'
import { Slack } from '../src/slack'
import { run } from '../src/main'
import { authorUrl } from './common'

jest.mock('@actions/core')
jest.mock('../src/github')
jest.mock('../src/slack')

describe('run function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call Slack.notify with correct parameters', async () => {
    const coreGetInputMock = core.getInput as jest.Mock
    coreGetInputMock.mockImplementation((name: string) => {
      if (name === 'url') return 'https://webhook.com'
      if (name === 'job_name') return 'test-job'
      if (name === 'type') return 'success'
      if (name === 'mention') return ''
      if (name === 'mention_if') return ''
      if (name === 'username') return 'test-user'
      if (name === 'channel') return '#test-channel'
      if (name === 'icon_emoji') return ':smile:'
      if (name === 'commit') return 'true'
      return ''
    })
    const githubGetCommitMock = github.getCommit as jest.Mock
    githubGetCommitMock.mockResolvedValue({
      message: 'Test commit message',
      url: authorUrl
    })

    const slackGenPayloadMock = Slack.generatePayload as jest.Mock
    slackGenPayloadMock.mockReturnValue({
      text: 'Test message'
    })

    const slackNotifyMock = Slack.notify as jest.Mock
    slackNotifyMock.mockResolvedValue(undefined)

    await run()

    expect(Slack.notify).toHaveBeenCalledWith(
      'https://webhook.com',
      {
        username: 'test-user',
        channel: '#test-channel',
        icon_emoji: ':smile:'
      } as IncomingWebhookDefaultArguments,
      { text: 'Test message' }
    )

    expect(core.setOutput).toHaveBeenCalledWith('payload', {
      text: 'Test message'
    })
  })

  it('should handle invalid mention condition', async () => {
    const invalidMentionCondition = 'invalidCondition'

    const coreGetInputMock = core.getInput as jest.Mock
    coreGetInputMock.mockImplementation((name: string) => {
      if (name === 'url') return 'https://webhook.com'
      if (name === 'job_name') return 'test-job'
      if (name === 'type') return 'success'
      if (name === 'mention') return 'someUser'
      if (name === 'mention_if') return invalidMentionCondition
      if (name === 'username') return 'test-user'
      if (name === 'channel') return '#test-channel'
      if (name === 'icon_emoji') return ':smile:'
      if (name === 'commit') return 'false'
      return ''
    })

    const githubGetCommitMock = github.getCommit as jest.Mock
    githubGetCommitMock.mockResolvedValue(undefined)

    const slackGenPayloadMock = Slack.generatePayload as jest.Mock
    slackGenPayloadMock.mockReturnValue({
      text: 'Test message'
    })

    const slackNotifyMock = Slack.notify as jest.Mock
    slackNotifyMock.mockResolvedValue(undefined)

    const coreWarningMock = core.warning as jest.Mock
    coreWarningMock.mockImplementation(() => {})

    await run()

    expect(core.warning).toHaveBeenCalledWith(`Ignore slack message mention:
      mention_if: ${invalidMentionCondition.toLowerCase()} is invalid
      `)

    expect(Slack.notify).toHaveBeenCalled()
  })

  it('should throw an error if url is not provided', async () => {
    const coreGetInputMock = core.getInput as jest.Mock
    coreGetInputMock.mockImplementation((name: string) => {
      if (name === 'url') {
        return ''
      } else if (name === 'type') {
        return 'success'
      } else return 'someValue'
    })

    await run()

    expect(core.setFailed)
      .toHaveBeenCalledWith(`Missing Slack Incoming Webhooks URL.
      Please specify the "url" key in "with" section.
      `)
  })
})
