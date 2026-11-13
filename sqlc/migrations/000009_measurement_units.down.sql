DROP POLICY IF EXISTS tenant_isolation ON measurement_units;
ALTER TABLE measurement_units DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_measurement_units_set_tenant ON measurement_units;

DROP TABLE IF EXISTS measurement_units;
