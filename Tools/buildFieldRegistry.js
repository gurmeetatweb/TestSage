const fs = require('fs');
const path = require('path');
const DEBUG = true;
const SCREENS_DIR = path.join(
    process.cwd(),
    'metadata',
    'current',
    'screens'
);

const FLOWS_DIR = path.join(
    process.cwd(),
    'metadata',
    'flows'
);

const OUTPUT_FILE = path.join(
    process.cwd(),
    'metadata',
    'field-registry',
    'fields.json'
);

/*
 * Labels that are UI noise rather than business fields
 */
const IGNORED_LABELS = [
    'Active',
    'Inactive',
    'Enabled',
    'Disabled',
    'Cancel',
    'Submit',
    'Dashboard'
];


function buildFieldRegistry() {

    const registry = {};

    if (DEBUG) {
        console.log('Reading screens from:');
        console.log(SCREENS_DIR);
    }

    const screenFiles =
        fs.readdirSync(SCREENS_DIR)
            .filter(file => file.endsWith('.json'));

    /*
     * STEP 1
     * Build field → screen mapping
     */
    for (const file of screenFiles) {

        const screenData =
            JSON.parse(
                fs.readFileSync(
                    path.join(SCREENS_DIR, file),
                    'utf8'
                )
            );

        const screenName =
            screenData.screen;

        const labels =
            screenData.labels || [];

        labels.forEach(label => {

            const field =
                label.trim().replace(/:$/, '');

            if (
                field === '' ||
                IGNORED_LABELS.includes(field)
            ) {

                return;
            }

            if (!registry[field]) {

                registry[field] = {

                    screens: []
                };
            }
            //field = field;
            if (
                !registry[field]
                    .screens
                    .includes(screenName)
            ) {

                registry[field]
                    .screens
                    .push(screenName);
            }
        });
    }

    // /*
    //  * STEP 2
    //  * Build field → flow mapping
    //  */
    // const flowFiles =
    //     fs.readdirSync(FLOWS_DIR)
    //         .filter(

    //             file =>

    //                 file.endsWith('-flow.json')

    //         );

    // for (const flowFile of flowFiles) {
        

    //     const flowData =
    //         JSON.parse(
    //             fs.readFileSync(
    //                 path.join(
    //                     FLOWS_DIR,
    //                     flowFile
    //                 ),
    //                 'utf8'
    //             )
    //         );
    //     console.log('flowData:');
    //     console.log(flowData);

    //     const flowName =
    //         flowFile.replace(
    //             '.json',
    //             ''
    //         );

    //     /*
    //      * Support both:
    //      * [{ screen: 'Dashboard' }]
    //      * and
    //      * ['Dashboard']
    //      */
    //     const screensInFlow =
    //         flowData.map(step => {

    //             const screen =
    //                 typeof step === 'string'

    //                     ? step

    //                     : step.screen;

    //             return screen
    //                 .replace(/\s+/g, '');
    //         });

    //     Object.keys(registry)
    //         .forEach(field => {

    //             const fieldScreens =
    //                 registry[field]
    //                     .screens;

    //             const usedInFlow =
    //                 fieldScreens.some(
    //                     screen =>

    //                         screensInFlow
    //                             .includes(screen.replace(/\s+/g, ''))
    //                 );

    //             if (
    //                 usedInFlow &&
    //                 !registry[field]
    //                     .flows
    //                     .includes(flowName)
    //             ) {

    //                 registry[field]
    //                     .flows
    //                     .push(flowName);
    //             }
    //         });
    // }

    /*
     * STEP 3
     * Save output
     */
    fs.writeFileSync(

        OUTPUT_FILE,

        JSON.stringify(
            registry,
            null,
            2
        ),

        'utf8'
    );
    if (DEBUG) {
        console.log(
            '\nField registry generated successfully.'
        );

        console.log(
            '\nSaved to:'
        );

        console.log(
            OUTPUT_FILE
        );

        console.log(
            '\nTotal fields discovered:',
            Object.keys(registry).length
        );
    }
}

buildFieldRegistry();