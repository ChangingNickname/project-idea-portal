// Список предметных областей и подкатегорий с i18nKey для локализации
export const subjectAreas = [
  {
    key: 'programming',
    label: 'Programming',
    icon: 'i-lucide-code',
    i18nKey: 'subjectAreas.programming._',
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
    key: 'engineering',
    label: 'Engineering',
    icon: 'i-lucide-settings',
    i18nKey: 'subjectAreas.engineering._',
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
    key: 'medicine',
    label: 'Medicine',
    icon: 'i-lucide-stethoscope',
    i18nKey: 'subjectAreas.medicine._',
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
    key: 'architecture',
    label: 'Architecture & Construction',
    icon: 'i-lucide-building',
    i18nKey: 'subjectAreas.architecture._',
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
    i18nKey: 'subjectAreas.design._',
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
    i18nKey: 'subjectAreas.economics._',
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
] 