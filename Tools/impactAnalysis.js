const fs = require('fs');
const path = require('path');

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

    console.log(
        'Using field changes:',
        latestFieldChanges
    );

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

    const impact = [];

    for (const change of fieldChanges) {
        console.log('\nProcessing field:', change.field);
        console.log(
            'Available registry fields:',
            Object.keys(fieldRegistry)
        );

        const registryEntry =
            fieldRegistry[
                change.field
            ];

        if (!registryEntry) {

            console.warn(
                `Field not found in registry: ${change.field}`
            );

            continue;
        }
        console.log(
            'Field FOUND:',
            registryEntry
        );

        impact.push({

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
        });
    }

    return {

        generatedOn:
            new Date()
                .toISOString(),

        impact
    };
}

const result =
    analyzeImpact();

console.log(
    '\n=============================='
);

console.log(
    'IMPACT ANALYSIS REPORT'
);

console.log(
    '==============================\n'
);

console.log(
    JSON.stringify(
        result,
        null,
        2
    )
);

const outputFile =
    path.join(
        IMPACT_DIR,
        `${Date.now()}.json`
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

console.log(
    '\nSaved to:\n',
    outputFile
);

const report = [];

report.push('TESTSAGE IMPACT REPORT');
report.push('======================');

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

fs.writeFileSync(
    path.join(
        IMPACT_DIR,
        'impact-report.txt'
    ),
    report.join('\n'),
    'utf8'
);