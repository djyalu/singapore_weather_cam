#!/usr/bin/env node

/**
 * Quality Report Markdown Generator
 * QA Persona: Comprehensive reporting
 * Scribe Persona: Documentation generation
 */

import QualityReportGenerator from './quality-report.js';

async function generateQualityReport() {
  const artifactsPath = process.argv[2] || './quality-gate-artifacts';
  
  try {
    const generator = new QualityReportGenerator(artifactsPath);
    const result = await generator.generateReport();
    
    console.log(result.report);
    return result.report;
  } catch (error) {
    console.error('Error generating quality report:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateQualityReport();
}