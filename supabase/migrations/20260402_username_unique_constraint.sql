-- Enforce case-insensitive username uniqueness at the database level.
-- Partial index so NULL usernames (accounts mid-onboarding) are still allowed.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
    ON profiles (lower(username))
    WHERE username IS NOT NULL;
