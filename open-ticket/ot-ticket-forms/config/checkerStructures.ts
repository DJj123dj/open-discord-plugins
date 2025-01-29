import { api } from "#opendiscord";

export const formsConfigStructure = new api.ODCheckerArrayStructure("ot-ticket-forms:forms",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-ticket-forms:forms",{children:[
    //FORM STRUCTURE
    {key:"id",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UniqueId("ot-ticket-forms:form-id","ot-forms","form-id",{regex:/^[A-Za-z0-9-éèçàêâôûîñ]+$/,minLength:3,maxLength:40})},
    {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:form-name",{minLength:1,maxLength:45})},
    {key:"description",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:form-description",{maxLength:4096})},
    {key:"color",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("ot-ticket-forms:form-color",true,false)},

    {key:"responseChannel",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_DiscordId("ot-ticket-forms:responses-channel","channel",true,[],{})}, // Empty allowed
    {key:"autoSendOptionIds",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UniqueIdArray("ot-ticket-forms:auto-send-ticket","openticket","option-ids","option-ids-used",{allowDoubles:false,maxLength:25})},

    //QUESTION STRUCTURE
    {key:"questions",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-ticket-forms:questions",{allowedTypes:["object"],minLength:1,propertyChecker:new api.ODCheckerObjectSwitchStructure("ot-ticket-forms:question-switch",{objects:[
        //SHORT QUESTION STRUCTURE
        {name:"short",priority:0,properties:[{key:"type",value:"short"}],checker:new api.ODCheckerObjectStructure("ot-ticket-forms:short-question",{children:[
            {key:"position",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-ticket-forms:question-position",{min:1,floatAllowed:false,negativeAllowed:false})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question",{minLength:1,maxLength:45})},
            {key:"optional",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ticket-forms:question-optional",{})},
            {key:"placeholder",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-placeholder",{maxLength:100})}
        ]})},
        //PARAGRAPH QUESTION STRUCTURE
        {name:"paragraph",priority:0,properties:[{key:"type",value:"paragraph"}],checker:new api.ODCheckerObjectStructure("ot-ticket-forms:paragraph-question",{children:[
            {key:"position",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-ticket-forms:question-position",{min:1,floatAllowed:false,negativeAllowed:false})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question",{minLength:1,maxLength:45})},
            {key:"optional",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ticket-forms:question-optional",{})},
            {key:"placeholder",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-placeholder",{maxLength:100})}
        ]})},
        //DROPDOWN QUESTION STRUCTURE
        {name:"dropdown",priority:0,properties:[{key:"type",value:"dropdown"}],checker:new api.ODCheckerObjectStructure("ot-ticket-forms:dropdown-question",{children:[
            {key:"position",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-ticket-forms:question-position",{min:1,floatAllowed:false,negativeAllowed:false})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question",{minLength:1,maxLength:4096})},
            {key:"placeholder",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-placeholder",{maxLength:150})},
            {key:"minAnswerChoices",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-ticket-forms:question-min-choices",{min:0,max:25,floatAllowed:false,negativeAllowed:false})},
            {key:"maxAnswerChoices",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-ticket-forms:question-max-choices",{min:1,max:25,floatAllowed:false,negativeAllowed:false})},
            
            //CHOICES STRUCTURE
            {key:"choices",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-ticket-forms:question-choices",{allowedTypes:["object"],minLength:1,maxLength:25,propertyChecker:new api.ODCheckerObjectStructure("ot-ticket-forms:question-choice",{children:[
                {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-name",{minLength:1,maxLength:100})},
                {key:"emoji",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_EmojiString("forms:question-choice-emoji",0,1,true)},
                {key:"description",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-choice-description",{maxLength:100})},
            ]})})}
        ]})},
        //BUTTON QUESTION STRUCTURE
        {name:"button",priority:0,properties:[{key:"type",value:"button"}],checker:new api.ODCheckerObjectStructure("ot-ticket-forms:button-question",{children:[
            {key:"position",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-ticket-forms:question-position",{min:1,floatAllowed:false,negativeAllowed:false})},
            {key:"question",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question",{minLength:1,maxLength:4096})},
            // CHOICES STRUCTURE
            {key:"choices",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-ticket-forms:question-choices",{allowedTypes:["object"],minLength:1,maxLength:25,propertyChecker:new api.ODCheckerObjectStructure("ot-ticket-forms:question-choice",{children:[
                {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-name",{minLength:1,maxLength:40})},
                {key:"emoji",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_EmojiString("forms:question-choice-emoji",0,1,true)},
                {key:"color",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-ticket-forms:question-choice-color",{choices:["gray","red","green","blue"]})},
            ]})})},
        ]})}
    ]})})}
]})})