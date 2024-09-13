import * as core from '@actions/core'
import { IncomingWebhookDefaultArguments } from '@slack/webhook'
import * as github from './github'
import { validateStatus, isValidCondition } from './utils'
import { Slack } from './slack'

export async function run(): Promise<void> {
  const status = validateStatus(
    core.getInput('type', { required: true }).toLowerCase()
  )
  const jobName = core.getInput('job_name', { required: true })
  const url = core.getInput('url')
  let mention = core.getInput('mention')
  let mentionCondition = core.getInput('mention_if').toLowerCase()
  const slackOptions: IncomingWebhookDefaultArguments = {
    username: core.getInput('username'),
    channel: core.getInput('channel'),
    icon_emoji: core.getInput('icon_emoji')
  }
  const commitFlag = core.getInput('commit') === 'true'
  const token = core.getInput('token') || core.getInput('github_token')

  if (mention && !isValidCondition(mentionCondition)) {
    core.warning(`Ignore slack message mention:
      mention_if: ${mentionCondition} is invalid
      `)
    mention = ''
    mentionCondition = ''
  }

  if (!url) {
    throw new Error(`Missing Slack Incoming Webhooks URL.
      Please specify the "url" key in "with" section.
      `)
  }

  let commit: github.CommitContext | undefined
  if (commitFlag) {
    commit = await github.getCommit(token)
  }

  const payload = Slack.generatePayload(
    jobName,
    status,
    mention,
    mentionCondition,
    commit
  )
  core.debug(`Generated payload for slack: ${JSON.stringify(payload)}`)

  await Slack.notify(url, slackOptions, payload)
  core.info('Post message to Slack')

  // Set payload as output
  core.setOutput('payload', payload)
}

try {
  run()
} catch (err) {
  const message = (err as Error).message
  core.setFailed(message)
}
