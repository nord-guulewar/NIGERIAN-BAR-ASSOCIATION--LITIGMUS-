const { Client } = require('pg');

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const describeIfDatabase = databaseUrl ? describe : describe.skip;

describeIfDatabase('PostgreSQL row level security for cases', () => {
  let client;

  beforeAll(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    await client.query('SET search_path TO pg_temp, public');

    await client.query(`
      CREATE TEMP TABLE cases (
        id uuid PRIMARY KEY,
        state text NOT NULL,
        "courtType" text NOT NULL,
        "assignedJudge" uuid NULL
      )
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION app_rls_current_setting(setting_name text)
      RETURNS text
      LANGUAGE sql
      STABLE
      AS $$
        SELECT NULLIF(current_setting(setting_name, true), '');
      $$;

      CREATE OR REPLACE FUNCTION app_rls_current_user_id()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS $$
        SELECT NULLIF(app_rls_current_setting('app.current_user_id'), '')::uuid;
      $$;

      CREATE OR REPLACE FUNCTION app_rls_current_role()
      RETURNS text
      LANGUAGE sql
      STABLE
      AS $$
        SELECT app_rls_current_setting('app.current_user_role');
      $$;

      CREATE OR REPLACE FUNCTION app_rls_current_state()
      RETURNS text
      LANGUAGE sql
      STABLE
      AS $$
        SELECT app_rls_current_setting('app.current_state');
      $$;

      CREATE OR REPLACE FUNCTION app_rls_current_court()
      RETURNS text
      LANGUAGE sql
      STABLE
      AS $$
        SELECT app_rls_current_setting('app.current_court');
      $$;

      CREATE OR REPLACE FUNCTION app_rls_is_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      AS $$
        SELECT app_rls_current_role() = 'admin';
      $$;

      CREATE OR REPLACE FUNCTION app_rls_matches_state_and_court(user_state text, row_state text, user_court text, row_court text)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      AS $$
        SELECT user_state IS NOT NULL
          AND user_court IS NOT NULL
          AND row_state = user_state
          AND row_court = user_court;
      $$;

      CREATE OR REPLACE FUNCTION app_rls_can_access_case_row(case_state text, case_court text, assigned_judge uuid)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      AS $$
        SELECT CASE
          WHEN app_rls_is_admin() THEN true
          WHEN app_rls_current_user_id() IS NULL THEN false
          WHEN app_rls_current_role() = 'judge' THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court) AND assigned_judge = app_rls_current_user_id()
          WHEN app_rls_current_role() IN ('registrar', 'clerk', 'secretary', 'record_officer', 'court_reporter', 'litigation', 'prosecutor', 'probate', 'librarian') THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
          WHEN app_rls_current_role() IN ('accountant', 'cashier') THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
          WHEN app_rls_current_role() = 'bailiff' THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
          ELSE false
        END;
      $$;
    `);

    await client.query('ALTER TABLE cases ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE cases FORCE ROW LEVEL SECURITY');
    await client.query(`
      CREATE POLICY cases_select_policy ON cases
        FOR SELECT
        USING (app_rls_can_access_case_row(state, "courtType", "assignedJudge"))
    `);

    await client.query(`
      INSERT INTO cases (id, state, "courtType", "assignedJudge")
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'LA', 'SHC', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
        ('22222222-2222-2222-2222-222222222222', 'LA', 'SHC', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
    `);
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
  });

  it('prevents one judge from reading another judge\'s case', async () => {
    await client.query(`
      SELECT
        set_config('app.current_user_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
        set_config('app.current_user_role', 'judge', true),
        set_config('app.current_state', 'LA', true),
        set_config('app.current_court', 'SHC', true)
    `);

    const result = await client.query('SELECT id FROM cases ORDER BY id');

    expect(result.rows).toEqual([
      { id: '11111111-1111-1111-1111-111111111111' }
    ]);
  });

  it('allows registrar to read all cases in their court but not another court', async () => {
    await client.query(`
      INSERT INTO cases (id, state, "courtType", "assignedJudge")
      VALUES ('33333333-3333-3333-3333-333333333333', 'LA', 'FHC', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
    `);

    await client.query(`
      SELECT
        set_config('app.current_user_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
        set_config('app.current_user_role', 'registrar', true),
        set_config('app.current_state', 'LA', true),
        set_config('app.current_court', 'SHC', true)
    `);

    const result = await client.query('SELECT id FROM cases ORDER BY id');

    expect(result.rows).toEqual([
      { id: '11111111-1111-1111-1111-111111111111' },
      { id: '22222222-2222-2222-2222-222222222222' }
    ]);
  });
});