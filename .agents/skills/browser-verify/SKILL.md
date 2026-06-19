---
name: browser-verify
description: Use the built-in browser to verify a completed feature end-to-end across
  both user roles. Use after any phase that touches a user-facing flow.
---

# Browser Verification Workflow

Open the running app (http://localhost:3000) and run this sequence:

## As a regular user
1. Register a new account. Confirm redirect to the submit page.
2. Submit a batch of 2-3 images. Confirm each image gets an independent verdict with
   a full per-category breakdown visible in the UI.
3. On a flagged or blocked verdict, file an appeal. Confirm the UI shows pending status.
4. Attempt to file a second appeal on the same verdict — confirm it is blocked.
5. Attempt to appeal an approved verdict — confirm it is blocked.

## As admin (seeded admin account)
6. Open the appeals queue. Confirm the pending appeal from step 3 appears.
7. Accept the appeal. Confirm the verdict flips to approved in both the admin view
   and the user's history without a manual page refresh.
8. Navigate to a verdict that has no appeal at all. Use the direct override endpoint.
   Confirm it works independently of the appeal flow.
9. Change a policy setting (raise a threshold or disable a category). Submit a new image.
   Confirm the new verdict uses the updated policy. Open an old verdict and confirm its
   policySnapshot is completely unchanged.

## Report
For each step: pass or fail, what was observed, and if fail, the file most likely responsible.
