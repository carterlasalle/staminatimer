-- Example seed data for achievements
-- Adjust values to fit your program and audience.

INSERT INTO public.achievements (name, description, category, condition_type, condition_value, condition_comparison, points, icon)
VALUES
  ('First Session', 'Complete your first training session', 'progress', 'duration', 1, 'greater', 25, 'flag'),
  ('Edge Explorer', 'Complete 3 edges in a session', 'control', 'edge_count', 3, 'equal', 40, 'compass'),
  ('Ten Minute Mark', 'Reach 10 minutes total duration', 'endurance', 'duration', 600000, 'greater', 50, 'timer'),
  ('Twenty Minute Mark', 'Reach 20 minutes total duration', 'endurance', 'duration', 1200000, 'greater', 75, 'timer'),
  ('Cold Control', 'Keep max edge under 30 seconds', 'control', 'edge_duration', 30000, 'less', 60, 'shield'),
  ('Straight Through', 'No edges and 15+ minutes total', 'special', 'custom', 0, 'equal', 100, 'bolt'),
  ('Getting Stronger', 'Improve active time vs recent average by 25%', 'progress', 'custom', 0, 'equal', 100, 'trending-up')
ON CONFLICT DO NOTHING;

