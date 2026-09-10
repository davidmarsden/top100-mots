# Shared Voting V2 Awards adapter

This branch introduces the first Awards client for the shared Top 100 voting service without replacing the existing S27/legacy voting screen yet.

## Test entry point

Open:

`https://awards.smtop100.blog/?shared-voting-v2=1`

The normal Awards homepage remains on the legacy voting implementation until the adapter has been smoke-tested.

## Identity and ballot model

The adapter:

- signs managers in with Supabase magic-link authentication;
- resolves the signed-in account through `manager_portal_accounts`;
- lists `voting_events` whose `event_type` is `awards`;
- loads category questions and nominee options from Shared Voting V2;
- loads the manager's existing ballot with `get_my_voting_ballot()`;
- saves or edits the complete Awards ballot through `submit_voting_ballot()`;
- reads published/admin-visible totals through `get_voting_results()`;
- exposes Awards finalisation and manual-release controls to authenticated admins.

Nominee presentation reads optional `voting_options.metadata` keys:

- `club`
- `achievement`
- `description`

This lets the current Awards card treatment survive while nominee/category configuration moves out of hard-coded React data.

## Historical data

Hall of Fame, Manager Cabinets, records and existing S25-S27 archive readers are deliberately untouched in this phase. The legacy Awards root continues to provide them. Released Shared Voting V2 events can later be bridged into that historical format using the archive RPCs already deployed in the shared voting backend.

## Netlify configuration

The Awards project needs the same public Supabase client settings as Tournaments/Voting:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are public browser credentials, not service-role secrets.

## Smoke test before cutover

1. Create a harmless `event_type = awards` test event in Shared Voting V2.
2. Open it so the electorate snapshot is frozen.
3. Sign in to the adapter with an active manager account.
4. Submit every required category.
5. Reload and confirm the saved ballot returns through `get_my_voting_ballot()`.
6. Edit one category and resubmit.
7. Close/finalise the Awards event.
8. Confirm results remain hidden for `manual_release` until an admin releases them.
9. Release results and confirm totals render in the adapter.
10. Only after that replace the legacy Awards voting path for the next live season.
