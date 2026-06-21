CREATE TYPE account_type   AS ENUM ('solo', 'business');
CREATE TYPE item_category  AS ENUM ('tools', 'outdoor', 'events', 'electronics', 'appliances');
CREATE TYPE item_condition AS ENUM ('like-new', 'good', 'fair');
CREATE TYPE item_status    AS ENUM ('available', 'unavailable', 'reserved');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined', 'cancelled', 'completed');
