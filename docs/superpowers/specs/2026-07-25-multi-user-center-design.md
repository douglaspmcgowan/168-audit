# 168 Audit Multi-User Center Design

**Date:** 2026-07-25  
**Status:** Approved for implementation  
**Product source:** `PRODUCT.md`  
**Design source:** `DESIGN.md`

## Purpose

Add an optional account layer that lets a person keep audit weeks across devices, create or join a private group, and deliberately share selected weeks with that group. The existing browser-local audit remains fully usable while signed out.

The center should feel like a quiet extension of the audit: a compact home for the person’s weeks, groups, and sharing state. It should avoid surveillance cues, public profiles, social ranking, and automatic disclosure.

## Product Decisions

1. **Local use remains complete.** Signing in is optional. A signed-out person can finish, save, export, import, and revisit an audit in the same browser.
2. **Cloud sync is explicit on first connection.** After sign-in, the person chooses which local profile to upload. Existing local work is never silently replaced.
3. **A cloud week is private by default.** Group membership alone reveals no audit week.
4. **Sharing is per week and per group.** The week owner creates or removes a `group_week_shares` record. Removing a share revokes future reads immediately.
5. **Members can read shared weeks.** Members cannot edit, re-share, or delete another person’s week.
6. **Groups are private.** A person discovers a group through a valid invite token. Search and public directories are outside this release.
7. **The roster uses display names.** Email addresses stay within Supabase Auth and are absent from application tables and group queries.
8. **Owners control durable group state.** Owners can rename or delete a group, change roles, transfer ownership, and remove any non-owner. Admins can rename, invite, and remove members. Members can leave.

## Information Architecture

The primary audit navigation remains Plan, Compare, Reflect, and History. An account control opens the multi-user center without adding another permanent workflow step.

The center has three compact views:

- **My weeks:** signed-in cloud weeks, sync state, open action, and share controls.
- **Groups:** groups the person belongs to, role, member count, and create/join actions.
- **Group detail:** roster, invitations for managers, and a chronological list of explicitly shared weeks.

On mobile these views form one drill-in stack with a persistent back action. On wider screens the group list and selected group can use a two-column master/detail layout.

## Core Journeys

### Sign in and connect local work

1. The person opens the account control and chooses Sign in.
2. Supabase Auth sends a magic link or completes the configured OAuth flow.
3. On return, the app restores the local audit immediately and fetches the cloud account in the background.
4. If cloud weeks are empty and local profiles exist, a connection panel offers each local profile with an **Upload this audit** action.
5. If matching local and cloud records have both changed, the app shows modified times and offers **Keep this browser copy** or **Use cloud copy**. Both choices create a local recovery copy before replacement.

### Create and invite

1. The person creates a group with a concise name.
2. The creator becomes its owner through a database trigger in the same transaction.
3. An owner or admin creates an invitation with an expiry and allowed-use count.
4. The server returns the raw invite token once. The database stores only its SHA-256 digest.
5. The UI builds a join URL and labels its expiry. Revocation is immediate.

### Join

1. An authenticated person opens a join URL or pastes its token.
2. A single RPC validates token length, digest, expiry, revocation, and remaining uses under a row lock.
3. The RPC adds a member role once and increments use count only for a new membership.
4. The person lands in group detail. No week data appears until a member shares a week.

### Share and revoke

1. A week owner opens its sharing menu.
2. The menu lists only groups the owner belongs to.
3. Selecting a group creates the explicit share row.
4. The group feed identifies the week owner, title, week date, and last update.
5. Removing the selection deletes the share row and the week disappears for group members on their next query.

## Cloud Document Contract

`audit_weeks.audit_document` is a versioned JSON object:

```json
{
  "schemaVersion": 1,
  "rows": [
    {
      "id": "stable-row-id",
      "category": "Work",
      "subcategory": "Mandatory work",
      "ideal": 40,
      "actual": 42,
      "notes": ""
    }
  ],
  "reflections": {},
  "snapshots": []
}
```

The browser validates and bounds this object using the same rules as JSON import before rendering or persisting it. The database enforces that the root is an object; domain validation stays in the client so local and cloud imports share one implementation.

## Data and Authorization Model

| Table | Purpose | Read boundary | Write boundary |
|---|---|---|---|
| `profiles` | Display name only | Self and fellow group members | Self display name |
| `audit_weeks` | One owner’s versioned audit document | Owner or member of an explicitly shared group | Owner |
| `groups` | Private group identity | Members | Managers rename; owner deletes |
| `group_memberships` | Roster and role | Fellow members | Checked RPCs and owner trigger |
| `group_invites` | Hashed invitations | Managers | Checked RPCs |
| `group_week_shares` | Explicit week-to-group disclosure | Group members and week owner | Week owner who belongs to group |

Every table has RLS. Helper functions that bypass membership-table RLS use `security definer`, pin `search_path`, return only booleans, and expose execution only to `authenticated`. Role and membership mutation RPCs repeat authorization inside the function.

## Synchronization

- Local state renders first and remains the recovery layer.
- Cloud writes are debounced after local save and carry the week UUID.
- The UI shows `Saved on this device`, `Syncing`, `Synced`, `Offline`, or `Needs attention`.
- Failed writes remain pending locally and retry on reconnect or the next signed-in session.
- A cloud response with a newer `updated_at` than the local sync base pauses automatic overwrite and opens conflict resolution.
- Signing out clears the Supabase session cache through the client library while preserving the person’s browser-local audits.
- Deleting an account and its Auth user cascades profiles, owned weeks, memberships, invitations created by that user, and owned groups.

## States and Recovery

- **Cloud unavailable:** keep editing locally; communicate that sync will retry.
- **Expired or revoked invite:** show a neutral unavailable message without revealing group identity.
- **Removed member:** remove the group and its shared data from the local cloud cache.
- **Deleted or unshared week:** remove it from group views; never retain its audit document in shared caches.
- **Permission failure:** refresh session and group membership once, then show a recovery action.
- **Malformed cloud document:** quarantine it from rendering and offer export of the local recovery copy.

## Accessibility and Responsive Behavior

- Center views use headings, landmarks, lists, and native buttons; tabs implement full tab keyboard behavior if tabs are retained.
- Role and sync status use text alongside color.
- Dialog focus enters the first meaningful field, remains contained, returns to its launcher, and closes with Escape.
- Invite tokens and URLs have explicit accessible copy controls and live confirmation.
- Mobile controls remain at least 44 CSS pixels. Long group names, display names, and translated strings wrap without horizontal scrolling at 320px.
- Reduced-motion mode removes panel translation and uses an immediate view change.

## Security and Privacy Requirements

- The browser receives only the Supabase project URL and publishable/anonymous client key.
- Service-role credentials never enter browser code, repository files, logs, tests, or screenshots.
- Invite tokens appear only at creation and in the recipient’s join request. Stored records contain digests.
- Direct DML grants are removed from memberships and invites.
- Owner columns cannot be assigned or changed through direct authenticated table writes.
- Group membership never grants audit visibility without an explicit active share.
- Removing membership, deleting a group, or deleting a share revokes reads through live RLS evaluation.

## Acceptance Criteria

- A signed-out person completes the full audit with cloud configuration absent or unreachable.
- A person signs in, uploads a local audit, edits on a second browser context, and receives the updated week.
- A person creates a group, generates an invite, and another account joins once.
- An invalid, expired, exhausted, or revoked invite cannot create membership.
- A group member sees a week only after its owner shares it with that group.
- A member in another group and an unrelated authenticated account cannot read the week or infer its title.
- A shared-week reader cannot update, delete, or re-share that week.
- Unsharing or removing the reader revokes access on the next request.
- Owner, admin, and member actions match the role matrix.
- All center journeys work with keyboard-only input, screen-reader semantics, 200% zoom, reduced motion, and viewports from 320px through wide desktop.

