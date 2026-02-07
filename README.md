🧗‍♀️ Boulder Buds

Boulder Buds is an iOS-first mobile app that helps climbers discover and review indoor bouldering and climbing gyms — starting in New York City.

Think of a mix of Yelp and Beli, but built by climbers, for climbers:

honest opinions on route setting

difficulty consistency (soft vs sandbag)

crowding

vibe, cleanliness, and value

Boulder Buds focuses on climbing-specific insights that general review platforms don’t capture.

🚀 Features (MVP)
🗺️ Gym Discovery

Browse indoor climbing & bouldering gyms in NYC

Search by name or neighborhood

Filter by:

bouldering-only vs mixed gyms

price range

beginner-friendly gyms

Map view using native maps

⭐ Reviews & Ratings

Overall gym rating

Category-based ratings:

Route setting quality

Difficulty consistency

Variety & style

Crowding

Cleanliness

Vibe / staff

Value for price

Written reviews with optional photos

Predefined tags (e.g. sandbaggy, comp-style, great for beginners)

“Helpful” votes on reviews

Users can leave multiple reviews per gym over time (e.g. reflecting changes in setting or crowding)

👤 User Accounts

In-app account creation (email + password)

Email verification and standard security checks

User profiles

Save gyms (“Want to try” / favorites)

🛡️ Trust & Moderation

Review edit history

Report reviews and photos

Rate limiting and anti-spam protections

Basic admin moderation tools

🧱 Tech Stack
Mobile App

React Native

TypeScript

Expo

React Navigation

TanStack Query (React Query)

Zustand (lightweight client state)

react-native-maps

Sentry (crash reporting)

Backend

NestJS (Node.js + TypeScript)

PostgreSQL

Prisma ORM

Meilisearch (fast gym search & filtering)

AWS S3 + CDN for image storage

Secure authentication (password hashing, email verification, JWTs)

DevOps

Expo EAS Build (iOS builds from Windows)

GitHub Actions (CI)

TestFlight for beta distribution

📍 Target Geography

New York City (initial launch)

Brooklyn

Manhattan

Queens

Additional cities may be added after MVP validation.

🧠 Project Goals

Provide climbing-specific gym insights not available on Google/Yelp

Capture how gyms change over time through repeat reviews

Build trust through structured ratings and community moderation

Create a scalable city-by-city discovery platform for climbers

📐 Repo Structure (planned)
/apps
  /mobile        # React Native (Expo) app
  /api           # NestJS backend
/packages
  /shared        # Shared types & schemas

🛠️ Getting Started (Mobile)
# install dependencies
npm install

# start Expo dev server
npx expo start


Note: iOS builds are handled via Expo EAS using macOS runners. A local Mac is not required for development.

🧪 Status

🚧 In development
Current focus:

MVP feature completion

Seeding NYC gym data

Private beta testing

🤝 Contributing

Feedback, issues, and pull requests are welcome.
If you’re a climber or developer interested in contributing, feel free to open an issue.

📄 License

MIT (subject to change)
