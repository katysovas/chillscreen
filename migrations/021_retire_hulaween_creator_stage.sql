-- Hulaween is now a built-in static stage at /hula with a synced playlist.
UPDATE user_stages
SET featured = false, taken_down_at = now()
WHERE slug = 'hulaween' AND taken_down_at IS NULL;
