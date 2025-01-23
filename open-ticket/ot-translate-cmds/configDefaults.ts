import { api } from "../../src/index";
//REGISTER CONFIG
export class OTCommandTranslateConfig_Default extends api.ODJsonConfig {
    declare data: [
        {
            name: string,
            type: string,
            nameTranslations: {
                [key: string]: string
            },
            descriptionTranslations: {
                [key: string]: string
            },
            options?: [
                {
                    name: string,
                    type: string,
                    nameTranslations: {
                        [key: string]: string
                    },
                    descriptionTranslations: {
                        [key: string]: string
                    },
                    choices?: [
                        {
                            name: string,
                            nameTranslations: {
                                [key: string]: string
                            }
                        }
                    ],
                    options?: [
                        {
                            name: string,
                            type: string,
                            nameTranslations: {
                                [key: string]: string
                            },
                            descriptionTranslations: {
                                [key: string]: string
                            },
                            choices?: [
                                {
                                    name: string,
                                    nameTranslations: {
                                        [key: string]: string
                                    }
                                }
                            ],
                        }
                    ]
                }
            ]
        }
    ]
}

