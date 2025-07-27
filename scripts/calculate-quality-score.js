#!/usr/bin/env node

/**
 * Quality Score Calculator
 * QA Persona: Aggregated quality metrics calculation
 * DevOps Persona: CI/CD pipeline integration
 */

import QualityReportGenerator from './quality-report.js';

async function calculateQualityScore() {
  const artifactsPath = process.argv[2] || './quality-gate-artifacts';
  
  try {
    const generator = new QualityReportGenerator(artifactsPath);
    const result = await generator.generateReport();
    
    console.log(result.score);
    return result.score;
  } catch (error) {
    console.error('Error calculating quality score:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  calculateQualityScore();
}