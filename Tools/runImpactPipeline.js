// tools/runImpactPipeline.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const DEBUG = false;
// Configuration
const SCRIPT_ORDER = [
  'tools/buildFieldRegistry.js',
  'tools/compareSnapshots.js',
  'tools/buildFieldChanges.js',
  'tools/updateFieldHistory.js',
  'tools/impactAnalysis.js'
];

const SCRIPT_NAMES = [
  'Build Field Registry',
  'Compare Snapshots',
  'Build Field Changes',
  'Update Field History',
  'Impact Analysis'
];

/**
 * Execute a Node.js script and return a promise
 * @param {string} scriptPath - Path to the script to execute
 * @param {string} scriptName - Display name for the script
 * @returns {Promise<object>} - Promise resolving to execution result
 */
function executeScript(scriptPath, scriptName) {
  return new Promise((resolve, reject) => {
    if (DEBUG) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 Executing: ${scriptName}`);
      console.log(`📄 Script: ${scriptPath}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`⏱️  Started at: ${new Date().toLocaleString()}\n`);
    }

    const startTime = Date.now();
    
    // Execute the script
    const childProcess = exec(`node ${scriptPath}`, {
      cwd: process.cwd(),
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    // Capture stdout
    childProcess.stdout.on('data', (data) => {
      stdout += data;
      
        console.log(data); // Print in real-time
      
    });

    // Capture stderr
    childProcess.stderr.on('data', (data) => {
      stderr += data;
      console.error(data); // Print in real-time
    });

    childProcess.on('close', (code) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n${'-'.repeat(60)}`);
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully!`);
      } else {
        console.log(`❌ ${scriptName} failed with exit code: ${code}`);
      }
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`${'-'.repeat(60)}`);

      resolve({
        name: scriptName,
        path: scriptPath,
        exitCode: code,
        duration: duration,
        stdout: stdout,
        stderr: stderr,
        success: code === 0
      });
    });

    childProcess.on('error', (error) => {
      console.error(`❌ Error executing ${scriptName}:`, error.message);
      reject({
        name: scriptName,
        path: scriptPath,
        error: error.message,
        success: false
      });
    });
  });
}

/**
 * Check if a script file exists before execution
 * @param {string} scriptPath - Path to check
 * @returns {boolean} - True if file exists
 */
function validateScriptPath(scriptPath) {
  const fullPath = path.resolve(scriptPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Script not found: ${fullPath}`);
    return false;
  }
  return true;
}

/**
 * Validate all scripts exist before starting
 * @returns {boolean} - True if all scripts exist
 */
function validateAllScripts() {
  if (DEBUG) {
    console.log('🔍 Validating script paths...');
  }
  let allExist = true;
  
  SCRIPT_ORDER.forEach(scriptPath => {
    if (!validateScriptPath(scriptPath)) {
      allExist = false;
    }
  });
  
  return allExist;
}

/**
 * Main pipeline execution function
 */
async function runPipeline() {
  if (DEBUG) {
    console.log(`${'='.repeat(60)}`);
    console.log('🚀 Starting Impact Analysis Pipeline');
    console.log(`${'='.repeat(60)}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`📁 Working directory: ${process.cwd()}`);
    console.log(`📋 ${SCRIPT_ORDER.length} scripts to execute\n`);
  }

  // Validate all scripts exist
  if (!validateAllScripts()) {
    console.error('\n❌ Pipeline aborted: Missing required scripts');
    process.exit(1);
  }

  const results = [];
  const totalStartTime = Date.now();

  // Execute scripts in order
  for (let i = 0; i < SCRIPT_ORDER.length; i++) {
    const scriptPath = SCRIPT_ORDER[i];
    const scriptName = SCRIPT_NAMES[i] || `Script ${i + 1}`;
    
    try {
      const result = await executeScript(scriptPath, scriptName);
      results.push(result);
      
      // If a script fails, stop the pipeline
      if (!result.success) {
        console.error(`\n❌ Pipeline stopped due to failure in: ${scriptName}`);
        break;
      }
    } catch (error) {
      console.error(`\n❌ Pipeline encountered an error:`, error);
      results.push(error);
      break;
    }
  }

  // Generate summary report
  const totalEndTime = Date.now();
  const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
  if (DEBUG) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Pipeline Execution Summary');
    console.log(`${'='.repeat(60)}`);
  }
  
  const successful = results.filter(r => r && r.success === true);
  const failed = results.filter(r => r && r.success === false);
  
  results.forEach((result, index) => {
    if (result) {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration || 'N/A';
      console.log(`${status} ${SCRIPT_NAMES[index] || `Script ${index + 1}`} - ${duration}s`);
    }
  });
  
  console.log(`\n${'-'.repeat(60)}`);
  console.log(`✅ Successful: ${successful.length}/${SCRIPT_ORDER.length}`);
  console.log(`❌ Failed: ${failed.length}/${SCRIPT_ORDER.length}`);
  if (DEBUG) {
    console.log(`⏱️  Total duration: ${totalDuration} seconds`);
    console.log(`📅 Completed at: ${new Date().toLocaleString()}`);
    }
  console.log(`${'='.repeat(60)}`);

  // Save results to file
  try {
    const reportPath = path.resolve('metadata/reports/executionResult/pipeline-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: totalDuration,
      scripts: results,
      summary: {
        total: SCRIPT_ORDER.length,
        successful: successful.length,
        failed: failed.length
      }
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error(`\n⚠️ Could not save report file:`, error.message);
  }

  // Exit with appropriate code
  const hasFailures = results.some(r => r && r.success === false);
  process.exit(hasFailures ? 1 : 0);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  process.exit(1);
});

// Start the pipeline
if (require.main === module) {
  runPipeline().catch(error => {
    console.error('💥 Pipeline failed with error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
module.exports = {
  runPipeline,
  executeScript,
  SCRIPT_ORDER,
  SCRIPT_NAMES
};