import fs from 'fs';
import path from 'path';

// Construct paths based on project root (assuming script is run from root)
const basePath = path.join(process.cwd(), 'public/data');
const categoriesFile = path.join(basePath, 'categories.json');
const questionsDir = path.join(basePath, 'questions');

// 1. Read categories
const categoriesData = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));

// 2. Loop over categories and update levels
categoriesData.forEach((cat) => {
  const qFilePath = path.join(questionsDir, `${cat.id}.json`);
  if (fs.existsSync(qFilePath)) {
    const questions = JSON.parse(fs.readFileSync(qFilePath, 'utf8'));
    const allIds = questions.map((q) => q.id);

    // Split into chunks of 10 for levels
    const chunkSize = 10;
    const newLevels = [];

    // Create new levels based on the question IDs
    for (let i = 0; i < allIds.length; i += chunkSize) {
      const chunkIds = allIds.slice(i, i + chunkSize);
      newLevels.push({
        id: `level_${Math.floor(i / chunkSize) + 1}`,
        name: `第 ${Math.floor(i / chunkSize) + 1} 关`,
        questionIds: chunkIds,
      });
    }

    if (newLevels.length > 0) {
      // restore level 1 name if it existed in the original configuration
      if (cat.levels && cat.levels[0] && newLevels[0]) {
        newLevels[0].name = cat.levels[0].name;
      }
      cat.levels = newLevels;
    }
  }
});

// 3. Save categories.json back
fs.writeFileSync(categoriesFile, JSON.stringify(categoriesData, null, 2));

console.log('Categories updated with all questions from JSON files!');
