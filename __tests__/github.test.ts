import { context, getOctokit } from '@actions/github'
import { getWorkflowUrls, getCommit } from '../src/github'
import { commonContext, repoUrl, authorUrl } from './common'

// Mock the GitHub context
jest.mock('@actions/github', () => {
  const actualGithub = jest.requireActual('@actions/github')
  return {
    ...actualGithub,
    getOctokit: jest.fn()
  }
})

context.sha = commonContext.sha
context.workflow = commonContext.workflow
context.ref = commonContext.ref
context.payload = {
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

describe('Workflow URL Tests', () => {
  test('Pull Request event', () => {
    context.eventName = 'pull_request'
    const expectedEventUrl = `${repoUrl}/pull/${commonContext.number}`
    const expectedUrls = {
      repo: repoUrl,
      event: expectedEventUrl,
      action: `${expectedEventUrl}/checks`
    }
    expect(getWorkflowUrls()).toEqual(expectedUrls)
  })

  test('Push event', () => {
    context.eventName = 'commit'
    const expectedUrls = {
      repo: repoUrl,
      action: `${repoUrl}/commit/${commonContext.sha}/checks`
    }
    expect(getWorkflowUrls()).toEqual(expectedUrls)
  })
})

describe('getCommit', () => {
  const mockToken = 'mock-token'
  const mockCommitData = {
    commit: {
      message: 'Mock commit message'
    },
    html_url: repoUrl,
    author: {
      login: commonContext.owner,
      html_url: authorUrl
    }
  }

  beforeEach(() => {
    process.env.GITHUB_HEAD_REF = ''

    // Set up the context and mock implementation
    ;(getOctokit as jest.Mock).mockReturnValue({
      rest: {
        repos: {
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData })
        }
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return the correct commit context', async () => {
    const result = await getCommit(mockToken)

    expect(result).toEqual({
      message: 'Mock commit message',
      url: repoUrl,
      author: {
        name: commonContext.owner,
        url: authorUrl
      }
    })
  })

  it('should return the correct commit context with GITHUB_HEAD_REF', async () => {
    process.env.GITHUB_HEAD_REF = 'refs/heads/test-branch'
    const result = await getCommit(mockToken)

    expect(result).toEqual({
      message: 'Mock commit message',
      url: repoUrl,
      author: {
        name: commonContext.owner,
        url: authorUrl
      }
    })
  })

  it('should handle commits without an author', async () => {
    const commitDataWithoutAuthor = {
      commit: {
        message: 'Mock commit message without author'
      },
      html_url: repoUrl,
      author: null
    }

    ;(getOctokit as jest.Mock).mockReturnValue({
      rest: {
        repos: {
          getCommit: jest
            .fn()
            .mockResolvedValue({ data: commitDataWithoutAuthor })
        }
      }
    })

    const result = await getCommit(mockToken)

    expect(result).toEqual({
      message: 'Mock commit message without author',
      url: repoUrl
    })
    expect(result.author).toBeUndefined()
  })
})
