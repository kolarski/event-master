## TODO

### Short - term goals

- [x] Event definition (Strict typing)
- [x] Event emitting
- [x] Replay and Replay Filters
- [x] Upgrade / downgrade events
- [ ] Subscriptions
  - [x] Live subscriptions
  - [ ] Catchup subscriptions
  - [ ] Persistant subscriptions
- [ ] Projections
  - [ ] Define projections
  - [ ] Run and manage projections
- [ ] Repositories
  - [x] In Memory Repository
  - [ ] Add Supabase repository

## Long term goals

- [ ] Upgrade / downgrade events
  - [ ] Check for the upgrader for idempotency
  - [ ] Add ability to migrate the event to persistant next version, but veryfy downgrades are idempotent so you can always get back
- [ ] Streams
  - [ ] Introduce dynamic streams. Define own streams in code
  - [ ] Ability to use the streams everywhere
  - [ ] Use streams as expected version
- [ ] More repositories
  - [ ] File / JSON Repository
  - [ ] SQL Repository
  - [ ] EventStoreDb Repository
