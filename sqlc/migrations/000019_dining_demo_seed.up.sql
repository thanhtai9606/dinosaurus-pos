-- Demo dining layout for default tenant when no tables exist (existing DBs without re-seed).
DO $$
DECLARE
    tid UUID := '00000000-0000-0000-0000-000000000001';
    aid UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM dining_tables LIMIT 1) THEN
        RETURN;
    END IF;

    INSERT INTO dining_areas (tenant_id, name, sort_order)
    VALUES (tid, 'Tầng trệt', 0)
    RETURNING id INTO aid;

    INSERT INTO dining_tables (tenant_id, area_id, name, capacity, status) VALUES
        (tid, aid, 'Bàn 1', 4, 'available'),
        (tid, aid, 'Bàn 2', 4, 'available'),
        (tid, aid, 'Bàn 3', 6, 'available'),
        (tid, aid, 'Bàn 4', 2, 'available');

    INSERT INTO dining_areas (tenant_id, name, sort_order)
    VALUES (tid, 'Sân vườn', 10)
    RETURNING id INTO aid;

    INSERT INTO dining_tables (tenant_id, area_id, name, capacity, status) VALUES
        (tid, aid, 'V01', 6, 'available'),
        (tid, aid, 'V02', 6, 'available'),
        (tid, aid, 'V03', 8, 'available');
END $$;