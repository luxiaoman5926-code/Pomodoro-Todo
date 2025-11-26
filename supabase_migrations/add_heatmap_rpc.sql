-- 创建获取热力图数据的函数
-- 该函数在数据库端聚合数据，减少网络传输量

CREATE OR REPLACE FUNCTION get_heatmap_data(
  p_user_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  date DATE,
  duration_minutes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.date,
    FLOOR(SUM(s.duration_seconds) / 60)::BIGINT as duration_minutes
  FROM
    pomodoro_sessions s
  WHERE
    s.user_id = p_user_id
    AND s.phase = 'focus'
    AND s.date >= p_start_date
  GROUP BY
    s.date
  ORDER BY
    s.date;
END;
$$;

