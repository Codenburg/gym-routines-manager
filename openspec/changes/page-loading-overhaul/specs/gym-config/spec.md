# Delta for Gym Configuration

## ADDED Requirements

### Requirement: Cached Public Price Reader

The public-facing price value displayed on `/informacion` and other public pages MUST be read through a cached reader (`getGymPrice` / `getGymConfigForServer` pattern) that uses the `gym-config` cache tag with a 60-second TTL. The cached reader MUST be invalidated when `updateGymField` (or equivalent price mutation action) is called — the mutation action MUST call both `revalidatePath` for affected routes AND `revalidateTag("gym-config")`. The reader MUST NOT be the direct Prisma `gym.findUnique` call (which bypasses the cache).

#### Scenario: Public price read goes through cached reader

- GIVEN the `/informacion` page renders
- WHEN the price is read for display
- THEN the read MUST go through the cached `getGymConfigForServer` reader (or a thin `getGymPrice` wrapper using the same `gym-config` tag)
- AND the read MUST be served from the cache on subsequent requests within the 60-second TTL
- AND the read MUST NOT call `prisma.gym.findUnique` directly from the page

#### Scenario: Cache invalidated on price update

- GIVEN an admin updates the gym price via `updateGymField`
- WHEN the mutation completes
- THEN the action MUST call `revalidateTag("gym-config")` alongside the existing `revalidatePath` calls
- AND the next read of the public price (on any page) MUST return the new value (not the cached stale value)

#### Scenario: Stale data acceptable for 60 seconds

- GIVEN the admin updates the price at time T
- WHEN a public page reads the price between T and T+60s
- THEN the page MAY display the cached (old) price value
- AND this is acceptable per the 60-second TTL
- AND the admin panel's own page MUST still show the new price immediately (it does not use the cache for display)

### Requirement: Public Gym Config Sections Use Skeleton for Loading

Public-facing consumers of gym configuration (HoursSection, AddressSection, SocialLinksSection, PriceSection) MUST render a `<Skeleton>` placeholder block while the gym data is in flight, and MUST replace the skeleton with the formatted content once the data resolves. The skeleton MUST be a non-interactive placeholder using the design system's `bg-muted animate-pulse rounded` tokens. The skeleton MUST NOT render fake data (e.g. hardcoded prices, hardcoded hours).

#### Scenario: Hours section shows Skeleton while data is in flight

- GIVEN a user navigates to `/informacion`
- WHEN the gym `horarioJson` is being read
- THEN the HoursSection MUST render a `<Skeleton>` placeholder of the same vertical space the formatted string will occupy
- AND the skeleton MUST NOT contain any formatted hours text

#### Scenario: Address section shows Skeleton while data is in flight

- GIVEN a user navigates to `/informacion`
- WHEN the gym `direccion` / `mapsEmbedUrl` is being read
- THEN the AddressSection MUST render a `<Skeleton>` placeholder
- AND the placeholder MUST NOT contain fake addresses or hardcoded map URLs

#### Scenario: Social links section shows Skeleton while data is in flight

- GIVEN a user navigates to `/informacion`
- WHEN the gym `socialInstagram` / `socialWhatsapp` is being read
- THEN the SocialLinksSection MUST render a `<Skeleton>` placeholder for each link
- AND the placeholder MUST NOT contain fake social URLs

#### Scenario: Skeleton is replaced with real content

- GIVEN a Skeleton placeholder is visible in any public gym-config section
- WHEN the data resolves
- THEN the Skeleton MUST be replaced with the real formatted content
- AND the transition MUST NOT cause a layout shift (the Skeleton's dimensions match the real content's dimensions)

#### Scenario: Skeleton is non-interactive

- GIVEN a Skeleton placeholder is rendered in a public gym-config section
- WHEN a user attempts to click, focus, or copy from the skeleton
- THEN the element MUST NOT be interactive (no clickable, no selectable text, no focusable element)
- AND the user MUST NOT be misled into believing the placeholder is real content
