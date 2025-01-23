import { api } from "#opendiscord";

export const formsConfigStructure = new api.ODCheckerArrayStructure("ot-forms:forms",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-forms:forms",{children:[
    // FORMS MAIN STRUCTURE
    {key:"id",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UniqueId("ot-forms:form-id","ot-forms","form-id",{regex:/^[A-Za-z0-9-éèçàêâôûîñ]+$/,minLength:3,maxLength:20})},
    {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:form-name",{minLength:1,maxLength:45})},
    {key:"description",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:form-description",{maxLength:4096})},
    {key:"color",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("ot-forms:form-color",true,false)},

    {key:"responsesChannel",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_DiscordId("ot-forms:responses-channel","channel",true,[],{})}, // Empty allowed
    
    {key:"OTTicketAutoSend",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UniqueIdArray("ot-forms:auto-send-ticket","openticket","option-ids","option-ids-used",{allowDoubles:false,maxLength:25})},

    // QUESTIONS STRUCTURE
    {key:"questions",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-forms:questions",{allowedTypes:["object"],minLength:1,propertyChecker:new api.ODCheckerObjectSwitchStructure("ot-forms:questions",{objects:[
        // TYPE SHORT QUESTION STRUCTURE
        {name:"short",priority:0,properties:[{key:"type",value:"short"}],checker:new api.ODCheckerObjectStructure("ot-forms:short-question",{children:[
            {key:"number",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-forms:question-number",{min:1})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question",{minLength:1,maxLength:45})},
            {key:"optional",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-forms:question-optional",{})},
            {key:"placeholder",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-placeholder",{maxLength:100})}
        ]})},
        // TYPE LONG QUESTION STRUCTURE
        {name:"long",priority:0,properties:[{key:"type",value:"long"}],checker:new api.ODCheckerObjectStructure("ot-forms:long-question",{children:[
            {key:"number",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-forms:question-number",{min:1})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question",{minLength:1,maxLength:45})},
            {key:"optional",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-forms:question-optional",{})},
            {key:"placeholder",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-placeholder",{maxLength:100})}
        ]})},
        // TYPE DROPDOWN QUESTION STRUCTURE
        {name:"dropdown",priority:0,properties:[{key:"type",value:"dropdown"}],checker:new api.ODCheckerObjectStructure("ot-forms:dropdown-question",{children:[
            {key:"number",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-forms:question-number",{min:1})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question",{minLength:1,maxLength:4096})},
            {key:"placeholder",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-placeholder",{maxLength:150})},
            {key:"minAnswerOptions",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-forms:question-min-options",{min:0,max:25})},
            {key:"maxAnswerOptions",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-forms:question-max-options",{min:1,max:25})},
            // OPTIONS STRUCTURE
            {key:"options",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-forms:question-options",{allowedTypes:["object"],minLength:1,maxLength:25,propertyChecker:new api.ODCheckerObjectStructure("ot-forms:question-options",{children:[
                {key:"option",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-option",{minLength:1,maxLength:100})},
                {key:"description",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-option-description",{maxLength:100})},
                {key:"emoji",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_EmojiString("forms:question-option-emoji",0,1,true)},
            ]})})}
        ]})},
        // TYPE BUTTON QUESTION STRUCTURE
        {name:"button",priority:0,properties:[{key:"type",value:"button"}],checker:new api.ODCheckerObjectStructure("ot-forms:button-question",{children:[
            {key:"number",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-forms:question-number",{min:1})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question",{minLength:1,maxLength:4096})},
            // OPTIONS STRUCTURE
            {key:"options",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-forms:question-options",{allowedTypes:["object"],minLength:1,maxLength:25,propertyChecker:new api.ODCheckerObjectStructure("ot-forms:question-options",{children:[
                {key:"option",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-option",{minLength:1,maxLength:40})},
                {key:"color",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-forms:question-option-color",{choices:["gray","red","green","blue"]})},
                {key:"emoji",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_EmojiString("forms:question-option-emoji",0,1,true)},
            ]})})},
        ]})}
    ]})})}
]})})