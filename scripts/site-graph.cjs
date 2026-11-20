// Public pages and their reciprocal, contextual links. HTML is generated at edit time,
// not in the browser, so navigation also works without JavaScript and in offline apps.
const pages = {
  index: {label: 'হোম', kind: 'home', icon: '🏫'},
  science: {label: 'বিজ্ঞান বিভাগ', kind: 'department', icon: '🔬'},
  arts: {label: 'মানবিক বিভাগ', kind: 'department', icon: '📖'},
  commerce: {label: 'ব্যবসায় শিক্ষা', kind: 'department', icon: '💼'},
  bangla: {label: 'বাংলা ১ম পত্র', kind: 'subject', icon: '📚'},
  'bangla-2': {label: 'বাংলা ২য় পত্র', kind: 'subject', icon: '📚'},
  english: {label: 'English 1st Paper', kind: 'subject', icon: '🌍'},
  'english-2': {label: 'English 2nd Paper', kind: 'subject', icon: '📘'},
  ict: {label: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', shortLabel: 'ICT', kind: 'subject', icon: '💻'},
  physics: {label: 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র', shortLabel: 'পদার্থবিজ্ঞান', kind: 'subject', icon: '⚛️'},
  chemistry: {label: 'রসায়ন ১ম ও ২য় পত্র', shortLabel: 'রসায়ন', kind: 'subject', icon: '🧪'},
  math: {label: 'উচ্চতর গণিত ১ম ও ২য় পত্র', shortLabel: 'উচ্চতর গণিত', kind: 'subject', icon: '📐'},
  biology: {label: 'জীববিজ্ঞান ১ম ও ২য় পত্র', shortLabel: 'জীববিজ্ঞান', kind: 'subject', icon: '🧬'},
  sociology: {label: 'সমাজবিজ্ঞান ১ম ও ২য় পত্র', shortLabel: 'সমাজবিজ্ঞান', kind: 'subject', icon: '👥'},
  civics: {label: 'পৌরনীতি ও সুশাসন', kind: 'subject', icon: '🏛️'},
  economics: {label: 'অর্থনীতি ১ম ও ২য় পত্র', shortLabel: 'অর্থনীতি', kind: 'subject', icon: '📈'},
  history: {label: 'ইতিহাস ১ম ও ২য় পত্র', shortLabel: 'ইতিহাস', kind: 'subject', icon: '📜'},
  accounting: {label: 'হিসাববিজ্ঞান ১ম ও ২য় পত্র', shortLabel: 'হিসাববিজ্ঞান', kind: 'subject', icon: '🧮'},
  business: {label: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', kind: 'subject', icon: '🚀'},
  finance: {label: 'ফিন্যান্স, ব্যাংকিং ও বিমা', kind: 'subject', icon: '🏦'},
  marketing: {label: 'উৎপাদন ব্যবস্থাপনা ও বিপণন', kind: 'subject', icon: '📣'},
  classes: {label: 'অনলাইন ক্লাস', kind: 'tool', icon: '🎥'},
  tracker: {label: 'অধ্যায় ট্র্যাকার', kind: 'tool', icon: '✅'},
  routine: {label: 'স্টাডি রুটিন', kind: 'tool', icon: '🕐'},
  'college-info': {label: 'কলেজ পরিচিতি ও ভিজিল্যান্স টিম', kind: 'college', icon: '🏫'},
  teachers: {label: 'শিক্ষক পরিচিতি', kind: 'college', icon: '👩‍🏫'},
  'college-routine': {label: 'কলেজের ক্লাস রুটিন', kind: 'college', icon: '🗓️'},
  'hsc-2027-routine': {label: 'HSC ২০২৭ সম্ভাব্য রুটিন · চূড়ান্ত নয়', kind: 'college', icon: '📋'},
  'honours-info': {label: 'স্নাতক (সম্মান): বাংলা ও ইতিহাস', kind: 'college', icon: '🎓'},
  'student-group': {label: 'শিক্ষার্থী গ্রুপ', kind: 'college', icon: '💬'},
  'android-app': {label: 'অ্যাপ ডাউনলোড', kind: 'help', icon: '📱'},
  feedback: {label: 'মতামত ও সমস্যা জানাও', kind: 'help', icon: '💬'},
};

const subjectGroups = {
  common: ['bangla', 'bangla-2', 'english', 'english-2', 'ict'],
  science: ['physics', 'chemistry', 'math', 'biology'],
  arts: ['sociology', 'civics', 'economics', 'history'],
  commerce: ['accounting', 'business', 'finance', 'marketing'],
};
const idsOfKind = kind => Object.keys(pages).filter(id => pages[id].kind === kind);
const subjects = idsOfKind('subject');
const departments = idsOfKind('department');
const tools = idsOfKind('tool');
const college = idsOfKind('college');
const graph = Object.fromEntries(Object.keys(pages).map(id => [id, new Set()]));
function connect(a, b) {
  if (!graph[a] || !graph[b] || a === b) throw new Error(`Invalid page connection: ${a} / ${b}`);
  graph[a].add(b);
  graph[b].add(a);
}
function connectGroup(ids) {
  ids.forEach((a, i) => ids.slice(i + 1).forEach(b => connect(a, b)));
}

// Home is an entry point, not a compulsory parent or a required step between pages.
for (const id of Object.keys(pages).filter(id => id !== 'index')) connect('index', id);
connectGroup(departments);
for (const group of Object.values(subjectGroups)) connectGroup(group);
for (const department of departments) {
  for (const subject of [...subjectGroups.common, ...subjectGroups[department]]) connect(department, subject);
  for (const id of ['teachers', 'college-routine', 'hsc-2027-routine']) connect(department, id);
}
connectGroup(tools);
for (const tool of tools) {
  for (const id of [...subjects, ...departments, 'android-app', 'feedback']) connect(tool, id);
}
connectGroup(college);
connect('classes', 'teachers');
connect('routine', 'college-routine');
connect('routine', 'hsc-2027-routine');
connect('tracker', 'hsc-2027-routine');
connect('student-group', 'feedback');
connect('student-group', 'android-app');
connect('android-app', 'feedback');

const fileOf = id => `${id}.html`;
function hrefFor(from, to) {
  // Jump straight to this subject's resources, without changing any storage key.
  const fragment = pages[from].kind === 'subject' && ['classes', 'tracker'].includes(to)
    ? `#${to === 'classes' ? 'class' : 'track'}-${from}` : '';
  return fileOf(to) + fragment;
}
const neighborsOf = id => Object.keys(pages).filter(other => graph[id].has(other));
module.exports = {pages, subjectGroups, subjects, departments, tools, college, graph, fileOf, hrefFor, neighborsOf};
