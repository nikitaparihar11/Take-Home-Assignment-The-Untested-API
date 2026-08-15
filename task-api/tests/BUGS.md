# Bug Report

## Bug 1: `getPaginated` off-by-one in page numbering

**Expected behavior:** Calling `GET /tasks?page=1&limit=10` should return the *first* page of results (the first 10 tasks).

**Actual behavior:** It skips the first `limit` results. Because `offset = page * limit`, `page=1` with `limit=10` returns tasks 11–20, not 1–10. To actually get the first page, a caller has to pass `page=0`, which is unintuitive — most APIs treat page 1 as the first page.

**How I discovered it:** Writing a test that created 3 tasks and called `getPaginated(1, 2)` expecting the first two tasks back — it returned only the third instead.

**Suggested fix:** Change the offset calculation to `offset = (page - 1) * limit`, and treat `page=1` as the default/first page instead of `page=0`.


## Bug 2: `completeTask` silently resets `priority` to `medium`

**Expected behavior:** Marking a task complete (`PATCH /tasks/:id/complete`) should only change `status` to `done` and set `completedAt`. The task's `priority` shouldn't change.

**Actual behavior:** `completeTask` in `taskService.js` hardcodes `priority: 'medium'` on every completion, overwriting the original priority. A `high`-priority task becomes `medium`-priority the moment it's marked done.

**How I discovered it:** Writing a test that created a task with `priority: 'high'`, completed it, and checked the result — the priority came back as `'medium'` instead of `'high'`.

**Suggested fix:** Remove the `priority: 'medium'` line from the `completeTask` function so the existing priority is preserved via the spread (`...task`).