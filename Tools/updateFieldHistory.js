const fs = require('fs');
const path = require('path');
const DEBUG = true;
const CURRENT_FILE = path.join(
    process.cwd(),
    'metadata',
    'field-registry',
    'fields.json'
);

const HISTORY_FILE = path.join(
    process.cwd(),
    'metadata',
    'field-registry',
    'fields.json'
);

const VERSION_FILE = path.join(
    process.cwd(),
    'metadata',
    'version.json'
);

const FIELD_CHANGES_DIR = path.join(
    process.cwd(),
    'metadata',
    'field-changes'
);

/*
 * Read current registry
 */
const currentRegistry =
    JSON.parse(
        fs.readFileSync(CURRENT_FILE, 'utf8')
    );

/*
 * Read versions
 */
const versions =
    JSON.parse(
        fs.readFileSync(VERSION_FILE, 'utf8')
    );

const currentVersion =
    versions.currentVersion;

/*
 * Read history registry
 */
let historyRegistry = {};

if (fs.existsSync(HISTORY_FILE)) {

    historyRegistry =
        JSON.parse(
            fs.readFileSync(
                HISTORY_FILE,
                'utf8'
            )
        );
}

/*
 * Read latest field changes
 */
const files = fs.readdirSync(FIELD_CHANGES_DIR)
    .filter(file => file.endsWith('.json'));

const latestFieldChangeFile = files
    .map(file => ({
        file,
        time: fs.statSync(
            path.join(FIELD_CHANGES_DIR, file)
        ).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)[0]
    ?.file;


if (DEBUG) {
    console.log(
        'Latest field change file:',
        latestFieldChangeFile
    );
}

let fieldChanges = [];

if (latestFieldChangeFile) {

    const fieldChangePath = path.join(
        FIELD_CHANGES_DIR,
        latestFieldChangeFile
    );

    if (DEBUG) {
        console.log(
            'Reading:',
            fieldChangePath
        );
    }

    const fileContent =
        fs.readFileSync(
            fieldChangePath,
            'utf8'
        );
    if (DEBUG) {
        console.log(
            'Field change file content:',
            fileContent
        );
    }
    if (fileContent.trim() !== '') {

        fieldChanges =
            JSON.parse(fileContent);

    } else {

        console.warn(
            'Field change file is empty.'
        );
    }
}
/*
 * PROCESS ACTIVE FIELDS
 */
Object.entries(currentRegistry)
    .forEach(([field, value]) => {

        if (!historyRegistry[field]) {

            historyRegistry[field] = {

                status: 'Removed',

                firstSeenVersion:
                    versions.baselineVersion,

                lastActiveVersion:
                    versions.baselineVersion,

                removedInVersion:
                    currentVersion,

                history: [
                    {
                        version:
                            versions.baselineVersion,

                        action:
                            'Added',

                        date:
                            new Date().toISOString()
                    }
                ]
            };
        }

        historyRegistry[field]
            .status =
                'Active';

        historyRegistry[field]
            .lastActiveVersion =
                currentVersion;
    });

/*
 * PROCESS FIELD CHANGES
 */
fieldChanges.forEach(change => {

    const field =
        change.field;

    /*
     * REMOVED
     */
    if (
        change.changeType ===
        'Removed'
    ) {

        if (
            !historyRegistry[field]
        ) {

            const removedScreens = [

                ...new Set(

                    fieldChanges
                        .filter(
                            fc =>
                                fc.field === field
                        )
                        .map(
                            fc =>
                                fc.screen
                        )

                )

            ];

            historyRegistry[field] = {

                screens:
                    removedScreens,

                flows: [],

                status:
                    'Removed',

                firstSeenVersion:
                    versions.baselineVersion,

                lastActiveVersion:
                    versions.baselineVersion,

                removedInVersion:
                    currentVersion,

                history: []
            };
        }

        historyRegistry[field]
            .status =
                'Removed';
        
        historyRegistry[field]
            .lastActiveVersion =
                versions.baselineVersion;

        historyRegistry[field]
            .removedInVersion =
                currentVersion;
        
        const removedScreens = [
            ...new Set(
                fieldChanges
                    .filter(
                        fc =>
                            fc.field === field
                    )
                    .map(
                        fc =>
                            fc.screen
                    )
            )
        ];

        if (removedScreens.length > 0) {

            historyRegistry[field]
                .screens =
                    removedScreens;
        }

        const alreadyExists =
            historyRegistry[field]
                .history
                .some(entry =>

                    entry.version ===
                        currentVersion &&

                    entry.action ===
                        'Removed'
                );

        if (!alreadyExists) {

            historyRegistry[field]
                .history
                .push({

                    version:
                        currentVersion,

                    action:
                        'Removed',

                    date:
                        new Date()
                            .toISOString()
                });
        }
    }
});

/*
 * SAVE
 */
fs.writeFileSync(

    HISTORY_FILE,

    JSON.stringify(
        historyRegistry,
        null,
        2
    ),

    'utf8'
);
if (DEBUG) {
    console.log(
        '\nField history updated.'
    );

    console.log(
        'Saved to:',
        HISTORY_FILE
    );
}