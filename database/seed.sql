-- Community Resolution Platform — demo seed data
-- Password for ALL accounts below: password123
-- bcrypt hash generated with bcryptjs (10 rounds)

INSERT INTO departments (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Roads', 'Road damage, potholes, pavements, and traffic hazards'),
  ('00000000-0000-0000-0000-000000000102', 'Sanitation', 'Waste, garbage collection, drainage, and cleanliness'),
  ('00000000-0000-0000-0000-000000000103', 'Street Lighting', 'Street lights, electrical poles, and public lighting'),
  ('00000000-0000-0000-0000-000000000104', 'Electrical', 'Power lines, transformers, and electrical infrastructure'),
  ('00000000-0000-0000-0000-000000000105', 'Emergency Response', 'Accidents, fire, crime, and medical emergencies')
ON CONFLICT (name) DO NOTHING;

-- ── Admin (single account) ──────────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role, ward, pincode_coverage, area_coverage, availability_status, response_rate, resolved_cases) VALUES
  ('00000000-0000-0000-0000-000000000201', 'Priya Sharma', 'admin.communityresolution@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'admin', NULL, '{}', '{}', 'Available', 0, 0)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ── Officers across India ───────────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role, department_id, ward, pincode_coverage, area_coverage, availability_status, response_rate, resolved_cases) VALUES
  ('00000000-0000-0000-0000-000000000202', 'Rajesh Kumar', 'rajesh.kumar.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000101', '4',
   ARRAY['560034','560001','560038'], ARRAY['Koramangala','Indiranagar','HSR Layout'], 'Available', 94.2, 67),
  ('00000000-0000-0000-0000-000000000203', 'Suresh Patel', 'suresh.patel.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000102', '12',
   ARRAY['400001','400050','400706'], ARRAY['Fort','Bandra','Andheri'], 'Available', 89.5, 52),
  ('00000000-0000-0000-0000-000000000204', 'Amit Verma', 'amit.verma.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000104', '7',
   ARRAY['110001','110016','110092'], ARRAY['Connaught Place','Lajpat Nagar','Mayur Vihar'], 'Busy', 91.0, 58),
  ('00000000-0000-0000-0000-000000000205', 'Lakshmi Iyer', 'lakshmi.iyer.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000102', '3',
   ARRAY['600001','600028','600017'], ARRAY['George Town','T Nagar','Adyar'], 'Available', 87.3, 44),
  ('00000000-0000-0000-0000-000000000206', 'Karthik Reddy', 'karthik.reddy.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000101', '8',
   ARRAY['500001','500081','500034'], ARRAY['Abids','Gachibowli','Madhapur'], 'Available', 90.1, 61),
  ('00000000-0000-0000-0000-000000000207', 'Debabrata Banerjee', 'debojyoti.banerjee.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000102', '15',
   ARRAY['700001','700091','700019'], ARRAY['BBD Bagh','Salt Lake','Park Street'], 'On Leave', 86.8, 39),
  ('00000000-0000-0000-0000-000000000208', 'Neha Deshmukh', 'neha.deshmukh.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000103', '6',
   ARRAY['411001','411014','411045'], ARRAY['Shivajinagar','Kothrud','Hadapsar'], 'Available', 92.4, 55),
  ('00000000-0000-0000-0000-000000000209', 'Vikas Shah', 'vikas.shah.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000101', '9',
   ARRAY['380001','380015','380054'], ARRAY['Lal Darwaja','Navrangpura','Satellite'], 'Available', 88.7, 47),
  ('00000000-0000-0000-0000-000000000210', 'Poonam Meena', 'poonam.meena.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000102', '11',
   ARRAY['302001','302017','302020'], ARRAY['MI Road','Malviya Nagar','Vaishali Nagar'], 'Busy', 85.2, 41),
  ('00000000-0000-0000-0000-000000000211', 'Arun Singh', 'arun.singh.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000101', '5',
   ARRAY['801106','800001','800020'], ARRAY['Danapur','Patna City','Kankarbagh'], 'Available', 93.6, 72),
  ('00000000-0000-0000-0000-000000000212', 'Ravi Tiwari', 'ravi.tiwari.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000102', '4',
   ARRAY['226001','226010','226016'], ARRAY['Hazratganj','Aliganj','Gomti Nagar'], 'Available', 84.9, 38),
  ('00000000-0000-0000-0000-000000000213', 'Jose Mathew', 'jose.mathew.officer@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'officer', '00000000-0000-0000-0000-000000000104', '2',
   ARRAY['682001','682016','682030'], ARRAY['Ernakulam','Edapally','Kakkanad'], 'Available', 91.8, 49)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  department_id = EXCLUDED.department_id,
  ward = EXCLUDED.ward,
  pincode_coverage = EXCLUDED.pincode_coverage,
  area_coverage = EXCLUDED.area_coverage;

-- ── Citizens ────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role, ward, pincode_coverage, area_coverage, availability_status, response_rate, resolved_cases) VALUES
  ('00000000-0000-0000-0000-000000000301', 'Priya Menon', 'priya.menon.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000302', 'Rohit Gupta', 'rohit.gupta.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000303', 'Ananya Das', 'ananya.das.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000304', 'Mohan Raj', 'mohan.raj.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000305', 'Kavitha Nair', 'kavitha.nair.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000306', 'Sana Ahmed', 'sana.ahmed.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000307', 'Ajay Patil', 'ajay.patil.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000308', 'Hema Patel', 'hema.patel.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000309', 'Vikram Singh', 'vikram.singh.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000310', 'Ritesh Kumar', 'ritesh.kumar.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000311', 'Deepa Sen', 'deepa.sen.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0),
  ('00000000-0000-0000-0000-000000000312', 'Meera Thomas', 'meera.thomas.citizen@gmail.com',
   '$2a$10$b332hLsvcbW1bSVrusHzaeO7M3.I99sDpF1DHrjNj1IShC8p1oW2K', 'citizen', NULL, '{}', '{}', 'Available', 0, 0)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name;

-- Real photo URLs (Unsplash — actual photographs, not AI-generated)
-- Issues with varied statuses across Indian cities

INSERT INTO issues
  (id, title, description, category, image_url, before_image_url, after_image_url,
   latitude, longitude, address, area, ward, pincode, landmark,
   status, created_by, assigned_department, assigned_officer, assigned_at, accepted_at,
   predicted_category, confidence_score, suggested_department, priority_level, severity_level,
   votes_count, followers_count, resolution_notes, resolution_timestamp, completion_date,
   citizen_verified, verified_at, created_at, updated_at)
VALUES
  -- Bangalore
  ('00000000-0000-0000-0000-000000000401', 'Deep pothole on 80 Feet Road',
   'Two-wheeler riders are swerving into oncoming traffic to avoid this crater near the bus stop. Gets worse every monsoon.',
   'Pothole', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
   'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80', NULL,
   12.9352000, 77.6245000, '42 80 Feet Road', 'Koramangala', '4', '560034', 'Near Sony World signal',
   'In Progress', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'Pothole', 88, 'Roads', 'High', 'High', 18, 7, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000402', 'Garbage pile not cleared for 5 days',
   'Municipal bin overflowed after festival. Stray dogs tearing bags. Smell reaching nearby apartments.',
   'Sanitation', 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80',
   'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80', NULL,
   12.9784000, 77.6408000, '18 1st Main', 'Indiranagar', '5', '560038', 'Opposite Metro pillar 42',
   'Assigned', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', NULL,
   NOW() - INTERVAL '1 day', NULL, 'Sanitation', 91, 'Sanitation', 'Medium', 'Medium', 11, 4, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000403', 'Street light fixed on school lane',
   'Dark stretch outside Green Valley School was unsafe for children. LED unit replaced last week.',
   'Street Lighting', 'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   12.9668000, 77.5874000, '8 School Lane', 'Koramangala', '4', '560034', 'Green Valley School gate',
   'Citizen Verified', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000208',
   NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', 'Street Lighting', 94, 'Street Lighting', 'Medium', 'Medium', 22, 9,
   'Replaced faulty LED fixture and tested circuit.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', TRUE, NOW() - INTERVAL '2 days',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),

  -- Mumbai
  ('00000000-0000-0000-0000-000000000404', 'Open manhole cover on Linking Road',
   'Cover is missing near the zebra crossing. Pedestrians almost fell in twice yesterday evening.',
   'Drainage', 'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80',
   'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80', NULL,
   19.0596000, 72.8295000, 'Shop 14 Linking Road', 'Bandra', '12', '400050', 'Near Shoppers Stop',
   'Accepted', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000203',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 'Drainage', 86, 'Sanitation', 'High', 'High', 31, 12, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000405', 'Construction debris blocking footpath',
   'Builder dumped rubble on the walking path. Senior citizens and school kids forced onto the road.',
   'Public Property', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', NULL,
   19.0760000, 72.8777000, 'Plot 7 Napean Sea Road', 'Fort', '12', '400001', 'Near Regal Cinema',
   'Reported', '00000000-0000-0000-0000-000000000302', NULL, NULL, NULL, NULL, 'Public Property', 72, 'Roads', 'Medium', 'Medium', 5, 2, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  -- Delhi
  ('00000000-0000-0000-0000-000000000406', 'Waterlogging after light rain',
   'Main road near the market floods with ankle-deep water. Drains seem completely choked.',
   'Drainage', 'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80',
   'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80', NULL,
   28.5677000, 77.2431000, 'Block C Lajpat Nagar II', 'Lajpat Nagar', '7', '110024', 'Central Market gate',
   'In Progress', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000204',
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 'Drainage', 89, 'Sanitation', 'High', 'High', 27, 8, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000407', 'Fallen tree branch blocking lane',
   'Storm last night brought down a large branch. One lane completely blocked on Ring Road service road.',
   'Public Property', 'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80',
   28.6289000, 77.2065000, 'Ring Road service lane', 'Connaught Place', '7', '110001', 'Near Barakhamba metro',
   'Resolved', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000204',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'Public Property', 90, 'Roads', 'High', 'High', 14, 6,
   'MCD crew cleared branch and trimmed remaining loose limbs.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL, NULL,
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),

  -- Chennai
  ('00000000-0000-0000-0000-000000000408', 'Burst water pipe flooding street',
   'Pipe burst at 6 AM. Water wasted for hours before anyone came. Road surface damaged.',
   'Water', 'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80',
   'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80', NULL,
   13.0418000, 80.2341000, '12 Venkatanarayana Road', 'T Nagar', '3', '600017', 'Near bus terminus',
   'Assigned', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000205',
   NOW() - INTERVAL '12 hours', NULL, 'Water', 85, 'Sanitation', 'High', 'High', 9, 3, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),

  -- Hyderabad
  ('00000000-0000-0000-0000-000000000409', 'Speed breaker too high — vehicles scraping',
   'Newly built speed breaker on IT corridor road is damaging car underbodies. Needs levelling.',
   'Roads', 'https://images.unsplash.com/photo-1499689793516-c0a7b8f76c33?w=800&q=80',
   'https://images.unsplash.com/photo-1499689793516-c0a7b8f76c33?w=800&q=80', NULL,
   17.4400000, 78.3489000, 'Mindspace Road', 'Madhapur', '8', '500081', 'Opposite Inorbit Mall',
   'Reported', '00000000-0000-0000-0000-000000000305', NULL, NULL, NULL, NULL, 'Roads', 78, 'Roads', 'Medium', 'Medium', 16, 5, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  -- Kolkata
  ('00000000-0000-0000-0000-000000000410', 'Street vendor waste near park entrance',
   'Daily accumulation of plastic and food waste at Park Street park gate. No bin nearby.',
   'Sanitation', 'https://images.unsplash.com/photo-1558618047-3c8c7b4a9cd9?w=800&q=80',
   'https://images.unsplash.com/photo-1558618047-3c8c7b4a9cd9?w=800&q=80', NULL,
   22.5510000, 88.3530000, '15 Park Street', 'Park Street', '15', '700016', 'Park gate entrance',
   'In Progress', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000207',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'Sanitation', 87, 'Sanitation', 'Medium', 'Medium', 8, 4, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days'),

  -- Pune
  ('00000000-0000-0000-0000-000000000411', 'Non-functional street lights on FC Road',
   'Three consecutive poles dark for two weeks. Students walking home after classes feel unsafe.',
   'Street Lighting', 'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80', NULL,
   18.5204000, 73.8567000, 'FC Road near Fergusson College', 'Shivajinagar', '6', '411004', 'Fergusson College gate',
   'Accepted', '00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000208',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'Street Lighting', 92, 'Street Lighting', 'Medium', 'Medium', 19, 7, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),

  -- Ahmedabad
  ('00000000-0000-0000-0000-000000000412', 'Cracked footpath tiles near bus stand',
   'Several tiles broken and uneven. Elderly passengers tripped twice this week.',
   'Public Property', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80',
   'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80', NULL,
   23.0258000, 72.5873000, 'Lal Darwaja bus stand', 'Lal Darwaja', '9', '380001', 'Platform 3 entrance',
   'Assigned', '00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000209',
   NOW() - INTERVAL '1 day', NULL, 'Public Property', 80, 'Roads', 'Medium', 'Medium', 6, 2, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

  -- Jaipur
  ('00000000-0000-0000-0000-000000000413', 'Overflowing drain near MI Road shops',
   'Foul smell and stagnant water outside textile shops. Customers complaining daily.',
   'Drainage', 'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80',
   'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80', NULL,
   26.9124000, 75.7873000, 'MI Road shop 22', 'MI Road', '11', '302001', 'Near Rajmandir cinema',
   'Reported', '00000000-0000-0000-0000-000000000309', NULL, NULL, NULL, NULL, 'Drainage', 83, 'Sanitation', 'Medium', 'Medium', 4, 1, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- Patna (801106 — matches demo search)
  ('00000000-0000-0000-0000-000000000414', 'Large pothole near Danapur railway crossing',
   'Crater formed after truck traffic. Autos and bikes slowing down, causing jams every evening rush hour.',
   'Pothole', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
   'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80', NULL,
   25.6437000, 85.0456000, 'Station Road Danapur', 'Danapur', '5', '801106', 'Railway crossing gate',
   'Assigned', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000211',
   NOW() - INTERVAL '2 days', NULL, 'Pothole', 91, 'Roads', 'High', 'High', 24, 11, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000415', 'Garbage dump beside community park',
   'Uncollected waste for a week beside the children park in Danapur Cantonment area.',
   'Sanitation', 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80',
   'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80', NULL,
   25.6389000, 85.0523000, 'Cantonment Road', 'Danapur', '5', '801106', 'Community park back gate',
   'In Progress', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000211',
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 'Sanitation', 88, 'Sanitation', 'Medium', 'Medium', 13, 5, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000416', 'Broken street light on school road — fixed',
   'Parents complained about dark stretch. Municipal team replaced bulb and wiring.',
   'Street Lighting', 'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   'https://images.unsplash.com/photo-1519501025260-9f31e64b1f44?w=800&q=80',
   25.6412000, 85.0489000, 'School Road Danapur', 'Danapur', '5', '801106', 'DAV Public School',
   'Citizen Verified', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000211',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'Street Lighting', 93, 'Street Lighting', 'Medium', 'Medium', 17, 8,
   'New LED installed and tested. Area well lit now.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', TRUE, NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days'),

  -- Lucknow
  ('00000000-0000-0000-0000-000000000417', 'Damaged road near Hazratganj crossing',
   'Patch work came off after rains. Multiple potholes forming on the main shopping stretch.',
   'Roads', 'https://images.unsplash.com/photo-1499689793516-c0a7b8f76c33?w=800&q=80',
   'https://images.unsplash.com/photo-1499689793516-c0a7b8f76c33?w=800&q=80', NULL,
   26.8467000, 80.9462000, 'Hazratganj main crossing', 'Hazratganj', '4', '226001', 'Near Mayawati statue',
   'Reported', '00000000-0000-0000-0000-000000000311', NULL, NULL, NULL, NULL, 'Roads', 76, 'Roads', 'Medium', 'Medium', 7, 3, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- Kochi
  ('00000000-0000-0000-0000-000000000418', 'Loose electric wire hanging low',
   'Cable dangling at chest height near market. Monsoon makes it dangerous — needs urgent taping or removal.',
   'Electricity', 'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80',
   'https://images.unsplash.com/photo-1547036967-23ff066a1e64?w=800&q=80', NULL,
   9.9312000, 76.2673000, 'Broadway market lane', 'Ernakulam', '2', '682001', 'Near spice shops',
   'Accepted', '00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000213',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', 'Electricity', 95, 'Electrical', 'Emergency', 'Emergency', 42, 15, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours'),

  ('00000000-0000-0000-0000-000000000419', 'Park bench vandalised and broken',
   'Three benches smashed. No place for elderly to sit in the morning walk area.',
   'Public Property', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80',
   'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80',
   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
   9.9689000, 76.2433000, 'Marine Drive park', 'Ernakulam', '2', '682001', 'Jogging track start',
   'Closed', '00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000213',
   NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', 'Public Property', 82, 'Roads', 'Low', 'Low', 10, 4,
   'Benches replaced with new cement seating.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', TRUE, NOW() - INTERVAL '6 days',
   NOW() - INTERVAL '16 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Timeline events
INSERT INTO issue_timeline (issue_id, actor_name, event_type, status, notes) VALUES
  ('00000000-0000-0000-0000-000000000401', 'Priya Menon', 'reported', 'Reported', 'Submitted pothole report with photo near Sony World.'),
  ('00000000-0000-0000-0000-000000000401', 'Priya Sharma', 'assigned', 'Assigned', 'Assigned to Roads department — Rajesh Kumar.'),
  ('00000000-0000-0000-0000-000000000401', 'Rajesh Kumar', 'accepted', 'Accepted', 'Site visit scheduled for tomorrow morning.'),
  ('00000000-0000-0000-0000-000000000401', 'Rajesh Kumar', 'status_update', 'In Progress', 'Asphalt team dispatched. Temporary cones placed.'),
  ('00000000-0000-0000-0000-000000000414', 'Ritesh Kumar', 'reported', 'Reported', 'Pothole at Danapur crossing reported with photo.'),
  ('00000000-0000-0000-0000-000000000414', 'Priya Sharma', 'assigned', 'Assigned', 'Forwarded to Arun Singh (Roads, Patna).'),
  ('00000000-0000-0000-0000-000000000415', 'Ritesh Kumar', 'reported', 'Reported', 'Garbage pile near community park — smell affecting residents.'),
  ('00000000-0000-0000-0000-000000000415', 'Arun Singh', 'status_update', 'In Progress', 'Cleanup crew assigned for tomorrow 6 AM.'),
  ('00000000-0000-0000-0000-000000000416', 'Ritesh Kumar', 'reported', 'Reported', 'Dark stretch outside DAV school — safety concern.'),
  ('00000000-0000-0000-0000-000000000416', 'Arun Singh', 'status_update', 'Resolved', 'LED street light installed and tested.'),
  ('00000000-0000-0000-0000-000000000416', 'Ritesh Kumar', 'citizen_verified', 'Citizen Verified', 'Confirmed — area is well lit now.'),
  ('00000000-0000-0000-0000-000000000403', 'Priya Menon', 'reported', 'Reported', 'Street light outage on school lane.'),
  ('00000000-0000-0000-0000-000000000403', 'Neha Deshmukh', 'status_update', 'Resolved', 'LED fixture replaced.'),
  ('00000000-0000-0000-0000-000000000403', 'Priya Menon', 'citizen_verified', 'Citizen Verified', 'Light working — thank you.'),
  ('00000000-0000-0000-0000-000000000404', 'Rohit Gupta', 'reported', 'Reported', 'Open manhole — urgent hazard on Linking Road.'),
  ('00000000-0000-0000-0000-000000000404', 'Suresh Patel', 'accepted', 'Accepted', 'Temporary barricade placed. Permanent cover ordered.'),
  ('00000000-0000-0000-0000-000000000407', 'Ananya Das', 'reported', 'Reported', 'Fallen tree branch after storm.'),
  ('00000000-0000-0000-0000-000000000407', 'Amit Verma', 'status_update', 'Resolved', 'Branch cleared. Lane reopened.'),
  ('00000000-0000-0000-0000-000000000418', 'Meera Thomas', 'reported', 'Reported', 'Low hanging wire — flagged as emergency.'),
  ('00000000-0000-0000-0000-000000000418', 'Jose Mathew', 'accepted', 'Accepted', 'KSEB team notified. Site visit within 2 hours.')
ON CONFLICT DO NOTHING;

INSERT INTO issue_tagged_officers (issue_id, officer_id, tagged_by) VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000310'),
  ('00000000-0000-0000-0000-000000000415', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000310'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000302')
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (name, phone, category, sort_order)
SELECT * FROM (VALUES
  ('Police', '112', 'Emergency', 1),
  ('Fire', '101', 'Emergency', 2),
  ('Ambulance', '108', 'Emergency', 3),
  ('Women Helpline', '1091', 'Support', 4)
) AS v(name, phone, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM emergency_contacts LIMIT 1);
