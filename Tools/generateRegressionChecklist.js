const fs = require('fs');
const path = require('path');

const IMPACT_DIR = path.join(
    process.cwd(),
    'metadata',
    'impact'
);

const REGRESSION_DIR = path.join(
    process.cwd(),
    'metadata',
    'regression'
);
if (!fs.existsSync(REGRESSION_DIR)) {

    fs.mkdirSync(
        REGRESSION_DIR,
        { recursive: true }
    );
}
function getLatestImpactFile() {

    const files =
        fs.readdirSync(IMPACT_DIR)
            .filter(
                file =>
                    file.startsWith(
                        'ImpactData_'
                    )
            );

    return files
        .map(file => ({
            file,
            time:
                fs.statSync(
                    path.join(
                        IMPACT_DIR,
                        file
                    )
                ).mtimeMs
        }))
        .sort(
            (a, b) =>
                b.time - a.time
        )[0]
        ?.file;
}

const impactFile =
    getLatestImpactFile();

const impactData =
    JSON.parse(
        fs.readFileSync(
            path.join(
                IMPACT_DIR,
                impactFile
            ),
            'utf8'
        )
    );

const flowMap = {};

for (
    const item of
    impactData.impact
) {

    for (
        const flow of
        item.impactedFlows
    ) {

        if (!flowMap[flow]) {

            flowMap[flow] = [];
        }

        flowMap[flow].push(item);
    }
}

let markdown = '';

markdown +=
    '# TestSage Regression Checklist\n\n';

markdown +=
    `Generated: ${
        new Date()
            .toISOString()
    }\n\n`;

markdown +=
    `Version: ${
        impactData.baselineVersion
    } → ${
        impactData.currentVersion
    }\n\n`;
const impactedFlows =
    Object.keys(flowMap).length;

const impactedFields =
    impactData.impact.length;

const impactedScreens =
    new Set(
        impactData.impact.flatMap(
            item =>
                item.impactedScreens
        )
    ).size;

markdown +=
`Summary
----------------
Fields Changed: ${impactedFields}
Flows Impacted: ${impactedFlows}
Screens Impacted: ${impactedScreens}

`;

for (
    const [flow, impacts]
    of Object.entries(
        flowMap
    )
) {

    markdown +=
        `## ${flow}\n\n`;

    markdown +=
        `Impacts: ${impacts.length}\n\n`;

    impacts.forEach(
        impact => {

            markdown +=
                `### ${impact.field} (${impact.changeType})\n\n`;

            markdown += `Risk: ${getRisk(impact.changeType)}\n\n`;

            markdown += `Affected Screens (${impact.impactedScreens.length})\n`;

            impact.impactedScreens
                .forEach(screen => {

                    markdown +=
                        `- ${screen}\n`;
                });

            markdown += '\n';

            markdown +=
                `Regression Tests (${impact.recommendedRegression.length})\n`;

            impact
                .recommendedRegression
                .forEach(test => {

                    markdown +=
                        `- [ ] ${test}\n`;
                });

            markdown += '\n';
        }
    );
}

const outputFile =
    path.join(
        REGRESSION_DIR,
        `RegressionChecklist_Ver${impactData.baselineVersion}_to_Ver${impactData.currentVersion}.md`
    );

fs.writeFileSync(
    outputFile,
    markdown,
    'utf8'
);

console.log(
    '\nRegression Checklist Generated'
);

console.log(
    'Saved to:',
    outputFile
);

function getRisk(changeType) {

    switch(changeType) {

        case 'Removed':
            return 'HIGH';

        case 'Added':
            return 'MEDIUM';

        case 'Modified':
            return 'MEDIUM';

        default:
            return 'LOW';
    }
}