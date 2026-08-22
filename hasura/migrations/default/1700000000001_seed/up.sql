-- Demo clinic: Smile Care Dental, Mehdipatnam, Hyderabad
-- Staff login:  admin@smilecare.demo / clinic123

INSERT INTO clinics (
  id, name, slug, tagline, phone, email, timezone, booking_mode,
  booking_buffer_minutes, google_rating, google_review_count, about
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Smile Care Dental',
  'smile-care-mehdipatnam',
  'Gentle dentistry for families in Mehdipatnam.',
  '+91 90000 11111',
  'hello@smilecare.demo',
  'Asia/Kolkata',
  'request',
  30,
  4.8,
  312,
  'Smile Care Dental is a multi-doctor clinic in Mehdipatnam serving Hyderabad families with conservative dentistry, implants, orthodontics and cosmetic care. We built our schedule around same-week appointments and clear treatment plans — not waiting rooms that run an hour behind.'
);

INSERT INTO locations (
  id, clinic_id, name, address_line1, area, city, state, pincode, phone, google_maps_url, is_primary
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Mehdipatnam',
  '12-2-417/A, Pillar No. 32, Rethibowli Road',
  'Mehdipatnam',
  'Hyderabad',
  'Telangana',
  '500028',
  '+91 90000 11111',
  'https://maps.google.com/?q=Mehdipatnam+Hyderabad',
  true
);

INSERT INTO users (id, clinic_id, email, password_hash, name, role) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'admin@smilecare.demo',
  crypt('clinic123', gen_salt('bf')),
  'Clinic Admin',
  'clinic_admin'
);

INSERT INTO users (id, clinic_id, email, password_hash, name, role) VALUES (
  '33333333-3333-3333-3333-333333333334',
  NULL,
  'santh@santh.digital',
  crypt('clinic123', gen_salt('bf')),
  'Santh Kumar Gogikar',
  'platform_admin'
);

INSERT INTO doctors (id, clinic_id, location_id, name, slug, qualification, specialisation, experience_years, bio) VALUES
(
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Dr. Ananya Reddy',
  'ananya-reddy',
  'BDS, MDS (Conservative Dentistry)',
  'Root canal, fillings, smile design',
  11,
  'Dr. Ananya focuses on pain-managed conservative treatment. Patients often come in anxious about a root canal and leave with a clear plan and a same-visit start when appropriate.'
),
(
  '44444444-4444-4444-4444-444444444442',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Dr. Vikram Rao',
  'vikram-rao',
  'BDS, MDS (Oral & Maxillofacial Surgery)',
  'Implants, extractions, surgical consults',
  14,
  'Dr. Vikram leads implant and surgical cases. Consultations are structured so you understand options, timeline and after-care before any procedure is booked.'
);

INSERT INTO services (id, clinic_id, name, slug, description, duration_minutes, display_order) VALUES
(
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  'Dental Consultation',
  'dental-consultation',
  'New-patient or second-opinion exam, digital X-ray if needed, and a written treatment outline.',
  30,
  1
),
(
  '55555555-5555-5555-5555-555555555552',
  '11111111-1111-1111-1111-111111111111',
  'Teeth Cleaning',
  'teeth-cleaning',
  'Professional scaling and polishing for gum health and stain removal.',
  45,
  2
),
(
  '55555555-5555-5555-5555-555555555553',
  '11111111-1111-1111-1111-111111111111',
  'Root Canal Treatment',
  'root-canal-treatment',
  'Diagnosis and treatment of infected pulp, with same-week slots when clinically appropriate.',
  60,
  3
),
(
  '55555555-5555-5555-5555-555555555554',
  '11111111-1111-1111-1111-111111111111',
  'Dental Implant Consultation',
  'dental-implant-consultation',
  'Implant suitability, bone assessment discussion, and a staged treatment plan.',
  30,
  4
),
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Braces Consultation',
  'braces-consultation',
  'Orthodontic screening for teens and adults, including aligner vs braces guidance.',
  30,
  5
),
(
  '55555555-5555-5555-5555-555555555556',
  '11111111-1111-1111-1111-111111111111',
  'Teeth Whitening',
  'teeth-whitening',
  'In-clinic whitening consult and session planning for a controlled shade change.',
  60,
  6
);

INSERT INTO doctor_services (doctor_id, service_id) VALUES
('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551'),
('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555552'),
('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555553'),
('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555556'),
('44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555551'),
('44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555554'),
('44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555555');

-- Mon–Sat, two sessions: 10:00–14:00 and 17:00–20:00 (0 = Sunday)
INSERT INTO working_hours (clinic_id, doctor_id, location_id, day_of_week, start_time, end_time)
SELECT
  '11111111-1111-1111-1111-111111111111',
  d.id,
  '22222222-2222-2222-2222-222222222222',
  dow,
  sess.start_time,
  sess.end_time
FROM doctors d
CROSS JOIN generate_series(1, 6) AS dow
CROSS JOIN (
  VALUES (time '10:00', time '14:00'), (time '17:00', time '20:00')
) AS sess(start_time, end_time)
WHERE d.clinic_id = '11111111-1111-1111-1111-111111111111';
