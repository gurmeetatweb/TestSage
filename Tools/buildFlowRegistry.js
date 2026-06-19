const fs = require('fs');
const path = require('path');

const FLOWS_DIR =
    path.join(
        __dirname,
        '../metadata/flows'
    );

const OUTPUT_FILE =
    path.join(
        FLOWS_DIR,
        'flow-registry.json'
    );

const flowRegistry = {};

const flowFiles = fs
    .readdirSync(FLOWS_DIR)
    .filter(
        file =>
            file.endsWith('-flow.json')
    );

for (const file of flowFiles) {

    const flowData = JSON.parse(
        fs.readFileSync(
            path.join(FLOWS_DIR, file),
            'utf8'
        )
    );

    const flowName =
        path.basename(
            file,
            '.json'
        );

    flowRegistry[flowName] = {

        screens: [

            ...new Set(

                flowData
                    .map(x => normalizeScreenName(x.screen))
                    .filter(Boolean)

            )

        ]
    };
}

fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
        flowRegistry,
        null,
        2
    )
);

console.log(
    'Flow registry created.'
);

function normalizeScreenName(name) {

    if (!name) {
        return '';
    }

    return name.replace(/\s+/g, '');
}