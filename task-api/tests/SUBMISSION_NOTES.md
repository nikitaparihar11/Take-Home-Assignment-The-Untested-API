## Submission Notes

**What surprised me in the codebase:**
- The pagination logic (`getPaginated`) treats `page=1` as skipping the first page rather than returning it, which isn't how most APIs number pages
- `completeTask` was silently resetting `priority` to `medium` regardless of the task's original priority an easy one to miss without tests
