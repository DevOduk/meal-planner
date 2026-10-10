# Meal Planner App Overview

## Purpose

Meal Planner is a mobile-friendly meal planning app for organizing a person's meals across a calendar month. A user chooses foods they are willing to eat in four categories, and the app builds a varied daily plan from those lists. It also provides a shopping checklist, account management, and lightweight social features for connecting with friends and viewing their plans.

The app is a planner, not a recipe or nutrition tracker: meals are plain-text names (often combinations such as `Rice + Beans`), with no recipe instructions, ingredient quantities, calorie data, or meal logging.

## Main user journey

1. A visitor creates an account with a username, full name, email, and password, or signs in to an existing account.
2. A new user completes onboarding:
   - Chooses a gender option and age group.
   - Selects at least three foods in each category: breakfast, lunch, supper, and fruits/salads.
   - Finishes onboarding to save the profile and generate the plan.
3. The home screen shows today's meals and a calendar for the current month.
4. The user can add or remove foods from their personal lists. The generated plan updates from those lists.
5. The user can review a day in a modal, export the monthly plan as a PDF or image, and use the shopping checklist.
6. The user can connect to other users, see friends' meals for today, and borrow friends' food ideas.

## Routes and screens

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | Home / meal calendar | Today's meal summary, friends' meals for today, the current-month calendar, food-list management, and plan export. |
| `/add` | Add food | Add a food to breakfast, lunch, supper, or fruits/salads. The home screen passes a category when opening this route; breakfast is the fallback. |
| `/shopping` | Shopping list | Show the next day's meals as checklist items by splitting each meal name on `+`. Checked items are local to the current page session. |
| `/account` | Account | View profile and account details, see friend invitations, open account editing, or sign out. |
| `/account/edit` | Edit account | Change username, full name, email, phone, profile picture, and optionally password. |
| `/onboarding` | Onboarding | Collect profile demographics and initial meal choices from new users. |
| `/login` | Sign in | Authenticate with email and password; includes a password-visibility control, a “Remember me” checkbox, and links to signup/reset. |
| `/signup` | Create account | Collect username, full name, email, password, and password confirmation. |
| `/reset` | Password reset | Request a reset email, then show a new-password form after Supabase reports a password-recovery session. |
| `/*` | Not found | Display a fallback page for unknown routes. |

All routes except the public auth pages, onboarding, and not-found route are protected by authentication. Protected routes redirect signed-out visitors to `/login`; signed-in users with `onboarded: false` are sent to `/onboarding`. While session/profile operations are loading, show a dimmed, blurred backdrop with a spinner.

## Home screen and meal calendar

- Use a purple-to-deep-indigo gradient header, greeting the user by full name or username and showing the current date and avatar.
- Below it, show a “Today” card with four meal slots: breakfast, lunch, supper, and fruits/salads.
- When the user has friends, show a card for each friend with that friend's four generated meals for today.
- Show export actions for PDF and image, followed by a Sunday-first calendar grid for the current month. Pad the first week with empty cells, visually highlight today, and show meal names inside each date cell on wider screens.
- Clicking a date opens a modal with the full date and all four meals.
- Below the calendar, show a brief usage tip and the user's available foods grouped by category. Each item can be removed; add-food controls open `/add` with that category selected.
- Include the friend invitation/share section and a persistent bottom navigation bar.

The displayed month is the month at the time the page is initialized; the current implementation does not provide previous/next-month navigation or manual editing of individual calendar assignments.

## Meal-plan generation

The plan is generated in the browser from the user's saved food lists; it is not stored as a separate set of daily records.

- Generate one entry for every day in the selected month with the shape:

  ```js
  {
    breakfast: "…",
    lunch: "…",
    supper: "…",
    fruit: "…"
  }
  ```

- Use a deterministic seed based on year, month, and day to shuffle category pools. The same month and food lists should produce the same plan.
- Consume the shuffled category pools to spread each user's foods across the month; refill and reshuffle a pool when exhausted.
- For lunch and supper, prefer choices that do not repeat recent meals or recent component names. Also prefer not to use the same parsed components for lunch and supper on the same day. Meal strings are split on `+` or `&` for these comparisons.
- If no ideal choice remains, use a fallback from the remaining pool rather than leaving the day blank.
- Use the same generator for friends' meal lists so their daily plans can be shown alongside the current user's.

## Food lists and shopping

Each user maintains four arrays of food-name strings:

```js
{
  breakfast: [],
  lunch: [],
  supper: [],
  fruits: []
}
```

The add-food screen has a category selector, free-text field, quick-add suggestions, and suggestions based on friends' foods not already in the user's list. Accept combinations as ordinary text and explain that `+` separates components. Reject blank entries and duplicates within the chosen category. Persist list changes to the user's profile and update the UI state after a successful save.

The shopping screen derives its list from the next calendar day, takes that day's four meal names, and splits each on `+` to make checkbox rows. Checking an item crosses it out. The checked state is currently in-memory only; there is no persisted shopping list, quantity, ingredient catalog, manual-add control, or ingredient deduplication.

## Accounts and social features

### Authentication and profile

Use Supabase Auth for sessions, sign-in, signup, password recovery, and password updates. A shared auth provider loads the signed-in user's profile, friend requests, and accepted friends. The profile record is stored in `planner_profiles`; the app expects fields including:

- `id` (same identifier as the Supabase Auth user)
- `username`, `full_name`, `email`/auth email, `phone`, and `avatar_url`
- `gender`, `age_group`, and `onboarded`
- `meals` (the four category arrays)

Normalize usernames and emails to lowercase when saving edits, prevent a username already owned by another profile, and update the profile in the app state after a successful save. Profile pictures selected from a file are resized to a maximum of 350×350 pixels and encoded as JPEG data before being stored as the avatar value.

### Friends

Use `planner_friendships` records with `sender_id`, `receiver_id`, and a status such as `pending` or `accepted`.

- The invite card shows the current user, accepted friends, pending incoming requests, and an action to search for another user.
- A successful request creates a pending friendship. Accepting a request changes it to accepted and refreshes friend/request state.
- Accepted friends' meal lists are used to generate and display their meals for today.
- On the add-food page, show food suggestions from friends that are not already in the corresponding category.
- The home screen also includes share actions for social platforms, copying the app link, and the browser's native share sheet where supported.

Keep the UI honest about supported actions: the current request card's “Decline” button has no implemented handler, and user search is labeled “Search by username” while its current database query matches `full_name`.

## Visual direction and interaction

- Primary brand color: purple (`#6A0DAD`), paired with deep indigo and white/light-gray surfaces.
- Use a clean, friendly planner aesthetic: rounded cards, subtle shadows, category icons, readable compact labels, and generous spacing.
- Auth screens use a pale lavender gradient background and a centered white card. Authenticated pages use a gradient header, Bootstrap-style responsive grid/cards, and a floating bottom navigation pill.
- Use distinct meal-category accents: warm orange for breakfast, green for lunch, purple for supper, and red/fruit styling for fruits/salads.
- Keep the layout responsive: stack cards and form controls on narrow screens; the calendar may show abbreviated meal content on mobile and fuller details on larger screens.
- Use dialogs for viewing a selected day's plan and searching for friends; use snackbars/toasts for save/auth feedback and a blocking backdrop for loading operations.

## Technical shape

- Frontend: React, Vite, React Router, Material UI, Bootstrap, and custom CSS.
- Backend services: Supabase Auth and Supabase database tables (`planner_profiles` and `planner_friendships`).
- Configure the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; do not hard-code credentials.
- The main product logic lives in the home page, add-food page, shopping page, auth context, and shared meal-plan generator. Shared UI includes the header, bottom navigation, invite/share cards, and footer.

## Recreation boundaries

To recreate the current app faithfully, prioritize the user flows and behavior above. Do not invent calorie tracking, recipes, nutrition goals, pantry inventory, persistent shopping state, meal reminders, editable daily meal assignments, or calendar navigation unless asked to extend the product. Preserve the current-month generated-plan model, the four food categories, and Supabase-backed user profiles/social connections.
