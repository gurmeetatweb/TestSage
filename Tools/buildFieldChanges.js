const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(
    process.cwd(),
    'metadata',
    'reports'
);

const OUTPUT_DIR = path.join(
    process.cwd(),
    'metadata',
    'field-changes'
);

const DEBUG = false;

if (!fs.existsSync(OUTPUT_DIR)) {

    fs.mkdirSync(
        OUTPUT_DIR,
        { recursive: true }
    );
}

/*
 * Ignore non-business fields
 */
const IGNORED_FIELDS = [
    'Dashboard'
];

function getLatestReport() {

    const reports =
        fs.readdirSync(REPORTS_DIR)
            .filter(file =>
                file.endsWith('.json')
            )
            .sort();

    if (reports.length === 0) {

        throw new Error(
            'No comparison reports found.'
        );
    }

    return reports[
        reports.length - 1
    ];
}

function buildFieldChanges() {

    const latestReport =
        getLatestReport();

    const report =
        JSON.parse(

            fs.readFileSync(
                path.join(
                    REPORTS_DIR,
                    latestReport
                ),
                'utf8'
            )
        );

    const fieldChanges = [];

    for (const screen of report) {

        for (const change of screen.changes) {

            /*
             * Added Fields
             */
            for (const field of change.added || []) {

                if (
                    IGNORED_FIELDS.includes(
                        field
                    )
                ) {

                    continue;
                }

                fieldChanges.push({

                    field,

                    changeType:
                        'Added',

                    screen:
                        screen.screen,

                    section:
                        change.sectionName
                });
                if (DEBUG) {
                    console.log(
                        'SCREEN:',
                        screen.screen
                    );
                    console.log(
                        'FIELD:',
                        field
                    );
                }


            }

            /*
             * Removed Fields
             */
            for (const field of change.removed || []) {

                if (
                    IGNORED_FIELDS.includes(
                        field
                    )
                ) {

                    continue;
                }

                fieldChanges.push({

                    field,

                    changeType:
                        'Removed',

                    screen:
                        screen.screen,

                    section:
                        change.sectionName
                });
            }
        }
    }

    const outputFile =
        path.join(
            OUTPUT_DIR,
            latestReport
        );

    fs.writeFileSync(

        outputFile,

        JSON.stringify(
            fieldChanges,
            null,
            2
        ),

        'utf8'
    );
    if (DEBUG) {
        console.log(
            '\nField Changes Generated:\n'
        );

        console.log(
            JSON.stringify(
                fieldChanges,
                null,
                2
            )
        );

        console.log(
            '\nSaved To:\n',
            outputFile
        );
    }
}

buildFieldChanges();