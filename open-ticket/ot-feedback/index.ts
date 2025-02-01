import * as discord from "discord.js"
import { api, opendiscord, utilities } from "#opendiscord"

//DECLARATION
export interface OTFeedbackConfigQuestion {
    label:string,
    type:"text"|"rating"|"image"|"attachment"|"choice"
}
export interface OTFeedbackConfigDefaultQuestion {
    label:string,
    type:"text"|"rating"
}
export interface OTFeedbackConfigImageQuestion extends OTFeedbackConfigQuestion {
    label:string,
    type:"image",
    allowGifs:boolean
}
export interface OTFeedbackConfigAttachmentQuestion extends OTFeedbackConfigQuestion {
    label:string,
    type:"attachment",
    allowZipFiles:boolean,
    allowExecutables:boolean
}
export interface OTFeedbackConfigChoiceQuestion extends OTFeedbackConfigQuestion {
    label:string,
    type:"choice",
    choiceOrdering:"numeric"|"alphabetical",
    choices:string[]
}
export type OTFeedbackConfigValidQuestion = (OTFeedbackConfigDefaultQuestion|OTFeedbackConfigImageQuestion|OTFeedbackConfigAttachmentQuestion|OTFeedbackConfigChoiceQuestion)
export type OTFeedbackConfigAnsweredValidQuestion = (OTFeedbackConfigDefaultQuestion|OTFeedbackConfigImageQuestion|OTFeedbackConfigAttachmentQuestion|OTFeedbackConfigChoiceQuestion) & {answer:null|string|discord.Attachment}

class OTFeedbackConfig extends api.ODJsonConfig {
    declare data: {
        webhookUrl:string,
        questionsText:string,
        completedText:string,
        ignoredText:string,
        canceledText:string,
        
        customColor:discord.ColorResolvable,
        footer:string,

        trigger:"close"|"delete"|"first-close-only",
        minutesPerQuestion:number,
        sendWebhookWhenEmpty:boolean,

        questions:OTFeedbackConfigValidQuestion[]
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-feedback":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-feedback:config": OTFeedbackConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-feedback:config": api.ODChecker
    }
    export interface ODEmbedManagerIds_Default {
        "ot-feedback:response": {source:"other",params:{questions:OTFeedbackConfigAnsweredValidQuestion[]},workers:"ot-feedback:response"}
        "ot-feedback:overview": {source:"other",params:{ticket:api.ODTicket,user:discord.User,questions:OTFeedbackConfigAnsweredValidQuestion[],channelName:string},workers:"ot-feedback:overview"}
    }
    export interface ODMessageManagerIds_Default {
        "ot-feedback:response": {source:"other",params:{questions:OTFeedbackConfigAnsweredValidQuestion[]},workers:"ot-feedback:response"}
        "ot-feedback:question": {source:"other",params:{question:OTFeedbackConfigValidQuestion},workers:"ot-feedback:question"}
        "ot-feedback:completed": {source:"other",params:{responses:OTFeedbackConfigAnsweredValidQuestion[]},workers:"ot-feedback:completed"}
        "ot-feedback:canceled": {source:"other",params:{question:OTFeedbackConfigValidQuestion},workers:"ot-feedback:canceled"}
        "ot-feedback:overview": {source:"other",params:{ticket:api.ODTicket,user:discord.User,questions:OTFeedbackConfigAnsweredValidQuestion[],channelName:string},workers:"ot-feedback:overview"}
    }
    export interface ODEventIds_Default {
        "ot-feedback:onFeedback":api.ODEvent_Default<(questions:OTFeedbackConfigValidQuestion[]) => api.ODPromiseVoid>
        "ot-feedback:afterFeedback":api.ODEvent_Default<(responses:OTFeedbackConfigAnsweredValidQuestion[]) => api.ODPromiseVoid>
    }
    export interface ODTicketIds {
        "ot-feedback:close-count":api.ODTicketData<number>
    }
    export interface ODStatGlobalScopeIds_DefaultGlobal {
        "ot-feedback:feedback-created":api.ODBasicStat
    }
}

//UTILITY FUNCTIONS
const isExecutableFile = (name:string) => {
    //list of common executable extensions
    const extensions = [
        ".exe",".bat",".com",".cmd",".inf",".ipa",".osx",".pif",".wsh",".vb",".vbs",".ws",".msi",".job", //WINDOWS
        ".bash",".app",".action",".bin",".command",".csh",".ipa",".workflow",".dmg",".pkg", //MACOS + IOS
        ".run",".apk",".jar" //LINUX + ANDROID
    ]
    for (const ext of extensions){
        if (name.endsWith(ext)) return true
    }
    return false
}
const isCompressedFile = (name:string) => {
    //list of common compressed extensions
    const extensions = [
        ".zip",".7z",".rar",".tar",".apk",".ipa",".pak",".tar.gz",".iso",".tgz",".gz",".gzip",".tar.xy"
    ]
    for (const ext of extensions){
        if (name.endsWith(ext)) return true
    }
    return false
}
const alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
const transformToChoice = (mode:"alphabetical"|"numeric",content:string): number => {
    if (mode == "numeric" && !isNaN(Number(content))) return (Number(content)-1)
    else if (mode == "alphabetical" && /^[a-zA-Z]$/.test(content)){
        const i = alphabet.findIndex((letter) => content.toLowerCase() == letter)
        if (i < 0) return -1
        else return i
    }else return -1
}
const transformToLetter = (mode:"alphabetical"|"numeric",index:number): string => {
    if (mode == "numeric") return (index+1).toString()
    else if (mode == "alphabetical") return alphabet[index].toUpperCase()
    else return "<UNKNOWN>"
}

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTFeedbackConfig("ot-feedback:config","config.json","./plugins/ot-feedback/"))
})

//REGISTER CONFIG CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const config = opendiscord.configs.get("ot-feedback:config")
    const structure = new api.ODCheckerObjectStructure("ot-feedback:config",{children:[
        {key:"webhookUrl",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-feedback:webhook-url",false,{allowHttp:false,allowedHostnames:["discord.com"],allowedPaths:[/^\/api\/webhooks\/\d+\/[A-Za-z0-9_\.\-]+$/]})},
        {key:"questionsText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:questions-text",{minLength:1,maxLength:2048})},
        {key:"completedText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:completed-text",{minLength:1,maxLength:2048})},
        {key:"ignoredText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:ignored-text",{minLength:1,maxLength:2048})},
        {key:"canceledText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:canceled-text",{minLength:1,maxLength:2048})},
        
        {key:"customColor",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("opendiscord:custom-color",true,true)},
        {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:footer",{maxLength:512})},

        {key:"trigger",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:trigger",{choices:["close","delete","first-close-only"]})},
        {key:"minutesPerQuestion",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-feedback:minutes-per-question",{min:1,max:10,floatAllowed:false})},
        {key:"sendWebhookWhenEmpty",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-feedback:send-webhook-when-empty",{})},
        
        {key:"questions",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-feedback:questions",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectSwitchStructure("ot-feedback:question",{objects:[
            {name:"text",priority:0,properties:[{key:"type",value:"text"}],checker:new api.ODCheckerObjectStructure("ot-feedback:question-text",{children:[
                {key:"label",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-label",{minLength:1,maxLength:200})}
            ]})},
            {name:"rating",priority:0,properties:[{key:"type",value:"rating"}],checker:new api.ODCheckerObjectStructure("ot-feedback:question-rating",{children:[
                {key:"label",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-label",{minLength:1,maxLength:200})}
            ]})},
            {name:"image",priority:0,properties:[{key:"type",value:"image"}],checker:new api.ODCheckerObjectStructure("ot-feedback:question-image",{children:[
                {key:"label",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-label",{minLength:1,maxLength:200})},
                {key:"allowGifs",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-feedback:question-allow-gifs",{})}
            ]})},
            {name:"attachment",priority:0,properties:[{key:"type",value:"attachment"}],checker:new api.ODCheckerObjectStructure("ot-feedback:question-attachment",{children:[
                {key:"label",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-label",{minLength:1,maxLength:200})},
                {key:"allowZipFiles",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-feedback:question-allow-zip",{})},
                {key:"allowExecutables",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-feedback:question-allow-exe",{})}
            ]})},
            {name:"choice",priority:0,properties:[{key:"type",value:"choice"}],checker:new api.ODCheckerObjectStructure("ot-feedback:question-choice",{children:[
                {key:"label",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-label",{minLength:1,maxLength:200})},
                {key:"choiceOrdering",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-choice-order",{choices:["numeric","alphabetical"]})},
                {key:"choices",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-feedback:question-choices",{allowedTypes:["string"],disableEmpty:true,propertyChecker:new api.ODCheckerStringStructure("ot-feedback:question-choice",{minLength:1}),maxLength:26})}
            ]})}
        ]})})}
    ]})
    checkers.add(new api.ODChecker("ot-feedback:config",checkers.storage,0,config,structure))
})

//REGISTER EMBEDS
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    const config = opendiscord.configs.get("ot-feedback:config")
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    embeds.add(new api.ODEmbed("ot-feedback:response"))
    embeds.get("ot-feedback:response").workers.add(new api.ODWorker("ot-feedback:response",0,(instance,params,source,cancel) => {
        instance.setTitle(utilities.emojiTitle("📢","Feedback"))
        instance.setColor(config.data.customColor ? config.data.customColor : generalConfig.data.mainColor)
        if (config.data.footer) instance.setFooter(config.data.footer)
        if (config.data.questionsText) instance.setDescription(config.data.questionsText)
        
        instance.setFields(params.questions.map((question) => {
            if (typeof question.answer != "string" && !(question.answer instanceof discord.Attachment)){
                //unanswered
                return {name:utilities.emojiTitle("🔴",question.label),inline:false,value:"*Awaiting Response...*"}
            }else if (question.type == "rating" && typeof question.answer == "string" && !isNaN(Number(question.answer))){
                //answered (rating)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:":star:".repeat(Number(question.answer))}
            }else if (question.type == "text" && typeof question.answer == "string"){
                //answered (text)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:(question.answer.length > 0 ? question.answer : "/")}
            }else if (question.type == "image" && question.answer instanceof discord.Attachment){
                //answered (image)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:"[View Image]("+question.answer.url+")"}
            }else if (question.type == "attachment" && question.answer instanceof discord.Attachment){
                //answered (attachment)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:"[View File]("+question.answer.url+")"}
            }else if (question.type == "choice" && typeof question.answer == "string"){
                //answered (choice)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:question.answer}
            }else return {name:utilities.emojiTitle("🟠",question.label),value:"*Something went wrong with this field :(*"}
        }))
    }))

    embeds.add(new api.ODEmbed("ot-feedback:overview"))
    embeds.get("ot-feedback:overview").workers.add(new api.ODWorker("ot-feedback:overview",0,async (instance,params,source,cancel) => {
        const {questions,ticket,user,channelName} = params

        instance.setTitle(utilities.emojiTitle("📢","Feedback Received"))
        instance.setAuthor(user.displayName,user.displayAvatarURL())
        instance.setColor(config.data.customColor ? config.data.customColor : generalConfig.data.mainColor)
        instance.setDescription("New feedback available from "+discord.userMention(user.id)+"!")
        instance.setFooter("Ticket: #"+channelName)

        instance.setFields(questions.map((question) => {
            if (typeof question.answer != "string" && !(question.answer instanceof discord.Attachment)){
                //unanswered
                return {name:question.label,inline:false,value:"/"}
            }else if (question.type == "rating" && typeof question.answer == "string" && !isNaN(Number(question.answer))){
                //answered (rating)
                return {name:question.label,inline:false,value:":star:".repeat(Number(question.answer))}
            }else if (question.type == "text" && typeof question.answer == "string"){
                //answered (text)
                return {name:question.label,inline:false,value:(question.answer.length > 0 ? question.answer : "/")}
            }else if (question.type == "image" && question.answer instanceof discord.Attachment){
                //answered (image)
                return {name:question.label,inline:false,value:"[View Image]("+question.answer.url+")"}
            }else if (question.type == "attachment" && question.answer instanceof discord.Attachment){
                //answered (attachment)
                return {name:question.label,inline:false,value:"[View File]("+question.answer.url+")"}
            }else if (question.type == "choice" && typeof question.answer == "string"){
                //answered (choice)
                return {name:question.label,inline:false,value:question.answer}
            }else return {name:question.label,value:"*Something went wrong with this field :(*"}
        }))
    }))
})

//REGISTER MESSAGES
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    const config = opendiscord.configs.get("ot-feedback:config")

    messages.add(new api.ODMessage("ot-feedback:response"))
    messages.get("ot-feedback:response").workers.add(new api.ODWorker("ot-feedback:response",0,async (instance,params,source) => {
        instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-feedback:response").build(source,params))
    }))

    messages.add(new api.ODMessage("ot-feedback:question"))
    messages.get("ot-feedback:question").workers.add(new api.ODWorker("ot-feedback:question",0,async (instance,params,source) => {
        const ratingText = (params.question.type == "rating") ? "\n-# Please give a number from 1 to 10." : ""
        const attachmentText = (params.question.type == "image" || params.question.type == "attachment") ? "\n-# Please upload a local attachment. URLs won't work!" : ""
        const choiceText = (params.question.type == "choice") ? "\n"+params.question.choices.map((c,i) => "-# - **"+transformToLetter(params.question.type == "choice" ? params.question.choiceOrdering : "numeric",i)+":** "+c).join("\n") : ""
        instance.setContent("**"+params.question.label+"**"+ratingText+attachmentText+choiceText)
    }))

    messages.add(new api.ODMessage("ot-feedback:completed"))
    messages.get("ot-feedback:completed").workers.add(new api.ODWorker("ot-feedback:completed",0,async (instance,params,source) => {
        if (params.responses.every((r) => r.answer === null)) instance.setContent("**"+config.data.ignoredText+"**")
        else instance.setContent("**"+config.data.completedText+"**")
    }))

    messages.add(new api.ODMessage("ot-feedback:canceled"))
    messages.get("ot-feedback:canceled").workers.add(new api.ODWorker("ot-feedback:canceled",0,async (instance,params,source) => {
        instance.setContent("**"+config.data.canceledText+"**")
    }))

    messages.add(new api.ODMessage("ot-feedback:overview"))
    messages.get("ot-feedback:overview").workers.add(new api.ODWorker("ot-feedback:overview",0,async (instance,params,source) => {
        instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-feedback:overview").build(source,params))
    }))
})

//WAIT UNTIL BOT READY
opendiscord.events.get("onReadyForUsage").listen(() => {
    const config = opendiscord.configs.get("ot-feedback:config")
    const reviewWebhook = new discord.WebhookClient({url:config.data.webhookUrl})

    function feedbackHandler(ticket:api.ODTicket,user:discord.User,channel:discord.GuildTextBasedChannel){
        const channelName = channel.name

        utilities.runAsync(async () => {
            //add some delay so that the message arrives after the default close message
            await utilities.timer(2000)

            const creator = await opendiscord.tickets.getTicketUser(ticket, "creator");
            if (!creator) throw new api.ODPluginError("Couldn't find ticket creator on ticket close!")
        
            //send initial message
            const statusQuestions: OTFeedbackConfigAnsweredValidQuestion[] = config.data.questions.map((value) => {
                if (value.type == "image") return {label:value.label,type:value.type,allowGifs:value.allowGifs,answer:null}
                else if (value.type == "attachment") return {label:value.label,type:value.type,allowZipFiles:value.allowZipFiles,allowExecutables:value.allowExecutables,answer:null}
                else if (value.type == "choice") return {label:value.label,type:value.type,choiceOrdering:value.choiceOrdering,choices:value.choices,answer:null}
                else return {label:value.label,type:value.type,answer:null}
            })
            const statusResult = await opendiscord.client.sendUserDm(creator,await opendiscord.builders.messages.getSafe("ot-feedback:response").build("other",{questions:statusQuestions}))
            if (!statusResult.message) throw new api.ODPluginError("Unable to send OT Feedback status message!")
            
            opendiscord.log(creator.displayName+" is now able to fill-in the feedback!","plugin",[
                {key:"user",value:creator.username},
                {key:"userid",value:creator.id,hidden:true},
                {key:"questions",value:config.data.questions.length.toString()}
            ])

            await opendiscord.events.get("ot-feedback:onFeedback").emit([config.data.questions])
            
            //loop over each question and ask ticket creator
            const responses: OTFeedbackConfigAnsweredValidQuestion[] = []
            for (const question of config.data.questions) {
                //send question
                await opendiscord.client.sendUserDm(creator,await opendiscord.builders.messages.getSafe("ot-feedback:question").build("other",{question}))
        
                try{
                    const collector = await (await creator.createDM()).awaitMessages({
                        filter:(response) => {
                            const attachment = response.attachments.first()
                            
                            const isAuthor = response.author.id == creator.id
                            const isValidText = true
                            const isValidRating = (question.type != "rating" || /^[1-9]$|^10$/.test(response.content))
                            const isValidImage = !!(question.type != "image" || (attachment && attachment.contentType && ["image/png","image/jpg","image/jpeg","image/webp","image/gif"].includes(attachment.contentType) && (question.allowGifs || attachment.contentType != "image/gif")))
                            const isValidAttachment = !!(question.type != "attachment" || (attachment && (question.allowExecutables || !isExecutableFile(attachment.name)) && (question.allowZipFiles || !isCompressedFile(attachment.name))))
                            const isValidChoice = (question.type != "choice" || typeof question.choices[transformToChoice(question.choiceOrdering,response.content)] == "string")
                            
                            return isAuthor && isValidText && isValidRating && isValidImage && isValidAttachment && isValidChoice
                        },
                        max:1,
                        time:config.data.minutesPerQuestion*60000, //60 seconds
                        errors:["time"]
                    })
                    if (question.type == "text" || question.type == "rating"){
                        responses.push({label:question.label,type:question.type,answer:collector.first()?.content ?? null})
                    }else if (question.type == "image"){
                        responses.push({label:question.label,type:question.type,answer:collector.first()?.attachments.first() ?? null,allowGifs:question.allowGifs})
                    }else if (question.type == "attachment"){
                        responses.push({label:question.label,type:question.type,answer:collector.first()?.attachments.first() ?? null,allowExecutables:question.allowExecutables,allowZipFiles:question.allowZipFiles})
                    }else if (question.type == "choice"){
                        responses.push({label:question.label,type:question.type,answer:question.choices[transformToChoice(question.choiceOrdering,collector.first()?.content ?? "")],choiceOrdering:question.choiceOrdering,choices:question.choices})
                    }
        
                    //update the status embed
                    const newStatusQuestions: OTFeedbackConfigAnsweredValidQuestion[] = config.data.questions.map((value) => {
                        if (value.type == "image") return {label:value.label,type:value.type,allowGifs:value.allowGifs,answer:null}
                        else if (value.type == "attachment") return {label:value.label,type:value.type,allowZipFiles:value.allowZipFiles,allowExecutables:value.allowExecutables,answer:null}
                        else if (value.type == "choice") return {label:value.label,type:value.type,choiceOrdering:value.choiceOrdering,choices:value.choices,answer:null}
                        else return {label:value.label,type:value.type,answer:null}
                    })
                    responses.forEach((res,index) => {
                        newStatusQuestions[index] = res
                    })
                    await statusResult.message.edit((await opendiscord.builders.messages.getSafe("ot-feedback:response").build("other",{questions:newStatusQuestions})).message)
                
                }catch (err){
                    //send canceled
                    await opendiscord.client.sendUserDm(creator,await opendiscord.builders.messages.getSafe("ot-feedback:canceled").build("other",{question}))    
                    opendiscord.log(creator.displayName+" didn't respond in time for the feedback!","plugin",[
                        {key:"user",value:creator.username},
                        {key:"userid",value:creator.id,hidden:true},
                        {key:"question",value:question.label,hidden:true},
                        {key:"type",value:question.type,hidden:true},
                    ])
                }
            }
            
            //send completed
            await opendiscord.client.sendUserDm(creator,await opendiscord.builders.messages.getSafe("ot-feedback:completed").build("other",{responses}))
            if (config.data.sendWebhookWhenEmpty || !responses.every((r) => r.answer === null)) await reviewWebhook.send((await opendiscord.builders.messages.getSafe("ot-feedback:overview").build("other",{questions:responses,ticket,user:creator,channelName})).message)

            //update stats
            if (!responses.every((r) => r.answer === null)) await opendiscord.stats.get("opendiscord:global").setStat("ot-feedback:feedback-created",1,"increase")
            
            await opendiscord.events.get("ot-feedback:afterFeedback").emit([responses])
        })
    }

    //ACTIVATE FEEDBACK SYSTEM (doesn't block process => utilities.runAsync())
    opendiscord.events.get("onTicketClose").listen((ticket,closer,channel) => {
        //handle close count
        if (!ticket.exists("ot-feedback:close-count")){
            ticket.add(new api.ODTicketData("ot-feedback:close-count",0))
        }
        const closeCount = ticket.get("ot-feedback:close-count")
        
        //handle close
        if (config.data.trigger == "close") feedbackHandler(ticket,closer,channel)
        if (config.data.trigger == "first-close-only" && closeCount.value === 0) feedbackHandler(ticket,closer,channel)
        
        //increase close count
        closeCount.value = closeCount.value+1
    })
    if (config.data.trigger == "delete") opendiscord.events.get("onTicketDelete").listen(feedbackHandler)
})

//REGISTER CLOSE COUNT
opendiscord.events.get("afterCodeExecuted").listen(() => {
    opendiscord.tickets.loopAll((ticket) => {
        if (!ticket.exists("ot-feedback:close-count")){
            ticket.add(new api.ODTicketData("ot-feedback:close-count",0))
        }
    })
})
opendiscord.events.get("afterTicketCreated").listen((ticket) => {
    if (!ticket.exists("ot-feedback:close-count")){
        ticket.add(new api.ODTicketData("ot-feedback:close-count",0))
    }
})

//REGISTER NEW STATISTIC
opendiscord.events.get("onStatLoad").listen((stats) => {
    stats.get("opendiscord:global").add(new api.ODBasicStat("ot-feedback:feedback-created",0,"Feedback Created",0))
})