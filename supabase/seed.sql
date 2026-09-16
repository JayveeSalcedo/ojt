-- Replace with your class list
insert into students (name) values
  ('Ablang, Jonathan'),
  ('De dios, Den Earl'),
  ('Guinto, Vangie'),
  ('Agaoid, Jemima Victoria'),
  ('Duque, Jnorlynne'),
  ('Ordinado, Hyacinth Dianne'),
  ('Salcedo, Jayvee'),
  ('Jimenez, Narezah'),
('Renticruz, DJ')
on conflict (name) do nothing;
