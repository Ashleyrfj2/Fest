# FestNest Data Model — Full Schema

> 17 entities. Built March 2026.

## Entity Groups

### Core

**User** — Registered app user; ghost account on device until email saved.
- `id` (uuid PK), `display_name` (required), `avatar_color` (hex, required), `phone`, `email`, `created_at`, `last_seen_at`

**Trip** — Root entity; everything belongs to a Trip.
- `id` (uuid PK), `name` (required), `festival_name` (required), `start_date` (required), `end_date` (required), `leader_id` (FK User), `invite_code` (required), `invite_expires_at` (null = permanent)

**GroupMember** — Join table: User × Trip; stores role + module permissions.
- `user_id` (FK), `trip_id` (FK), `role`: leader | editor | viewer, `module_permissions`: string[] e.g. ["food", "camp"], `joined_at`

### Camp

**CampGrid** — Campsite dimensions + scale; one per trip; shared through Supabase and cached locally for offline reopen.
- `trip_id` (FK), `width_ft`, `height_ft`, `cell_size_ft` (e.g. 1 cell = 2ft), `festival_preset` (optional)
- Current client decision: measurement unit preference is also stored in local SQLite for rendering, even though it is not part of the shared Supabase table today

**CampItem** — Individual placed objects with x/y position + real dimensions.
- `id` (uuid PK), `grid_id` (FK), `item_type`: tent | car | table | canopy | fire_pit | path | custom
- `x`, `y` (grid position), `width_cells`, `height_cells`, `real_width_ft`, `real_height_ft`
- `label`, `assigned_to` (FK User), `color`
- Current product behavior: rotation is represented by swapping width/height before save; no separate rotation column exists yet
- Current sync decision: local SQLite remains the offline cache, while Supabase becomes the shared group layout when users press Save Layout

### Supplies + Food

**SupplyItem** — Claimable item with workflow status.
- `id` (uuid PK), `trip_id` (FK), `name`, `quantity`, `category`: cooking | shelter | hygiene | medical | drinks | food | entertainment | misc
- `status`: unassigned | claimed | packed, `claimed_by` (FK User)

**MealDay** — One day in the food calendar.
- `id` (uuid PK), `trip_id` (FK), `date`, `day_label` (e.g. "Thursday")

**Meal** — Single meal entry.
- `id` (uuid PK), `meal_day_id` (FK), `slot`: breakfast | lunch | dinner | snacks
- `name`, `cook_id` (FK User), `ingredients`: string[], `dietary_flags`: string[] (vegan, gluten_free, nut_free, etc.), `notes`
- Ingredients auto-sync to SupplyItem

**PackingItem** — Checklist item template shared across the trip.
- `id` (uuid PK), `trip_id` (FK), `name`, `category`, `is_group_item` (boolean), `assigned_to` (FK User, for group items)

**PackingCheck** — Per-user packed state for a packing item.
- `packing_item_id` (FK), `user_id` (FK), `packed` (boolean)

### Travel

**Vehicle** — Car with driver, capacity, route.
- `id` (uuid PK), `trip_id` (FK), `driver_id` (FK User), `make_model`, `capacity`, `departure_city`, `departure_time`, `waypoints`: json[], `meetup_pin`: latlong

**VehiclePassenger** — Join table: User × Vehicle.
- `vehicle_id` (FK), `user_id` (FK), `pickup_waypoint_index` (int, enables "pick up along the route")

**FlightDetail** — Flight info per member.
- `id` (uuid PK), `trip_id` (FK), `user_id` (FK), `airline`, `flight_number`, `arrival_airport`, `arrival_time`, `needs_pickup` (boolean), `pickup_vehicle_id` (FK Vehicle)

**OutfitPost** — Outfit photo upload per member per trip.
- `id` (uuid PK), `trip_id` (FK), `user_id` (FK), `photo_url`, `caption`, `created_at`

**OutfitVote** — Thumbs up/down per user per outfit.
- `outfit_post_id` (FK), `user_id` (FK), `vote`: up | down

### Lineup

**LineupArtist** — Artist on the festival lineup.
- `id` (uuid PK), `trip_id` (FK), `name`, `stage`, `day`, `start_time`, `end_time`, `genre`

**ArtistVote** — Per-member preference.
- `artist_id` (FK), `user_id` (FK), `preference`: must_see | want_to_see | skip
- `going_now` (boolean) — real-time "I'm heading there" signal

### Safety + Activity

**SafetyProfile** — Emergency info; encrypted; offline-cached; self-owned.
- `id` (uuid PK), `trip_id` (FK), `user_id` (FK)
- `full_name`, `phone`, `hometown`
- `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone`
- `allergies_food`: string[], `allergies_environmental`: string[], `allergies_medication`: string[]
- `current_medications`: string[], `blood_type` (optional), `notes`
- Scoped per user per trip (allows different emergency contacts across trips)

**ActivityLog** — Append-only feed of all actions.
- `id` (uuid PK), `trip_id` (FK), `user_id` (FK), `action_type`, `module`, `target_id`, `description`, `created_at`
- Never update or delete rows — supports history replay and potential undo

**BudgetEntry** — Shared expense with split logic.
- `id` (uuid PK), `trip_id` (FK), `paid_by` (FK User), `amount_cents` (integer — never floats)
- `description`, `category`: food | supplies | fuel | activity | misc
- `split_type`: equal | custom, `split_with`: user_id[] (defaults to all members)
- `custom_splits`: json {user_id: amount_cents}, `receipt_url` (optional photo), `created_at`

## Key Schema Decisions

1. **PackingItem + PackingCheck are split** — item template lives once; each member tracks their own packed state independently.
2. **MealDay + Meal are split** — allows empty calendar days without orphaned meal records.
3. **ArtistVote is separate from LineupArtist** — enables per-member preference isolation and group aggregation queries.
4. **SafetyProfile is scoped per user per trip** — allows different emergency contacts across trips.
5. **ActivityLog is append-only** — never update/delete rows; supports history replay and potential undo.
6. **BudgetEntry stores amounts in cents (integer)** — avoids floating-point math bugs.
7. **VehiclePassenger stores pickup_waypoint_index** — enables "pick up along the route" flow.
8. **FlightDetail links to Vehicle** — direct airport-to-car pickup coordination.
9. **CampGrid uses dual persistence** — local SQLite supports offline reopen and unsaved drafts; Supabase stores the shared group version after explicit save.
10. **CampItem rotation is dimension-based for now** — rotating an item swaps width/height instead of introducing a dedicated angle field.
