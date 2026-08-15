const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('create', () => {
  test('creates a task with defaults when only title is given', () => {
    const task = taskService.create({ title: 'Write tests' });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Write tests');
    expect(task.description).toBe('');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBeNull();
    expect(task.completedAt).toBeNull();
    expect(task.createdAt).toBeDefined();
  });

  test('creates a task with all fields provided', () => {
    const task = taskService.create({
      title: 'Ship feature',
      description: 'Add the assign endpoint',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-08-20T00:00:00.000Z',
    });

    expect(task.title).toBe('Ship feature');
    expect(task.description).toBe('Add the assign endpoint');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2026-08-20T00:00:00.000Z');
  });
});

describe('getAll', () => {
  test('returns an empty array when no tasks exist', () => {
    expect(taskService.getAll()).toEqual([]);
  });

  test('returns all created tasks', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });

    expect(taskService.getAll()).toHaveLength(2);
  });

  test('returns a copy, not the live internal array', () => {
    taskService.create({ title: 'Task 1' });
    const result = taskService.getAll();
    result.push({ id: 'fake', title: 'should not persist' });

    expect(taskService.getAll()).toHaveLength(1);
  });
});

describe('findById', () => {
  test('finds an existing task by id', () => {
    const created = taskService.create({ title: 'Find me' });
    const found = taskService.findById(created.id);

    expect(found).toEqual(created);
  });

  test('returns undefined for a non-existent id', () => {
    expect(taskService.findById('does-not-exist')).toBeUndefined();
  });
});

describe('getByStatus', () => {
  test('returns only tasks matching the given status', () => {
    taskService.create({ title: 'A', status: 'todo' });
    taskService.create({ title: 'B', status: 'done' });
    taskService.create({ title: 'C', status: 'todo' });

    const result = taskService.getByStatus('todo');

    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === 'todo')).toBe(true);
  });

  test('returns an empty array when no tasks match', () => {
    taskService.create({ title: 'A', status: 'todo' });

    expect(taskService.getByStatus('done')).toEqual([]);
  });
});

describe('getPaginated', () => {
  test('BUG: page=1 with limit=2 skips the first two tasks instead of returning them', () => {
    const t1 = taskService.create({ title: 'Task 1' });
    const t2 = taskService.create({ title: 'Task 2' });
    const t3 = taskService.create({ title: 'Task 3' });

    const result = taskService.getPaginated(1, 2);

   
    expect(result).toEqual([t3]);
  });

  test('page=0 with limit=2 returns the first two tasks', () => {
    const t1 = taskService.create({ title: 'Task 1' });
    const t2 = taskService.create({ title: 'Task 2' });
    taskService.create({ title: 'Task 3' });

    const result = taskService.getPaginated(0, 2);

    expect(result).toEqual([t1, t2]);
  });

  test('returns an empty array when offset exceeds the number of tasks', () => {
    taskService.create({ title: 'Only task' });

    expect(taskService.getPaginated(5, 10)).toEqual([]);
  });
});

describe('getStats', () => {
  test('returns zero counts when there are no tasks', () => {
    expect(taskService.getStats()).toEqual({
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
    });
  });

  test('counts tasks correctly by status', () => {
    taskService.create({ title: 'A', status: 'todo' });
    taskService.create({ title: 'B', status: 'todo' });
    taskService.create({ title: 'C', status: 'in_progress' });
    taskService.create({ title: 'D', status: 'done' });

    const stats = taskService.getStats();

    expect(stats.todo).toBe(2);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
  });

  test('counts a task with a past dueDate that is not done as overdue', () => {
    taskService.create({
      title: 'Late task',
      status: 'todo',
      dueDate: '2020-01-01T00:00:00.000Z',
    });

    expect(taskService.getStats().overdue).toBe(1);
  });

  test('does not count a done task with a past dueDate as overdue', () => {
    taskService.create({
      title: 'Finished late task',
      status: 'done',
      dueDate: '2020-01-01T00:00:00.000Z',
    });

    expect(taskService.getStats().overdue).toBe(0);
  });

  test('does not count a task with a future dueDate as overdue', () => {
    taskService.create({
      title: 'Future task',
      status: 'todo',
      dueDate: '2099-01-01T00:00:00.000Z',
    });

    expect(taskService.getStats().overdue).toBe(0);
  });
});

describe('update', () => {
  test('updates fields on an existing task', () => {
    const created = taskService.create({ title: 'Original' });
    const updated = taskService.update(created.id, { title: 'Updated', priority: 'high' });

    expect(updated.title).toBe('Updated');
    expect(updated.priority).toBe('high');
    expect(updated.id).toBe(created.id);
  });

  test('returns null when updating a non-existent task', () => {
    expect(taskService.update('does-not-exist', { title: 'X' })).toBeNull();
  });
});

describe('remove', () => {
  test('removes an existing task and returns true', () => {
    const created = taskService.create({ title: 'Delete me' });

    expect(taskService.remove(created.id)).toBe(true);
    expect(taskService.findById(created.id)).toBeUndefined();
  });

  test('returns false when removing a non-existent task', () => {
    expect(taskService.remove('does-not-exist')).toBe(false);
  });
});

describe('completeTask', () => {
  test('marks a task as done and sets completedAt', () => {
    const created = taskService.create({ title: 'Finish me', priority: 'high' });
    const completed = taskService.completeTask(created.id);

    expect(completed.status).toBe('done');
    expect(completed.completedAt).not.toBeNull();
  });

  test('BUG: completeTask resets priority to medium even if it was high', () => {
    const created = taskService.create({ title: 'Important task', priority: 'high' });
    const completed = taskService.completeTask(created.id);

    expect(completed.priority).toBe('medium');
  });

  test('returns null when completing a non-existent task', () => {
    expect(taskService.completeTask('does-not-exist')).toBeNull();
  });
});