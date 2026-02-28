import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_PATH = path.join(__dirname, 'public/data/categories.json');
const QUESTIONS_DIR = path.join(__dirname, 'public/data/questions');
const GALLERY_DIR = path.join(__dirname, 'public/data/gallery');

// Update existing groups based on the plan
const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf-8'));
categories.forEach((cat) => {
  if (['car_logos', 'flowers'].includes(cat.id)) cat.groupId = 'nature';
  if (['flags'].includes(cat.id)) cat.groupId = 'nature';
});

// A sample category: renting_traps
const newCategory = {
  id: 'renting_traps',
  name: '租房避坑指南',
  icon: '🏠',
  groupId: 'adulting',
  levels: [
    {
      id: 'level_1',
      name: '新手租客',
      questionIds: ['rt_1'],
    },
  ],
};

if (!categories.find((c) => c.id === newCategory.id)) {
  categories.push(newCategory);
}

fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2), 'utf-8');

// The question logic
const questions = [
  {
    id: 'rt_1',
    type: 'text',
    prompt: '你正在看房，中介指着一份合同说‘这是劳务合同，和劳动合同一样的’，你该怎么做？',
    text: '你正在看房，中介指着一份合同说‘这是劳务合同，和劳动合同一样的’，你该怎么做？',
    options: ['马上签，一样', '不能签，不受劳动法保护', '拍个照问爸妈', '两者可以互换'],
    answer: '不能签，不受劳动法保护',
    fact: '【辟谣】劳务合同不受《劳动法》保护，不强制交纳五险一金，被辞退也没有经济补偿。一定要认准“劳动合同”。',
    difficulty: 1,
  },
];

fs.writeFileSync(path.join(QUESTIONS_DIR, 'renting_traps.json'), JSON.stringify(questions, null, 2), 'utf-8');

// The gallery logic
const gallery = [
  {
    id: 'rt_1',
    name: '劳动合同与劳务合同',
    description: '这是关于劳动法保护的租房与职场防坑冷知识。',
    fact: '【辟谣】劳务合同不受《劳动法》保护，不强制交纳五险一金，被辞退也没有经济补偿。一定要认准“劳动合同”。',
  },
];

fs.writeFileSync(path.join(GALLERY_DIR, 'renting_traps.json'), JSON.stringify(gallery, null, 2), 'utf-8');

console.log('Scaffolded new categories and groups successfully.');
