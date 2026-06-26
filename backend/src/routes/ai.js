import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const departmentByCategory = {
  Pothole: 'Roads',
  Roads: 'Roads',
  'Traffic Signal': 'Roads',
  Drainage: 'Sanitation',
  Sanitation: 'Sanitation',
  'Street Lighting': 'Street Lighting',
  Electricity: 'Electrical',
  Water: 'Sanitation',
  Emergency: 'Emergency Response',
  'Public Property': 'Roads',
  'General Civic Issue': 'Roads'
};

function classify(text = '') {
  const value = text.toLowerCase();
  const rules = [
    ['Emergency', /\b(fire|accident|injur|collapse|danger|live wire|gas leak|emergency)\b/],
    ['Drainage', /\b(flood|drain|drainage|sewer|sewage|waterlog|manhole|overflow)\b/],
    ['Sanitation', /\b(garbage|waste|trash|rubbish|dump|litter|bin|collection)\b/],
    ['Street Lighting', /\b(street ?light|light|lamp|dark|pole light)\b/],
    ['Electricity', /\b(power|electric|wire|transformer|outage|spark)\b/],
    ['Water', /\b(water leak|pipeline|pipe|tap|drinking water|no water|contaminated water)\b/],
    ['Traffic Signal', /\b(signal|traffic light|zebra|crossing|traffic jam|congestion)\b/],
    ['Roads', /\b(road|pothole|pavement|footpath|sidewalk|crack|speed breaker|blocked road)\b/],
    ['Public Property', /\b(park|bench|public toilet|bus stop|signboard|fence|playground)\b/]
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] || 'General Civic Issue';
}

function severityFor(text = '') {
  const value = text.toLowerCase();
  if (/\b(fire|accident|injur|emergency|live wire|collapse|gas leak)\b/.test(value)) return 'Emergency';
  if (/\b(school|hospital|major|blocked|overflow|flood|danger|busy road|main road)\b/.test(value)) return 'High';
  if (/\b(minor|small|low priority|not urgent)\b/.test(value)) return 'Low';
  return 'Medium';
}

function confidenceFor(text, category, imageOnly = false) {
  const meaningfulWords = String(text || '').toLowerCase().match(/[a-z0-9]{4,}/g) || [];
  if (imageOnly || meaningfulWords.length < 3) return 35;
  if (category === 'General Civic Issue') return 55;
  return Math.min(92, 68 + meaningfulWords.length * 3);
}

function titleFor(category, severity) {
  if (severity === 'Emergency') return 'Emergency civic issue needs urgent review';
  if (category === 'General Civic Issue') return 'Civic issue needs department review';
  return `${category} issue needs department review`;
}

router.post('/analyze-image', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a photo (JPEG or PNG, max 5 MB).' });
  }
  const text = `${req.body?.title || ''} ${req.body?.description || ''}`.trim();
  const hasUsefulText = text.split(/\s+/).filter((word) => word.length > 3).length >= 3;
  const category = hasUsefulText ? classify(text) : 'General Civic Issue';
  const severity = hasUsefulText ? severityFor(text) : 'Medium';
  const confidenceScore = confidenceFor(text, category, !hasUsefulText);
  res.json({
    category,
    predictedCategory: category,
    confidenceScore,
    suggestedDepartment: departmentByCategory[category] || 'Municipal Operations',
    priorityLevel: severity === 'Emergency' ? 'Emergency' : severity === 'High' ? 'High' : 'Medium',
    severity,
    evidenceBased: hasUsefulText ? 'text-and-photo-upload' : 'photo-upload-only',
    needsManualReview: !hasUsefulText,
    generatedTitle: titleFor(category, severity),
    generatedDescription:
      hasUsefulText
        ? `The report details suggest ${category.toLowerCase()}. Please confirm the category, priority, photo, and exact location before submitting.`
        : 'Photo uploaded. Please add a clear description of the problem so the platform can suggest the correct department.'
  });
});

router.post('/classify', authenticate, (req, res) => {
  const text = `${req.body?.title || ''} ${req.body?.description || ''}`;
  const category = classify(text);
  const severity = severityFor(text);
  res.json({
    predictedCategory: category,
    confidenceScore: confidenceFor(text, category),
    suggestedDepartment: departmentByCategory[category] || 'Municipal Operations',
    priorityLevel: severity === 'Emergency' ? 'Emergency' : severity,
    severity,
    evidenceBased: 'text',
    needsManualReview: category === 'General Civic Issue'
  });
});

export default router;
