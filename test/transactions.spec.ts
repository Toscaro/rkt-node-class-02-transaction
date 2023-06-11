import { afterAll, beforeAll, expect, test, describe, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('Post transactions with new transaction return 201', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit',
    })

    expect(response.statusCode).toEqual(201)
  })

  test('Get transaction list WITH valid session_id RETURN valid transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    expect(listTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    ])
  })

  test('Get transaction WITH specific ID AND valid session_id RETURN valid transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New test transaction',
        amount: 15000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    const { id } = listTransactionResponse.body.transactions[0]

    const transactionResponse = await request(app.server)
      .get(`/transactions/${id}`)
      .set('Cookie', cookies)

    expect(transactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New test transaction',
        amount: 15000,
      }),
    )
  })

  test('Get transaction summary WITH valid session_id RETURN summary response', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New test transaction',
        amount: 10000.5,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'New 2 test transaction',
        amount: 2000.2,
        type: 'debit',
      })

    const transactionResponse = await request(app.server)
      .get(`/transactions/summary`)
      .set('Cookie', cookies)

    expect(transactionResponse.body.summary).toEqual({
      amount: 8000.3,
    })
  })
})
