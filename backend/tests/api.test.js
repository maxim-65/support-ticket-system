const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../server');
const pool = require('../db');

const password = 'TestPassword123!';
const agentPassword = process.env.TEST_AGENT_PASSWORD;
const agentRegistrationPassword = 'AgentTestPassword123!';
const testPrefix = `jest-${Date.now()}`;
const usersToClean = [];
const ticketsToClean = [];

let customerA;
let customerB;
let customerAToken;
let customerBToken;
let agentToken;
let ticketId;

async function registerCustomer(name, email) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });

  expect(response.status).toBe(201);
  usersToClean.push(response.body.id);
  return response.body;
}

async function login(email, loginPassword = password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: loginPassword });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  return response.body.token;
}

describe('Support Ticket API', () => {
  beforeAll(async () => {
    if (!agentPassword) {
      throw new Error('TEST_AGENT_PASSWORD must be configured for integration tests');
    }

    customerA = await registerCustomer(
      'Jest Customer A',
      `${testPrefix}-a@example.com`
    );
    customerB = await registerCustomer(
      'Jest Customer B',
      `${testPrefix}-b@example.com`
    );
    customerAToken = await login(customerA.email);
    customerBToken = await login(customerB.email);
    agentToken = await login('ravi.agent@example.com', agentPassword);
  });

  afterAll(async () => {
    if (ticketsToClean.length > 0) {
      await pool.query(
        'DELETE FROM ticket_comments WHERE ticket_id IN (?)',
        [ticketsToClean]
      );
      await pool.query('DELETE FROM tickets WHERE id IN (?)', [ticketsToClean]);
    }

    if (usersToClean.length > 0) {
      await pool.query('DELETE FROM users WHERE id IN (?)', [usersToClean]);
    }

    await pool.end();
  });

  test('valid customer login returns a JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: customerA.email, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: customerA.id,
      role: 'customer',
    });
    expect(response.body).not.toHaveProperty('password_hash');
  });

  test('support-agent registration creates an agent without exposing a hash', async () => {
    const response = await request(app)
      .post('/api/auth/register/agent')
      .send({
        name: 'Jest Support Agent',
        email: `${testPrefix}-agent@example.com`,
        password: agentRegistrationPassword,
        confirmPassword: agentRegistrationPassword,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Jest Support Agent',
      email: `${testPrefix}-agent@example.com`,
      role: 'agent',
    });
    expect(response.body).not.toHaveProperty('password_hash');
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [response.body.id]
    );
    expect(users[0].password_hash).not.toBe(agentRegistrationPassword);
    await expect(bcrypt.compare(agentRegistrationPassword, users[0].password_hash))
      .resolves.toBe(true);
    usersToClean.push(response.body.id);
  });

  test('support-agent registration rejects duplicate email', async () => {
    const response = await request(app)
      .post('/api/auth/register/agent')
      .send({
        name: 'Duplicate Support Agent',
        email: `${testPrefix}-agent@example.com`,
        password: agentRegistrationPassword,
        confirmPassword: agentRegistrationPassword,
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'An account with that email already exists',
    });
  });

  test('support-agent registration validates password input', async () => {
    const response = await request(app)
      .post('/api/auth/register/agent')
      .send({
        name: 'Invalid Support Agent',
        email: `${testPrefix}-invalid@example.com`,
        password: 'short',
        confirmPassword: 'different',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Password must be at least 8 characters long',
    });
  });

  test('new support agent can log in and access agent functionality', async () => {
    const email = `${testPrefix}-login-agent@example.com`;
    const registration = await request(app)
      .post('/api/auth/register/agent')
      .send({
        name: 'Login Support Agent',
        email,
        password: agentRegistrationPassword,
        confirmPassword: agentRegistrationPassword,
      });

    expect(registration.status).toBe(201);
    usersToClean.push(registration.body.id);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password: agentRegistrationPassword });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.role).toBe('agent');

    const ticketsResponse = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(ticketsResponse.status).toBe(200);
  });

  test('customer registration remains customer-only when role is supplied', async () => {
    const email = `${testPrefix}-customer-role@example.com`;
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Role Test Customer',
        email,
        password,
        role: 'agent',
      });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe('customer');
    usersToClean.push(response.body.id);
  });

  test('invalid login password returns 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: customerA.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid email or password' });
  });

  test('unauthorized ticket request returns 401', async () => {
    const response = await request(app).get('/api/tickets');

    expect(response.status).toBe(401);
  });

  test('customer cannot access agent-only users endpoint', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(response.status).toBe(403);
  });

  test('customer can create a ticket owned by the authenticated user', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        subject: 'Jest ticket',
        description: 'Created by the automated test suite',
        priority: 'high',
        user_id: customerB.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      subject: 'Jest ticket',
      priority: 'high',
      status: 'open',
      user_id: customerA.id,
    });
    expect(response.body.user_id).not.toBe(customerB.id);

    ticketId = response.body.id;
    ticketsToClean.push(ticketId);
  });

  test('customer cannot access another customer ticket', async () => {
    const response = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${customerBToken}`);

    expect(response.status).toBe(403);
  });

  test('agent can update ticket status and priority', async () => {
    const response = await request(app)
      .put(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'in_progress', priority: 'low', assigned_to: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticketId,
      status: 'in_progress',
      priority: 'low',
      assigned_to: 2,
    });
  });

  test('customer cannot perform an agent-only update', async () => {
    const response = await request(app)
      .put(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ status: 'closed' });

    expect(response.status).toBe(403);
  });

  test('invalid ticket ID returns 404', async () => {
    const response = await request(app)
      .get('/api/tickets/not-a-ticket-id')
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(response.status).toBe(404);
  });

  test('customer cannot comment on another customer ticket', async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ comment: 'This must be rejected' });

    expect(response.status).toBe(403);
  });

  test('ticket owner can create a comment as the authenticated user', async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        comment: 'This comment was created by Jest',
        user_id: customerB.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      ticket_id: ticketId,
      user_id: customerA.id,
      comment: 'This comment was created by Jest',
    });
    expect(response.body.user_id).not.toBe(customerB.id);
  });
});
