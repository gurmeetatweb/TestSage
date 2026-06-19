const fs = require('fs');
const path = require('path');
const DEBUG = true;
const VERSION_FILE = path.join(
    process.cwd(),
    'metadata',
    'version.json'
);

const versions =
    JSON.parse(
        fs.readFileSync(
            VERSION_FILE,
            'utf8'
        )
    );

const FIELD_CHANGES_DIR = path.join(
    process.cwd(),
    'metadata',
    'field-changes'
);

const FIELD_REGISTRY_FILE =
    path.join(
        process.cwd(),
        'metadata',
        'field-registry',
        'fields.json'
    );
const FLOW_REGISTRY_FILE =
    path.join(
        process.cwd(),
        'metadata',
        'flows',
        'flow-registry.json'
    );    

const IMPACT_DIR = path.join(
    process.cwd(),
    'metadata',
    'impact'
);

if (!fs.existsSync(IMPACT_DIR)) {
    fs.mkdirSync(IMPACT_DIR, {
        recursive: true
    });
}

function getLatestFieldChanges() {

    const files = fs.readdirSync(FIELD_CHANGES_DIR)
        .filter(file => file.endsWith('.json'))
        .sort();

    if (files.length === 0) {
        throw new Error(
            'No field change files found.'
        );
    }

    return files[files.length - 1];
}

function getRecommendations(section) {

    switch (section) {

        case 'Labels':
            return [
                'Verify Validation',
                'Verify Save',
                'Verify Edit'
            ];

        case 'Table Headers':
            return [
                'Verify Grid',
                'Verify Search',
                'Verify Export'
            ];

        case 'Actions':
            return [
                'Verify Workflow',
                'Verify Permissions'
            ];

        default:
            return [];
    }
}

function analyzeImpact() {

    const latestFieldChanges =
        getLatestFieldChanges();
    
    const currentFieldRegistry =
        JSON.parse(
            fs.readFileSync(
                path.join(
                    process.cwd(),
                    'metadata',
                    'field-registry',
                    'fields-current.json'
                ),
                'utf8'
            )
        );

    if (DEBUG) {
        console.log(
            fs.readdirSync(FIELD_CHANGES_DIR)
        );
    

        console.log(
            'Using field changes:',
            latestFieldChanges
        );
    }
    const fieldChanges =
        JSON.parse(
            fs.readFileSync(
                path.join(
                    FIELD_CHANGES_DIR,
                    latestFieldChanges
                ),
                'utf8'
            )
        );

    const fieldRegistry =
        JSON.parse(
            fs.readFileSync(
                FIELD_REGISTRY_FILE,
                'utf8'
            )
        );
    const flowRegistry = JSON.parse(
        fs.readFileSync(
            FLOW_REGISTRY_FILE,
            'utf8'
        )
    );

    
    const impactMap = {};
    for (const change of fieldChanges) {
        if (DEBUG) {
            console.log('\nProcessing field:', change.field);
            console.log(
                'Available registry fields:',
                Object.keys(fieldRegistry)
            );
        }
        /*const registryEntry =
            currentFieldRegistry[
                change.field
            ];*/

        const registryEntry =
            fieldRegistry[
                change.field
            ];
        

        if (!registryEntry) {
            if (DEBUG) {
                console.warn(
                    `Field not found in registry: ${change.field}`
                );
            }
        }
        if (DEBUG) {
            console.log(
                'Field FOUND:',
                registryEntry
            );
        }

        const fieldName = change.field;

        if (!impactMap[fieldName]) {

            impactMap[fieldName] = {

                field: fieldName,

                changeType: change.changeType,

                originatingScreens: [],

                impactedScreens: [],

                impactedFlows: [],

                recommendedRegression: []
            };
        }

        if (
            change.screen &&
            !impactMap[fieldName]
                .originatingScreens
                .includes(change.screen)
        ) {

            impactMap[fieldName]
                .originatingScreens
                .push(change.screen);
        }
        if (registryEntry) {

            const impactedFlows = [];

            for (const [flowName, flowData] of Object.entries(flowRegistry)) {

                const flowScreens =
                    flowData.screens || [];

                const matches =
                    registryEntry.screens.some(
                        screen =>
                            flowScreens.includes(screen)
                    );

                if (matches) {
                    impactedFlows.push(flowName);
                }
            }

            impactMap[fieldName]
                .impactedFlows = [
                    
                    ...new Set([
                        ...impactMap[fieldName]
                            .impactedFlows,

                        ...impactedFlows
                    ])
                ];
            if (DEBUG) {
                console.log(
                    'Impacted Flows:',
                    impactMap[fieldName]
                        .impactedFlows
                );
            }
        }  

        if (DEBUG) {
            console.log(
                '\nField:',
                fieldName
            );

            console.log(
                'Registry Entry:',
                JSON.stringify(
                    registryEntry,
                    null,
                    2
                )
            );
        }

        if (DEBUG) {
            console.log(
                'Screens for field:',
                fieldName,
                registryEntry.screens
            );
        }
        impactMap[fieldName]
            .impactedScreens = registryEntry
                ? [...registryEntry.screens]
                : [
                    ...impactMap[fieldName]
                        .originatingScreens
                ];
        
        impactMap[fieldName]
            .recommendedRegression = [
                ...new Set([
                    ...impactMap[fieldName]
                        .recommendedRegression,

                    ...getRecommendations(
                        change.section
                    )
                ])
            ];

        /*impact.push({

            field:
                change.field,

            changeType:
                change.changeType,

            originatingScreen:
                change.screen,

            impactedScreens:
                registryEntry.screens,

            impactedFlows:
                registryEntry.flows,

            recommendedRegression:
                getRecommendations(
                    change.section
                )
        });*/

    }
    const impact =
        Object.values(impactMap);
    return {
        generatedOn:
            new Date()
                .toISOString(),
        baselineVersion:
            versions.baselineVersion,
        currentVersion:
            versions.currentVersion,
        impact
    };
}

const result =
    analyzeImpact();


function getFileCompatibleTimestamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${month}-${day}-${year}_${hours}-${minutes}`;
}

const outputFile =
    path.join(
        IMPACT_DIR,
        //`${Date.now()}.json`
        `ImpactData_${getFileCompatibleTimestamp()}_Ver${versions.baselineVersion}_to_${versions.currentVersion}.json`
    );

fs.writeFileSync(
    outputFile,
    JSON.stringify(
        result,
        null,
        2
    ),
    'utf8'
);

if (DEBUG) {
    console.log(
        '\nSaved to:\n',
        outputFile
    );
}

const report = [];
report.push('======================');
report.push('TESTSAGE IMPACT REPORT');
report.push('======================');
report.push('');

report.push(`Generated On : ${result.generatedOn}`);
report.push(`Baseline Version : ${result.baselineVersion}`);

report.push(`Current Version : ${result.currentVersion}`);
report.push('======================');
report.push('');
result.impact.forEach(item => {

    report.push('');
    report.push(`Field : ${item.field}`);
    report.push(`Change : ${item.changeType}`);

    report.push('\nImpacted Screens');

    item.impactedScreens.forEach(screen =>
        report.push(`- ${screen}`)
    );

    report.push('\nImpacted Flows');

    item.impactedFlows.forEach(flow =>
        report.push(`- ${flow}`)
    );

    report.push('\nRecommended Regression');

    item.recommendedRegression.forEach(test =>
        report.push(`- ${test}`)
    );
});
const reportDir =
    path.join(
        IMPACT_DIR,
        'report'
    );

if (!fs.existsSync(reportDir)) {

    fs.mkdirSync(
        reportDir,
        { recursive: true }
    );
}
fs.writeFileSync(
    path.join(
        reportDir,
        `impact-report-${getFileCompatibleTimestamp()}_Ver${versions.baselineVersion}_to_${versions.currentVersion}.txt`
    ),
    report.join('\n'),
    'utf8'
);



console.log(
    report.join('\n'),
);
