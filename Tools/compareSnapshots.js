//import fs from 'fs';
//import path from 'path';
const fs = require('fs');
const path = require('path');

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

function getJsonFiles(folder) {
    console.log(`Reading JSON files from: ${folder}\n`
    );
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

    console.log(
        '\n=============================='
    );

    console.log(
        ' SNAPSHOT COMPARISON REPORT'
    );

    console.log(
        '==============================\n'
    );

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

            console.log(
                `NEW SCREEN: ${file}`
            );

            console.log();

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

        console.log(
            `SCREEN: ${current.screen}`
        );

        compareSection(
            current.screen,
            'Labels',
            baseline.labels,
            current.labels
        );

        compareSection(
            current.screen,
            'Actions',
            baseline.actions,
            current.actions
        );

        compareSection(
            current.screen,
            'Table Headers',
            baseline.tableHeaders,
            current.tableHeaders
        );

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
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const reportDate =`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const reportFileName = `${reportDate}.json`;
    const diffObject = {
        screen: screen,
        changes:
        [{        
        sectionName: sectionName,
        added: diff.added,
        removed: diff.removed
    }]};

    
    const filePath = path.join(REPORT_DIR, reportFileName);

    let existingData = [];
    if (fs.existsSync(filePath)) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(fileContent);
            existingData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            existingData = [];
        }
    }

    existingData.push(diffObject);

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log(`Output written to: ${path.join(REPORT_DIR, reportFileName)}\n`);
    console.log(
        `  ${sectionName}:`
    );

    if (diff.added.length > 0) {

        console.log(
            `    Added:`
        );

        diff.added.forEach(item => {

            console.log(
                `      + ${item}`
            );
        });
    }

    if (diff.removed.length > 0) {

        console.log(
            `    Removed:`
        );

        diff.removed.forEach(item => {

            console.log(
                `      - ${item}`
            );
        });
    }

    console.log();
}

compareScreens();