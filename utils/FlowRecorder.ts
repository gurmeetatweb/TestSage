import fs from 'fs';
import { Page } from '@playwright/test';

export class FlowRecorder {

    static startFlow(flowName: string){
        const fileName =
            `metadata/flows/${flowName}.json`;
        fs.writeFileSync(fileName, JSON.stringify([], null, 2));
    }

    static async recordPage(
        page: Page,
        flowName: string,
        screenName: string
    ) {

        const fileName =
            `metadata/flows/${flowName}.json`;

        let flowData: any[] = [];

        if (fs.existsSync(fileName)) {

            flowData = JSON.parse(
                fs.readFileSync(
                    fileName,
                    'utf-8'
                )
            );
        }

        flowData.push({

            timestamp:
                new Date().toISOString(),

            screen:
                screenName,

            url:
                page.url()

        });

        fs.writeFileSync(
            fileName,
            JSON.stringify(
                flowData,
                null,
                2
            )
        );
    }
    
    static async captureScreenMetadata(
        page: any,
        screenName: string
    ) {

        const buttons =
            await page
                .locator('button')
                .allTextContents();

        const businessButtons =
            buttons
                .map((b: any) => b.trim())
                .filter((b: any) =>
                    b !== '' &&
                    ![
                        'menu',
                        'person',
                        'visibility',
                        'delete',
                        'upload',
                        '✎',
                        '✖'
                    ].includes(b)

                );

        const links =
            await page
                .locator('a')
                .allTextContents();
        
        
        const inputCount =
            await page.locator('input').count();

        const fields = [];

        for (let i = 0; i < inputCount; i++) {
            const input = page.locator('input').nth(i);

            fields.push({
                type: await input.getAttribute('type'),
                name: await input.getAttribute('name'),
                placeholder: await input.getAttribute('placeholder')
            });
        }

        const labels =
            await page
                .locator(
                    'mat-label, label, .mat-mdc-form-field-label'
                )
                .allTextContents();
        const uniqueLabels = [
            ...new Set(
                labels
                    .map((l: string) => l.trim())
                    .filter((l: string) => l !== '')
            )
        ];

        const tableHeaders = [
            ...(await page
                .locator(
                    '[role="columnheader"]'
                )
                .allTextContents())
        ];

        const uniqueTableHeaders = [
            ...new Set(
                tableHeaders
                    .map(h => h.trim())
                    .filter(h => h !== '')
            )
        ];

        const data = {

            screen: screenName,

            url: page.url(),

            actions: businessButtons,

            links,

            labels: uniqueLabels,

            tableHeaders: uniqueTableHeaders,

            inputCount: inputCount,

            //inputFields:fields
            /* inputs.map((input: any) => ({

                type: input.getAttribute('type'),
                name: input.getAttribute('name'),
                placeholder: input.getAttribute('placeholder')           
            }))    */
        };

        console.log(`Metadata for screen: ${screenName}`);
        console.log(JSON.stringify(data, null, 2));
        return data;
    }
    static saveMetadata(
        data: any,
        screenName: string
    )    {

        const outputDir =
            'metadata/current/screens';

        if (!fs.existsSync(outputDir)) {

            fs.mkdirSync(
                outputDir,
                { recursive: true }
            );
        }

        fs.writeFileSync(
            `${outputDir}/${screenName}.json`,
            JSON.stringify(
                data,
                null,
                2
            )
        );

        return data;
    }
        

}

