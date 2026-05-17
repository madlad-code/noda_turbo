--apps/data-ingestion-service/src/migrations/002_realtime_trigger.sql

-- First, create a function that will be executed by the trigger.
-- This function takes the newly inserted or updated row, converts it to JSON,
-- and sends it as a notification on the 'dashboard_updates' channel.
CREATE OR REPLACE FUNCTION notify_dashboard_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'dashboard_updates',
    row_to_json(NEW)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Before creating the new trigger, we drop any existing one to ensure this script
-- can be run multiple times without error.
DROP TRIGGER IF EXISTS dashboard_data_notify_trigger ON dashboard_data;

-- Finally, create the trigger itself.
-- This tells PostgreSQL to execute our function AFTER every INSERT or UPDATE
-- on the dashboard_data table, for each individual row that was changed.
CREATE TRIGGER dashboard_data_notify_trigger
AFTER INSERT OR UPDATE ON dashboard_data
FOR EACH ROW EXECUTE FUNCTION notify_dashboard_update();
