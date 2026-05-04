-- =============================================================
-- Writers Bot API - PostgreSQL Database Schema
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE plan_type AS ENUM ('none', 'pro-plan', 'max-plan');
CREATE TYPE renew_on AS ENUM ('monthly', 'yearly');
CREATE TYPE stripe_subscription_status AS ENUM (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);


-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
    user_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT       NOT NULL,
    stripe_customer_id VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- AUTHENTICATION
-- Stores active JWTs. Logout destroys the row.
-- =============================================================

CREATE TABLE authentication (
    auth_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token       TEXT        NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_authentication_user_id ON authentication(user_id);
CREATE INDEX idx_authentication_token   ON authentication(token);


-- =============================================================
-- GENRES
-- Many genres per user, each stored as a separate row.
-- =============================================================

CREATE TABLE genres (
    story_id    UUID        NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    genre       VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (story_id, genre)
);

CREATE INDEX idx_genres_user_id ON genres(story_id);


-- =============================================================
-- CANNONS
-- Top-level grouping (a fictional universe / setting).
-- A user's full collection of cannons is their "Legacy."
-- =============================================================

CREATE TABLE cannons (
    cannon_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cannons_user_id ON cannons(user_id);


-- =============================================================
-- STORIES
-- A collection of documents belonging to one cannon.
-- Represents a single book in a series.
-- =============================================================

CREATE TABLE stories (
    story_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cannon_id       UUID        NOT NULL REFERENCES cannons(cannon_id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    predecessor_id  UUID        REFERENCES stories(story_id) ON DELETE SET NULL,
    successor_id    UUID        REFERENCES stories(story_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_story_no_self_predecessor CHECK (predecessor_id <> story_id),
    CONSTRAINT chk_story_no_self_successor   CHECK (successor_id   <> story_id)
);

CREATE INDEX idx_stories_cannon_id     ON stories(cannon_id);
CREATE INDEX idx_stories_predecessor_id ON stories(predecessor_id);
CREATE INDEX idx_stories_successor_id   ON stories(successor_id);


-- =============================================================
-- DOCUMENTS
-- A single chapter or section. Forms a doubly-linked list
-- within a story (predecessor / successor chain).
-- =============================================================

CREATE TABLE documents (
    document_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id        UUID        NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    body            TEXT        NOT NULL DEFAULT '',
    predecessor_id  UUID        REFERENCES documents(document_id) ON DELETE SET NULL,
    successor_id    UUID        REFERENCES documents(document_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforce that a document cannot be its own predecessor or successor
    CONSTRAINT chk_no_self_predecessor CHECK (predecessor_id <> document_id),
    CONSTRAINT chk_no_self_successor   CHECK (successor_id   <> document_id)
);

CREATE INDEX idx_documents_story_id       ON documents(story_id);
CREATE INDEX idx_documents_predecessor_id ON documents(predecessor_id);
CREATE INDEX idx_documents_successor_id   ON documents(successor_id);


-- =============================================================
-- PLANS
-- Active subscription per user.
-- Each user has exactly one current plan row.
-- =============================================================

CREATE TABLE plans (
    user_id             UUID        PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    plan_type           plan_type   NOT NULL,
    is_year_plan        BOOLEAN     NOT NULL DEFAULT FALSE,
    renew_on            renew_on,
    renew_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stripe_price_id     VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status stripe_subscription_status,
    cancel_at_period_end BOOLEAN    NOT NULL DEFAULT FALSE,
    start_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- BILLING
-- Full billing history. Used to determine introductory pricing
-- (first 3 months billed = discounted rate).
-- =============================================================

CREATE TABLE billing (
    billing_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan_type               plan_type   NOT NULL,
    is_year_plan            BOOLEAN     NOT NULL DEFAULT FALSE,
    amount_cents            INTEGER     NOT NULL,           -- stored in cents to avoid float issues
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id       VARCHAR(255),
    billed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_user_id   ON billing(user_id);
CREATE INDEX idx_billing_billed_at ON billing(billed_at);
