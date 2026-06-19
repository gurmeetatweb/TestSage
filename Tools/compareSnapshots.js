//import fs from 'fs';
//import path from 'path';
const fs = require('fs');
const path = require('path');
const DEBUG = false;
const BASELINE_DIR = path.join(
    __dirname,
    '../metadata/baseline/screens'
);

const CURRENT_DIR = path.join(
    __dirname,
    '../metadata/current/screens'
);

const REPORT_DIR = path.join(
    __dirname,
    '../metadata/reports'
);

const IGNORED_LABELS = [
    'Dashboard',
    'Active',
    'Inactive',
    'Enabled',
    'Disabled'
];

function getJsonFiles(folder) {
    if (DEBUG) {
        console.log(`Reading JSON files from: ${folder}\n`
        );
    }
    return fs
        .readdirSync(folder)
        .filter(file => file.endsWith('.json'));
}

function getDifferences(
    oldItems = [],
    newItems = []
) {

    return {

        added:
            newItems.filter(
                item => !oldItems.includes(item)
            ),

        removed:
            oldItems.filter(
                item => !newItems.includes(item)
            )
    };
}

function compareScreens() {

    const files =
        getJsonFiles(CURRENT_DIR);

    if (DEBUG) {
        console.log(
            '\n=============================='
        );

        console.log(
            ' SNAPSHOT COMPARISON REPORT'
        );

        console.log(
            '==============================\n'
        );
    }
    
    let allComparisonData = [];
    for (const file of files) {

        const baselinePath =
            path.join(
                BASELINE_DIR,
                file
            );

        const currentPath =
            path.join(
                CURRENT_DIR,
                file
            );

        if (!fs.existsSync(baselinePath)) {
            if (DEBUG) {
                console.log(
                    `NEW SCREEN: ${file}`
                );

                console.log();
            }
            continue;
        }

        const baseline =
            JSON.parse(
                fs.readFileSync(
                    baselinePath,
                    'utf-8'
                )
            );

        const current =
            JSON.parse(
                fs.readFileSync(
                    currentPath,
                    'utf-8'
                )
            );

        if (DEBUG) {
            console.log(
                `SCREEN: ${current.screen}`
            );
        }

        const labelDiff = compareSection(
            current.screen,
            'Labels',
            baseline.labels,
            current.labels
        );

        const actionDiff = compareSection(
            current.screen,
            'Actions',
            baseline.actions,
            current.actions
        );

        const tableHeaderDiff = compareSection(
            current.screen,
            'Table Headers',
            baseline.tableHeaders,
            current.tableHeaders
        );
        //allComparisonData.push(labelDiff, actionDiff, tableHeaderDiff);
        [
            labelDiff,
            actionDiff,
            tableHeaderDiff
        ]
        .filter(Boolean)
        .forEach(diff =>
            allComparisonData.push(diff)
        );
        

        //let existingData = [];
        
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const reportDate =`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const reportFileName = `${reportDate}.json`;
    const filePath = path.join(REPORT_DIR, reportFileName);
    if (fs.existsSync(filePath)) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(fileContent);
            allComparisonData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            allComparisonData = [];
        }
    }

    //existingData.push(allComparisonData);

    fs.writeFileSync(filePath, JSON.stringify(allComparisonData, null, 2), 'utf-8');
    if (DEBUG) {
        console.log(`Output written to: ${path.join(REPORT_DIR, reportFileName)}\n`);
    
        /*console.log(
            `  ${sectionName}:`
        );*/
        console.log(
            '--------------------------------'
        );
    }

}

function compareSection(screen,
    sectionName,
    baselineItems = [],
    currentItems = []
) {

    if (sectionName === 'Labels') {

        baselineItems =
            baselineItems.filter(
                item =>
                    !IGNORED_LABELS.includes(
                        (item || '').trim()
                    )
            );

        currentItems =
            currentItems.filter(
                item =>
                    !IGNORED_LABELS.includes(
                        (item || '').trim()
                    )
            );
    }

    const diff =
        getDifferences(
            baselineItems,
            currentItems
        );

    if (
        diff.added.length === 0 &&
        diff.removed.length === 0
    ) {

        return;
    }
    
    const diffObject = {
        screen: screen,
        changes:
        [{        
        sectionName: sectionName,
        added: diff.added,
        removed: diff.removed
    }]};

    


    if (diff.added.length > 0) {
        if (DEBUG) {
            console.log(
                `    Added:`
            );
        }

        diff.added.forEach(item => {

            if (DEBUG) {
                console.log(
                    `      + ${item}`
                );
            }
        });
    }

    if (diff.removed.length > 0) {
        if (DEBUG) {
                console.log(
                    `    Removed:`
                );
            }
        diff.removed.forEach(item => {
            if (DEBUG) {
                console.log(
                    `      - ${item}`
                );
            }
        });
    }

    if (DEBUG) {
        console.log();
    }
    return diffObject;
}

compareScreens();