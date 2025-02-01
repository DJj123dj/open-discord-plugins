import { api, opendiscord, utilities } from "#opendiscord"
import discord from "discord.js"

//list of supported locales
const supportedLocales: (`${discord.Locale}`)[] = ["id","en-US","en-GB","bg","zh-CN","zh-TW","hr","cs","da","nl","fi","fr","de","el","hi","hu","it","ja","ko","lt","no","pl","pt-BR","ro","ru","es-ES","es-419","sv-SE","th","tr","uk","vi"]

function createLocaleChecker(id:api.ODValidId): api.ODCheckerObjectStructure {
    const children = supportedLocales.map((locale) => {
        return {key:locale,optional:true,priority:0,checker:new api.ODCheckerStringStructure("ot-translate-cmds:translation-"+locale,{maxLength:100})}
    })
    return new api.ODCheckerObjectStructure(id,{children})
}

function createNormalOptionChecker(): api.ODCheckerObjectStructure {
    return new api.ODCheckerObjectStructure("ot-translate-cmds:option",{children:[
        {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-translate-cmds:option-name",{minLength:1,maxLength:64})},
        {key:"nameTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:option-name-translations")},
        {key:"descriptionTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:option-description-translations")},
        {key:"choices",optional:true,priority:0,checker:new api.ODCheckerArrayStructure("ot-translate-cmds:option-choices",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-translate-cmds:option-choice",{children:[
            {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-translate-cmds:option-choice-name",{minLength:1,maxLength:100})},
            {key:"nameTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:choice-name-translations")}
        ]})})}
    ]})
}

function createSubcommandOptionChecker(): api.ODCheckerObjectStructure {
    return new api.ODCheckerObjectStructure("ot-translate-cmds:option-subcommand",{children:[
        {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-translate-cmds:subcommand-name",{minLength:1,maxLength:64})},
        {key:"nameTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:option-name-translations")},
        {key:"descriptionTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:option-description-translations")},
        {key:"options",optional:true,priority:0,checker:new api.ODCheckerArrayStructure("ot-translate-cmds:subcommand-options",{allowedTypes:["object"],propertyChecker:createNormalOptionChecker()})},
    ]})
}

export const translateCmdsConfigStructure = new api.ODCheckerArrayStructure("ot-translate-cmds:translations",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-translate-cmds:command",{children:[
    {key:"name",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UniqueId("ot-translate-cmds:command-name","ot-translate-cmds","command-names",{minLength:1,maxLength:64})},
    {key:"nameTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:command-name-translations")},
    {key:"descriptionTranslations",optional:false,priority:0,checker:createLocaleChecker("ot-translate-cmds:command-description-translations")},
    {key:"options",optional:true,priority:0,checker:new api.ODCheckerArrayStructure("ot-translate-cmds:command-options",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectSwitchStructure("ot-translate-cmds:command-options",{objects:[
        //SUBCOMMAND OPTION
        {name:"subcommand",priority:0,properties:[{key:"type",value:"subcommand"}],checker:createSubcommandOptionChecker()},
        //NORMAL OPTION
        {name:"option",priority:0,properties:[{key:"type",value:"option"}],checker:createNormalOptionChecker()}
    ]})})}
]})})