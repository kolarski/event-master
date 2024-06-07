export interface EventUpgrader<Event> {
  upgrade(event: Event): Event;
  downgrade(event: Event): Event;
}
