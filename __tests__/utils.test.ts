import * as utils from '../src/utils'

describe('Check Validitiy', () => {
  test('Valid validateStatus', () => {
    for (const status of ['success', 'failure', 'cancelled']) {
      expect(utils.validateStatus(status)).toBe(status)
    }
  })

  test('Invalid validateStatus', () => {
    expect(() => utils.validateStatus('invalid')).toThrow(
      'Invalid type parameter'
    )
  })

  test('True isValidCondition', () => {
    for (const status of ['success', 'failure', 'cancelled', 'always']) {
      expect(utils.isValidCondition(status)).toBe(true)
    }
  })

  test('False isValidCondition', () => {
    expect(utils.isValidCondition('invalid')).toBe(false)
  })
})
