// ─── Dental conditions ────────────────────────────────────────────────────

export const DENTAL_CONDITIONS = [
  { value: 'crown',      label: 'Crown',             icon: 'crown' },
  { value: 'cleaning',   label: 'Teeth Cleaning',    icon: 'cleaning_services' },
  { value: 'extraction', label: 'Tooth Extraction',  icon: 'dentistry' },
  { value: 'braces',     label: 'Braces / Alignment',icon: 'straighten' },
  { value: 'rootcanal',  label: 'Root Canal',        icon: 'healing' },
  { value: 'other',      label: 'Other / Consultation', icon: 'help_outline' },
];

export const conditionLabel = (value) =>
  DENTAL_CONDITIONS.find((c) => c.value === value)?.label ?? value;

// ─── Appointment statuses ─────────────────────────────────────────────────

export const STATUS_MAP = {
  pending   : { label: 'Pending Review', color: 'badge-pending',   icon: 'pending_actions' },
  confirmed : { label: 'Confirmed',      color: 'badge-confirmed', icon: 'check_circle'    },
  rejected  : { label: 'Rejected',       color: 'badge-rejected',  icon: 'cancel'          },
  completed : { label: 'Completed',      color: 'badge-completed', icon: 'task_alt'        },
};

// ─── Days of week ─────────────────────────────────────────────────────────

export const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Navigation ───────────────────────────────────────────────────────────

export const PATIENT_NAV = [
  { label: 'Dashboard',        href: '/dashboard',     icon: 'dashboard'        },
  { label: 'Book Appointment', href: '/book',           icon: 'calendar_today'   },
  { label: 'My Doctors',       href: '/doctors',        icon: 'medical_services' },
  { label: 'My Visits',        href: '/appointments',   icon: 'event_note'       },
];

export const SECRETARY_NAV = [
  { label: 'Overview',     href: '/secretary/dashboard',     icon: 'dashboard'        },
  { label: 'Appointments', href: '/secretary/appointments',  icon: 'calendar_today'   },
  { label: 'Doctors',      href: '/secretary/doctors',       icon: 'medical_services' },
  { label: 'Patients',     href: '/secretary/patients',      icon: 'group'            },
];

export const DOCTOR_NAV = [
  { label: 'My Schedule',   href: '/doctor/schedule',      icon: 'calendar_today'   },
  { label: 'My Patients',   href: '/doctor/patients',      icon: 'group'            },
  { label: 'Appointments',  href: '/doctor/appointments',  icon: 'event_note'       },
];
