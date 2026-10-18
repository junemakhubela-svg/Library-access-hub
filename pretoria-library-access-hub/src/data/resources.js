// Domain data for the Pretoria Public Library — Adaptive Learning & Resource Portal.
// In production this would come from the library's catalogue API.

export const CATEGORIES = [
  { id: 'courses', label: 'Courses', singular: 'Course', action: 'Enrol in this course' },
  {
    id: 'archives',
    label: 'Digital archives',
    singular: 'Digital archive',
    action: 'Book an archive research session',
  },
  { id: 'events', label: 'Events', singular: 'Event', action: 'Register for this event' },
  { id: 'rooms', label: 'Study rooms', singular: 'Study room', action: 'Reserve this room' },
];

export const FORMATS = [
  { id: 'online', label: 'Online' },
  { id: 'in-person', label: 'In person' },
];

export const FEATURES = [
  { id: 'captioned', label: 'Captions available' },
  { id: 'step-free', label: 'Step-free access' },
  { id: 'screen-reader', label: 'Screen-reader tested' },
  { id: 'hearing-loop', label: 'Hearing loop' },
];

export const RESOURCES = [
  {
    id: 'digital-skills',
    title: 'Digital Skills for Work',
    category: 'courses',
    format: 'in-person',
    features: ['screen-reader', 'step-free', 'hearing-loop'],
    schedule: 'Tuesdays, 18:00–20:00 (6 weeks)',
    location: 'Learning Lab, Level 1',
    summary: 'Email, documents and online job applications in a six-week course.',
    description:
      'A practical course covering email, word processing, cloud storage and online job applications. Every workstation has NVDA, JAWS and ZoomText installed, and all handouts are available in accessible Word and braille-ready formats.',
    capacity: '8 places remaining',
  },
  {
    id: 'isizulu-beginners',
    title: 'isiZulu for Beginners',
    category: 'courses',
    format: 'online',
    features: ['captioned', 'screen-reader'],
    schedule: 'Thursdays, 19:00–20:00 (8 weeks)',
    location: 'Online video classroom',
    summary: 'Conversational isiZulu for everyday situations, taught live online.',
    description:
      'Learn greetings, numbers and everyday conversation in a friendly live class. Sessions are captioned and recordings are published with transcripts within 24 hours.',
    capacity: '14 places remaining',
  },
  {
    id: 'coding-club',
    title: 'Family Coding Club',
    category: 'courses',
    format: 'in-person',
    features: ['step-free'],
    schedule: 'Saturdays, 10:00–11:30',
    location: 'Children’s Library, Ground floor',
    summary: 'Block-based coding for children aged 8–13 and their grown-ups.',
    description:
      'Build simple games and animations together. Tablets with switch access and large-print guides are available on request.',
    capacity: '5 family places remaining',
  },
  {
    id: 'oral-histories',
    title: 'Pretoria Oral Histories',
    category: 'archives',
    format: 'online',
    features: ['captioned', 'screen-reader'],
    schedule: 'Available 24/7; guided sessions on weekdays',
    location: 'Online collection',
    summary: '120 recorded interviews with residents, each with a full transcript.',
    description:
      'Audio interviews recorded between 1985 and 2024 with full text transcripts and chapter markers. Book a guided research session and an archivist will help you search the collection.',
    capacity: 'Guided sessions available',
  },
  {
    id: 'newspaper-archive',
    title: 'Pretoria Herald Newspaper Archive',
    category: 'archives',
    format: 'online',
    features: ['screen-reader'],
    schedule: 'Available 24/7; guided sessions on weekdays',
    location: 'Online collection',
    summary: 'Digitised local newspapers from 1921 to 1999 with searchable text.',
    description:
      'Every page has been processed with corrected text recognition so the full text can be read with a screen reader or magnifier.',
    capacity: 'Guided sessions available',
  },
  {
    id: 'photo-archive',
    title: 'Historic Photo Collection',
    category: 'archives',
    format: 'in-person',
    features: ['step-free', 'hearing-loop'],
    schedule: 'Weekdays, 09:00–16:00 by appointment',
    location: 'Heritage Room, Level 2',
    summary: '4,000 photographs of Pretoria with written descriptions.',
    description:
      'View original prints and negatives with an archivist. Every digitised image has a detailed text description, and tactile reproductions of selected images are available.',
    capacity: '3 appointments this week',
  },
  {
    id: 'film-night',
    title: 'Audio-Described Film Night',
    category: 'events',
    format: 'in-person',
    features: ['step-free', 'hearing-loop', 'captioned'],
    schedule: 'Last Friday of the month, 18:30',
    location: 'Community Hall',
    summary: 'A monthly screening with live audio description and open captions.',
    description:
      'Enjoy a feature film with live audio description through headsets, open captions on screen and a hearing loop in the hall. Guide dogs are welcome and there is a quiet room available.',
    capacity: '22 seats remaining',
  },
  {
    id: 'author-talk',
    title: 'Local Authors Evening',
    category: 'events',
    format: 'online',
    features: ['captioned'],
    schedule: 'Wednesday 28 October, 18:00',
    location: 'Online livestream',
    summary: 'Three Pretoria writers read from new work and take questions.',
    description:
      'A livestreamed panel with human-edited live captions. Questions can be sent in advance through the booking form or typed in the chat during the event.',
    capacity: 'Unlimited online places',
  },
  {
    id: 'job-fair',
    title: 'Community Careers Fair',
    category: 'events',
    format: 'in-person',
    features: ['step-free', 'hearing-loop', 'screen-reader'],
    schedule: 'Saturday 7 November, 09:00–13:00',
    location: 'Main Hall and Learning Lab',
    summary: 'Meet local employers, with CV help and accessible job-search stations.',
    description:
      'Over 30 local employers, CV-writing support and accessible computer stations. Book a time slot to avoid queues and tell us about any support you need on the day.',
    capacity: '60 slots remaining',
  },
  {
    id: 'room-a',
    title: 'Quiet Study Room A',
    category: 'rooms',
    format: 'in-person',
    features: ['step-free', 'screen-reader'],
    schedule: 'Daily, bookable in 2-hour slots',
    location: 'Level 2, step-free lift access',
    summary: 'Seats four. Includes a PC with NVDA and JAWS installed.',
    description:
      'A quiet room with an adjustable-height desk, a PC with NVDA, JAWS and ZoomText, a braille embosser on request and controllable lighting.',
    capacity: 'Seats up to 4',
  },
  {
    id: 'room-b',
    title: 'Group Study Room B',
    category: 'rooms',
    format: 'in-person',
    features: ['step-free', 'hearing-loop'],
    schedule: 'Daily, bookable in 2-hour slots',
    location: 'Level 1, next to the Learning Lab',
    summary: 'Seats eight, with a large display and a portable hearing loop.',
    description:
      'A group room with a large wall display, whiteboard, portable hearing loop and step-free access from the main entrance.',
    capacity: 'Seats up to 8',
  },
  {
    id: 'room-sensory',
    title: 'Low-Sensory Study Pod',
    category: 'rooms',
    format: 'in-person',
    features: ['step-free'],
    schedule: 'Daily, bookable in 1-hour slots',
    location: 'Ground floor, east wing',
    summary: 'A dimmable, sound-dampened pod for one person.',
    description:
      'Designed with neurodivergent visitors in mind: dimmable lighting, acoustic panels and no fluorescent tubes. Noise-cancelling headphones are available at the front desk.',
    capacity: 'Seats 1',
  },
];

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id);
}

export function getResource(id) {
  return RESOURCES.find((resource) => resource.id === id);
}

export function labelFor(list, id) {
  return list.find((item) => item.id === id)?.label ?? id;
}
