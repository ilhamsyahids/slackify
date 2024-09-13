import * as github from '@actions/github'
import nock from 'nock'
import * as fs from 'fs'
import * as path from 'path'
import { Block, Slack } from '../src/slack'
import { commonContext, repoUrl, authorUrl } from './common'
import assert from 'assert'

github.context.workflow = commonContext.workflow
github.context.ref = commonContext.ref
github.context.sha = commonContext.sha
github.context.payload = {
  issue: {
    number: commonContext.number
  },
  repository: {
    owner: {
      login: commonContext.owner
    },
    name: commonContext.repo
  }
}

describe('Base Field Tests', () => {
  function generateExpectedBaseField(
    actionUrl: string,
    eventBlockText: string
  ): object[] {
    return [
      {
        type: 'mrkdwn',
        text: `*repository*\n<${repoUrl}|${commonContext.owner}/${commonContext.repo}>`
      },
      {
        type: 'mrkdwn',
        text: `*ref*\n${commonContext.ref}`
      },
      {
        type: 'mrkdwn',
        text: `*event name*\n${eventBlockText}`
      },
      {
        type: 'mrkdwn',
        text: `*workflow*\n<${actionUrl}|${commonContext.workflow}>`
      }
    ]
  }

  test('With event link', () => {
    github.context.eventName = 'pull_request'
    const eventUrl = `${repoUrl}/pull/${commonContext.number}`
    const actionUrl = `${eventUrl}/checks`
    const expectedBaseField = generateExpectedBaseField(
      actionUrl,
      `<${eventUrl}|${github.context.eventName}>`
    )
    expect(Block.getBaseField()).toEqual(expectedBaseField)
  })

  test('Without event link', () => {
    github.context.eventName = 'push'
    const actionUrl = `${repoUrl}/commit/${commonContext.sha}/checks`
    const expectedBaseField = generateExpectedBaseField(
      actionUrl,
      github.context.eventName
    )
    expect(Block.getBaseField()).toEqual(expectedBaseField)
  })
})

describe('Commit Field Tests', () => {
  test('Commit field with author', () => {
    const context = {
      url: 'https://this.is.test',
      message: 'this is test',
      author: {
        url: authorUrl,
        name: commonContext.owner
      }
    }
    const expectedCommitField = [
      {
        type: 'mrkdwn',
        text: `*commit*\n<${context.url}|${context.message}>`
      },
      {
        type: 'mrkdwn',
        text: `*author*\n<${context.author.url}|${context.author.name}>`
      }
    ]

    expect(Block.getCommitField(context)).toEqual(expectedCommitField)
  })

  test('Commit field without author', () => {
    const context = {
      url: 'https://this.is.test',
      message: 'this is test'
    }
    const expectedCommitField = [
      {
        type: 'mrkdwn',
        text: `*commit*\n<${context.url}|${context.message}>`
      }
    ]
    expect(Block.getCommitField(context)).toEqual(expectedCommitField)
  })
})

describe('Payload Tests', () => {
  test('Mention needs always', () => {
    expect(Slack.isMention('always', 'test')).toBe(true)
  })

  test('Mention needs when failed', () => {
    expect(Slack.isMention('failure', 'failure')).toBe(true)
  })

  test('No mention because condition and actual status are different', () => {
    expect(Slack.isMention('success', 'failure')).toBe(false)
  })

  test.each([
    {
      context: {
        jobName: 'test',
        status: 'success',
        mention: 'bot',
        mentionCondition: 'always',
        commit: {
          message: 'Hello World\nYEAH!!!!!',
          url: 'https://this.is.test',
          author: {
            name: commonContext.owner,
            url: authorUrl
          }
        }
      }
    },
    {
      context: {
        jobName: 'test',
        status: 'success',
        mention: '',
        mentionCondition: 'always',
        commit: {
          message: 'Hello World',
          url: 'https://this.is.test',
          author: {
            name: commonContext.owner,
            url: authorUrl
          }
        }
      }
    }
  ])('Generate slack payload', ({ context }) => {
    github.context.eventName = 'pull_request'
    const eventUrl = `${repoUrl}/pull/${commonContext.number}`
    const status = context.status as keyof typeof Block.status
    const blockStatus = Block.status[status]

    let text = `${context.jobName} ${blockStatus['result']}`
    if (context.mention) {
      text = `<!${context.mention}> ${text}`
    }

    const expectedPayload = {
      text,
      attachments: [
        {
          color: blockStatus['color'],
          blocks: [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*repository*\n<${repoUrl}|${commonContext.owner}/${commonContext.repo}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*ref*\n${commonContext.ref}`
                },
                {
                  type: 'mrkdwn',
                  text: `*event name*\n<${eventUrl}|${github.context.eventName}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*workflow*\n<${eventUrl}/checks|${commonContext.workflow}>`
                },
                {
                  type: 'mrkdwn',
                  text: `*commit*\n<${context.commit.url}|${
                    context.commit.message.split('\n')[0]
                  }>`
                },
                {
                  type: 'mrkdwn',
                  text: `*author*\n<${context.commit.author.url}|${context.commit.author.name}>`
                }
              ]
            }
          ]
        }
      ],
      unfurl_links: true
    }

    expect(
      Slack.generatePayload(
        context.jobName,
        context.status,
        context.mention,
        context.mentionCondition,
        context.commit
      )
    ).toEqual(expectedPayload)
  })
})

describe('Post Message Tests', () => {
  const baseUrl = 'https://this.is.test'
  const options = {
    username: commonContext.owner,
    channel: 'test',
    icon_emoji: 'pray'
  }
  const payload = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'payload.json'), { encoding: 'utf8' })
  )

  test('Post successfully', async () => {
    nock(baseUrl).post('/success').reply(200, 'ok')

    const res = await Slack.notify(`${baseUrl}/success`, options, payload)
    expect(res).toBe(undefined)
  })

  test('Throw error', async () => {
    nock(baseUrl).post('/failure').reply(403, 'invalid_token')

    let error: Error | unknown
    try {
      await Slack.notify(`${baseUrl}/failure`, options, payload)
      assert.fail('Expected to throw an error')
    } catch (err: unknown) {
      error = err
    } finally {
      const message = error instanceof Error ? error.message : ''
      expect(message).toBe('Failed to post message to Slack')
    }
  })
})
