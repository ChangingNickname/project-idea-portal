// Список предметных областей и подкатегорий с i18nKey для локализации
export const subjectAreas = [
  {
    key: 'languages',
    label: 'Languages',
    icon: 'i-lucide-globe',
    i18nKey: 'subjectAreas.languages',
    children: [
      { key: 'english', label: 'English', i18nKey: 'subjectAreas.languages.english' },
      { key: 'russian', label: 'Russian', i18nKey: 'subjectAreas.languages.russian' },
      { key: 'chinese', label: 'Chinese', i18nKey: 'subjectAreas.languages.chinese' },
      { key: 'spanish', label: 'Spanish', i18nKey: 'subjectAreas.languages.spanish' },
      { key: 'french', label: 'French', i18nKey: 'subjectAreas.languages.french' },
      { key: 'german', label: 'German', i18nKey: 'subjectAreas.languages.german' },
      { key: 'japanese', label: 'Japanese', i18nKey: 'subjectAreas.languages.japanese' },
      { key: 'arabic', label: 'Arabic', i18nKey: 'subjectAreas.languages.arabic' },
      { key: 'italian', label: 'Italian', i18nKey: 'subjectAreas.languages.italian' },
      { key: 'portuguese', label: 'Portuguese', i18nKey: 'subjectAreas.languages.portuguese' }
    ]
  },
  {
    key: 'programming',
    label: 'Programming',
    icon: 'i-lucide-code',
    i18nKey: 'subjectAreas.programming',
    children: [
      { key: 'web', label: 'Web Development', i18nKey: 'subjectAreas.programming.web' },
      { key: 'mobile', label: 'Mobile Development', i18nKey: 'subjectAreas.programming.mobile' },
      { key: 'backend', label: 'Backend Development', i18nKey: 'subjectAreas.programming.backend' },
      { key: 'frontend', label: 'Frontend Development', i18nKey: 'subjectAreas.programming.frontend' },
      { key: 'data_science', label: 'Data Science', i18nKey: 'subjectAreas.programming.data_science' },
      { key: 'ai', label: 'Artificial Intelligence', i18nKey: 'subjectAreas.programming.ai' },
      { key: 'ml', label: 'Machine Learning', i18nKey: 'subjectAreas.programming.ml' },
      { key: 'game', label: 'Game Development', i18nKey: 'subjectAreas.programming.game' },
      { key: 'devops', label: 'DevOps', i18nKey: 'subjectAreas.programming.devops' },
      { key: 'security', label: 'Security', i18nKey: 'subjectAreas.programming.security' },
      { key: 'algorithms', label: 'Algorithms & Data Structures', i18nKey: 'subjectAreas.programming.algorithms' },
      { key: 'testing', label: 'Testing & QA', i18nKey: 'subjectAreas.programming.testing' }
    ]
  },
  {
    key: 'networking',
    label: 'Network Administration',
    icon: 'i-lucide-network',
    i18nKey: 'subjectAreas.networking',
    children: [
      { key: 'network_security', label: 'Network Security', i18nKey: 'subjectAreas.networking.network_security' },
      { key: 'cloud', label: 'Cloud Computing', i18nKey: 'subjectAreas.networking.cloud' },
      { key: 'system_admin', label: 'System Administration', i18nKey: 'subjectAreas.networking.system_admin' },
      { key: 'virtualization', label: 'Virtualization', i18nKey: 'subjectAreas.networking.virtualization' },
      { key: 'wireless', label: 'Wireless Networks', i18nKey: 'subjectAreas.networking.wireless' },
      { key: 'routing', label: 'Routing & Switching', i18nKey: 'subjectAreas.networking.routing' },
      { key: 'voip', label: 'VoIP', i18nKey: 'subjectAreas.networking.voip' },
      { key: 'linux', label: 'Linux Administration', i18nKey: 'subjectAreas.networking.linux' },
      { key: 'windows', label: 'Windows Administration', i18nKey: 'subjectAreas.networking.windows' }
    ]
  },
  {
    key: 'engineering',
    label: 'Engineering',
    icon: 'i-lucide-settings',
    i18nKey: 'subjectAreas.engineering',
    children: [
      { key: 'mechanical', label: 'Mechanical Engineering', i18nKey: 'subjectAreas.engineering.mechanical' },
      { key: 'electrical', label: 'Electrical Engineering', i18nKey: 'subjectAreas.engineering.electrical' },
      { key: 'civil', label: 'Civil Engineering', i18nKey: 'subjectAreas.engineering.civil' },
      { key: 'chemical', label: 'Chemical Engineering', i18nKey: 'subjectAreas.engineering.chemical' },
      { key: 'software', label: 'Software Engineering', i18nKey: 'subjectAreas.engineering.software' },
      { key: 'aerospace', label: 'Aerospace Engineering', i18nKey: 'subjectAreas.engineering.aerospace' },
      { key: 'biomedical', label: 'Biomedical Engineering', i18nKey: 'subjectAreas.engineering.biomedical' },
      { key: 'environmental', label: 'Environmental Engineering', i18nKey: 'subjectAreas.engineering.environmental' },
      { key: 'industrial', label: 'Industrial Engineering', i18nKey: 'subjectAreas.engineering.industrial' },
      { key: 'robotics', label: 'Robotics', i18nKey: 'subjectAreas.engineering.robotics' }
    ]
  },
  {
    key: 'biology',
    label: 'Biology',
    icon: 'i-lucide-dna',
    i18nKey: 'subjectAreas.biology',
    children: [
      { key: 'genetics', label: 'Genetics', i18nKey: 'subjectAreas.biology.genetics' },
      { key: 'microbiology', label: 'Microbiology', i18nKey: 'subjectAreas.biology.microbiology' },
      { key: 'biochemistry', label: 'Biochemistry', i18nKey: 'subjectAreas.biology.biochemistry' },
      { key: 'molecular', label: 'Molecular Biology', i18nKey: 'subjectAreas.biology.molecular' },
      { key: 'zoology', label: 'Zoology', i18nKey: 'subjectAreas.biology.zoology' },
      { key: 'botany', label: 'Botany', i18nKey: 'subjectAreas.biology.botany' },
      { key: 'ecology', label: 'Ecology', i18nKey: 'subjectAreas.biology.ecology' },
      { key: 'physiology', label: 'Physiology', i18nKey: 'subjectAreas.biology.physiology' },
      { key: 'cell', label: 'Cell Biology', i18nKey: 'subjectAreas.biology.cell' },
      { key: 'evolution', label: 'Evolutionary Biology', i18nKey: 'subjectAreas.biology.evolution' }
    ]
  },
  // --- New areas below ---
  {
    key: 'medicine',
    label: 'Medicine',
    icon: 'i-lucide-stethoscope',
    i18nKey: 'subjectAreas.medicine',
    children: [
      { key: 'general', label: 'General Medicine', i18nKey: 'subjectAreas.medicine.general' },
      { key: 'surgery', label: 'Surgery', i18nKey: 'subjectAreas.medicine.surgery' },
      { key: 'pediatrics', label: 'Pediatrics', i18nKey: 'subjectAreas.medicine.pediatrics' },
      { key: 'psychiatry', label: 'Psychiatry', i18nKey: 'subjectAreas.medicine.psychiatry' },
      { key: 'neurology', label: 'Neurology', i18nKey: 'subjectAreas.medicine.neurology' },
      { key: 'cardiology', label: 'Cardiology', i18nKey: 'subjectAreas.medicine.cardiology' },
      { key: 'oncology', label: 'Oncology', i18nKey: 'subjectAreas.medicine.oncology' },
      { key: 'dentistry', label: 'Dentistry', i18nKey: 'subjectAreas.medicine.dentistry' },
      { key: 'pharmacy', label: 'Pharmacy', i18nKey: 'subjectAreas.medicine.pharmacy' },
      { key: 'public_health', label: 'Public Health', i18nKey: 'subjectAreas.medicine.public_health' },
      { key: 'medical_research', label: 'Medical Research', i18nKey: 'subjectAreas.medicine.medical_research' }
    ]
  },
  {
    key: 'sports',
    label: 'Sports & Physical Education',
    icon: 'i-lucide-dumbbell',
    i18nKey: 'subjectAreas.sports',
    children: [
      { key: 'sports_science', label: 'Sports Science', i18nKey: 'subjectAreas.sports.sports_science' },
      { key: 'coaching', label: 'Coaching', i18nKey: 'subjectAreas.sports.coaching' },
      { key: 'physical_therapy', label: 'Physical Therapy', i18nKey: 'subjectAreas.sports.physical_therapy' },
      { key: 'sports_medicine', label: 'Sports Medicine', i18nKey: 'subjectAreas.sports.sports_medicine' },
      { key: 'fitness', label: 'Fitness Training', i18nKey: 'subjectAreas.sports.fitness' },
      { key: 'nutrition', label: 'Nutrition', i18nKey: 'subjectAreas.sports.nutrition' },
      { key: 'kinesiology', label: 'Kinesiology', i18nKey: 'subjectAreas.sports.kinesiology' },
      { key: 'athletic_training', label: 'Athletic Training', i18nKey: 'subjectAreas.sports.athletic_training' },
      { key: 'sports_management', label: 'Sports Management', i18nKey: 'subjectAreas.sports.sports_management' }
    ]
  },
  {
    key: 'geology',
    label: 'Geology & Earth Sciences',
    icon: 'i-lucide-mountain',
    i18nKey: 'subjectAreas.geology',
    children: [
      { key: 'geology', label: 'Geology', i18nKey: 'subjectAreas.geology.geology' },
      { key: 'geophysics', label: 'Geophysics', i18nKey: 'subjectAreas.geology.geophysics' },
      { key: 'geochemistry', label: 'Geochemistry', i18nKey: 'subjectAreas.geology.geochemistry' },
      { key: 'paleontology', label: 'Paleontology', i18nKey: 'subjectAreas.geology.paleontology' },
      { key: 'seismology', label: 'Seismology', i18nKey: 'subjectAreas.geology.seismology' },
      { key: 'oceanography', label: 'Oceanography', i18nKey: 'subjectAreas.geology.oceanography' },
      { key: 'meteorology', label: 'Meteorology', i18nKey: 'subjectAreas.geology.meteorology' },
      { key: 'hydrology', label: 'Hydrology', i18nKey: 'subjectAreas.geology.hydrology' },
      { key: 'environmental_geology', label: 'Environmental Geology', i18nKey: 'subjectAreas.geology.environmental_geology' }
    ]
  },
  {
    key: 'architecture',
    label: 'Architecture & Construction',
    icon: 'i-lucide-building',
    i18nKey: 'subjectAreas.architecture',
    children: [
      { key: 'architecture', label: 'Architecture', i18nKey: 'subjectAreas.architecture.architecture' },
      { key: 'urban_planning', label: 'Urban Planning', i18nKey: 'subjectAreas.architecture.urban_planning' },
      { key: 'landscape', label: 'Landscape Architecture', i18nKey: 'subjectAreas.architecture.landscape' },
      { key: 'interior', label: 'Interior Design', i18nKey: 'subjectAreas.architecture.interior' },
      { key: 'civil_construction', label: 'Civil Construction', i18nKey: 'subjectAreas.architecture.civil_construction' },
      { key: 'structural', label: 'Structural Engineering', i18nKey: 'subjectAreas.architecture.structural' },
      { key: 'building_tech', label: 'Building Technology', i18nKey: 'subjectAreas.architecture.building_tech' },
      { key: 'sustainable', label: 'Sustainable Design', i18nKey: 'subjectAreas.architecture.sustainable' }
    ]
  },
  {
    key: 'design',
    label: 'Design & Arts',
    icon: 'i-lucide-palette',
    i18nKey: 'subjectAreas.design',
    children: [
      { key: 'graphic', label: 'Graphic Design', i18nKey: 'subjectAreas.design.graphic' },
      { key: 'industrial', label: 'Industrial Design', i18nKey: 'subjectAreas.design.industrial' },
      { key: 'fashion', label: 'Fashion Design', i18nKey: 'subjectAreas.design.fashion' },
      { key: 'interior', label: 'Interior Design', i18nKey: 'subjectAreas.design.interior' },
      { key: 'animation', label: 'Animation', i18nKey: 'subjectAreas.design.animation' },
      { key: 'photography', label: 'Photography', i18nKey: 'subjectAreas.design.photography' },
      { key: 'fine_arts', label: 'Fine Arts', i18nKey: 'subjectAreas.design.fine_arts' },
      { key: 'digital_arts', label: 'Digital Arts', i18nKey: 'subjectAreas.design.digital_arts' },
      { key: 'uiux', label: 'UI/UX Design', i18nKey: 'subjectAreas.design.uiux' }
    ]
  },
  {
    key: 'economics',
    label: 'Economics & Management',
    icon: 'i-lucide-bar-chart-2',
    i18nKey: 'subjectAreas.economics',
    children: [
      { key: 'economics', label: 'Economics', i18nKey: 'subjectAreas.economics.economics' },
      { key: 'finance', label: 'Finance', i18nKey: 'subjectAreas.economics.finance' },
      { key: 'accounting', label: 'Accounting', i18nKey: 'subjectAreas.economics.accounting' },
      { key: 'marketing', label: 'Marketing', i18nKey: 'subjectAreas.economics.marketing' },
      { key: 'management', label: 'Management', i18nKey: 'subjectAreas.economics.management' },
      { key: 'entrepreneurship', label: 'Entrepreneurship', i18nKey: 'subjectAreas.economics.entrepreneurship' },
      { key: 'business_analytics', label: 'Business Analytics', i18nKey: 'subjectAreas.economics.business_analytics' },
      { key: 'hr', label: 'Human Resources', i18nKey: 'subjectAreas.economics.hr' }
    ]
  },
  {
    key: 'education',
    label: 'Education & Pedagogy',
    icon: 'i-lucide-graduation-cap',
    i18nKey: 'subjectAreas.education',
    children: [
      { key: 'ed_tech', label: 'Educational Technology', i18nKey: 'subjectAreas.education.ed_tech' },
      { key: 'curriculum', label: 'Curriculum Development', i18nKey: 'subjectAreas.education.curriculum' },
      { key: 'special_ed', label: 'Special Education', i18nKey: 'subjectAreas.education.special_ed' },
      { key: 'early_childhood', label: 'Early Childhood Education', i18nKey: 'subjectAreas.education.early_childhood' },
      { key: 'higher_ed', label: 'Higher Education', i18nKey: 'subjectAreas.education.higher_ed' },
      { key: 'ed_psychology', label: 'Educational Psychology', i18nKey: 'subjectAreas.education.ed_psychology' },
      { key: 'distance', label: 'Distance Learning', i18nKey: 'subjectAreas.education.distance' }
    ]
  },
  {
    key: 'physics',
    label: 'Physics & Mathematics',
    icon: 'i-lucide-atom',
    i18nKey: 'subjectAreas.physics',
    children: [
      { key: 'theoretical', label: 'Theoretical Physics', i18nKey: 'subjectAreas.physics.theoretical' },
      { key: 'applied', label: 'Applied Physics', i18nKey: 'subjectAreas.physics.applied' },
      { key: 'astrophysics', label: 'Astrophysics', i18nKey: 'subjectAreas.physics.astrophysics' },
      { key: 'quantum', label: 'Quantum Mechanics', i18nKey: 'subjectAreas.physics.quantum' },
      { key: 'pure_math', label: 'Pure Mathematics', i18nKey: 'subjectAreas.physics.pure_math' },
      { key: 'applied_math', label: 'Applied Mathematics', i18nKey: 'subjectAreas.physics.applied_math' },
      { key: 'statistics', label: 'Statistics', i18nKey: 'subjectAreas.physics.statistics' }
    ]
  },
  {
    key: 'chemistry',
    label: 'Chemistry',
    icon: 'i-lucide-flask-round',
    i18nKey: 'subjectAreas.chemistry',
    children: [
      { key: 'organic', label: 'Organic Chemistry', i18nKey: 'subjectAreas.chemistry.organic' },
      { key: 'inorganic', label: 'Inorganic Chemistry', i18nKey: 'subjectAreas.chemistry.inorganic' },
      { key: 'analytical', label: 'Analytical Chemistry', i18nKey: 'subjectAreas.chemistry.analytical' },
      { key: 'physical', label: 'Physical Chemistry', i18nKey: 'subjectAreas.chemistry.physical' },
      { key: 'biochemistry', label: 'Biochemistry', i18nKey: 'subjectAreas.chemistry.biochemistry' },
      { key: 'chemical_engineering', label: 'Chemical Engineering', i18nKey: 'subjectAreas.chemistry.chemical_engineering' }
    ]
  },
  {
    key: 'social_sciences',
    label: 'Social Sciences',
    icon: 'i-lucide-users',
    i18nKey: 'subjectAreas.social_sciences',
    children: [
      { key: 'sociology', label: 'Sociology', i18nKey: 'subjectAreas.social_sciences.sociology' },
      { key: 'psychology', label: 'Psychology', i18nKey: 'subjectAreas.social_sciences.psychology' },
      { key: 'political', label: 'Political Science', i18nKey: 'subjectAreas.social_sciences.political' },
      { key: 'anthropology', label: 'Anthropology', i18nKey: 'subjectAreas.social_sciences.anthropology' },
      { key: 'history', label: 'History', i18nKey: 'subjectAreas.social_sciences.history' },
      { key: 'law', label: 'Law', i18nKey: 'subjectAreas.social_sciences.law' },
      { key: 'linguistics', label: 'Linguistics', i18nKey: 'subjectAreas.social_sciences.linguistics' }
    ]
  }
] 