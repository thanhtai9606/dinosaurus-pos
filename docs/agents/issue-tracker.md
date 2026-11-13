# Issue tracker

Issues and specs for this repo primarily live on **GitLab**:

- **Project:** `https://gitlab.becamex.com.vn/devops/dinosaurus-pos`
- **Remote:** `origin` → same host/path (see `git remote -v`)

During setup you chose a custom tracker workflow. **Edit this file** if work is tracked outside GitLab (Jira, Linear, spreadsheets, etc.) and describe create/read/label conventions in prose below.

## Default: GitLab Issues (until overridden)

Use the GitLab UI or the [`glab`](https://gitlab.com/gitlab-org/cli) CLI when installed.

### Conventions (glab)

- **Create:** `glab issue create --title "..." --description "..."`
- **View:** `glab issue view <iid> --comments`
- **List:** `glab issue list`
- **Comment:** `glab issue note <iid> --message "..."`
- **Labels:** `glab issue update <iid> --label "..."`
- **Close:** `glab issue note` (reason) then `glab issue close <iid>`
- **MRs:** `glab mr create`, `glab mr view`, `glab mr note`, etc.

`glab` infers the project from `git remote` inside this clone.

### Without glab

Create and manage issues in the GitLab web UI on the project above. Agent skills should not assume CLI access until `glab` is installed and authenticated.

## Merge requests as a triage surface

**MRs as a request surface: no.**

## Skill hooks

- **Publish to the issue tracker:** create a GitLab issue (or follow the custom workflow documented above).
- **Fetch the relevant ticket:** `glab issue view <iid> --comments`, or open the issue in GitLab.

## Custom workflow (fill in if not GitLab)

<!-- Replace this section if you use another system -->

_Custom issue tracker: describe here how agents should create, list, and comment on work items._
