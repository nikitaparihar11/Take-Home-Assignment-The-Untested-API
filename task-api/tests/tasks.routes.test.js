const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('POST /tasks', () => {
  test('creates a task and returns 201', async () => {
    const res = await request(app).post('/tasks').send({ title: 'New task' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
    expect(res.body.id).toBeDefined();
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({ description: 'no title here' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  test('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Bad status', status: 'not_a_real_status' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });
});

describe('GET /tasks', () => {
  test('returns an empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B' });

    const res = await request(app).get('/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('filters tasks by status', async () => {
    await request(app).post('/tasks').send({ title: 'A', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });

    const res = await request(app).get('/tasks?status=done');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('B');
  });
});

describe('GET /tasks/stats', () => {
  test('returns counts and overdue total', async () => {
    await request(app).post('/tasks').send({ title: 'A', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });

    const res = await request(app).get('/tasks/stats');

    expect(res.status).toBe(200);
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
    expect(res.body.overdue).toBe(0);
  });
});

describe('PUT /tasks/:id', () => {
  test('updates an existing task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Original' });

    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
  });

  test('returns 404 when updating a non-existent task', async () => {
    const res = await request(app).put('/tasks/does-not-exist').send({ title: 'Whatever' });

    expect(res.status).toBe(404);
  });

  test('returns 400 when the update payload is invalid', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Original' });

    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes an existing task and returns 204', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Delete me' });

    const res = await request(app).delete(`/tasks/${created.body.id}`);

    expect(res.status).toBe(204);

    const getRes = await request(app).get('/tasks');
    expect(getRes.body).toHaveLength(0);
  });

  test('returns 404 when deleting a non-existent task', async () => {
    const res = await request(app).delete('/tasks/does-not-exist');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /tasks/:id/complete', () => {
  test('marks a task as done', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Finish me' });

    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  test('returns 404 when completing a non-existent task', async () => {
    const res = await request(app).patch('/tasks/does-not-exist/complete');

    expect(res.status).toBe(404);
  });
});