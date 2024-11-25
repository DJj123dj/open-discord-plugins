import * as discord from "discord.js"
import { api, openticket, utilities } from "../../src/index"

//DECLARATION
class OTFeedbackConfig extends api.ODJsonConfig {
    declare data: {
        webhookUrl:string,
        questionsText:string,
        completedText:string,
        canceledText:string,
        questions:{label:string,type:"rating"|"text"}[]
    }
}
declare module "../../src/core/api/api.js" {
    export interface ODConfigManagerIds_Default {
        "ot-feedback:config": OTFeedbackConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-feedback:config": api.ODChecker
    }
    export interface ODEmbedManagerIds_Default {
        "ot-feedback:response": {source:"other",params:{questions:{label:string,type:"text"|"rating",answer:null|string}[]},workers:"ot-feedback:response"}
        "ot-feedback:overview": {source:"other",params:{ticket:api.ODTicket,user:discord.User,questions:{label:string,type:"text"|"rating",answer:null|string}[]},workers:"ot-feedback:overview"}
    }
    export interface ODMessageManagerIds_Default {
        "ot-feedback:response": {source:"other",params:{questions:{label:string,type:"text"|"rating",answer:null|string}[]},workers:"ot-feedback:response"}
        "ot-feedback:question": {source:"other",params:{question:{label:string,type:"text"|"rating"}},workers:"ot-feedback:question"}
        "ot-feedback:completed": {source:"other",params:{responses:{label:string,type:"text"|"rating",answer:null|string}[]},workers:"ot-feedback:completed"}
        "ot-feedback:canceled": {source:"other",params:{question:{label:string,type:"text"|"rating"}},workers:"ot-feedback:canceled"}
        "ot-feedback:overview": {source:"other",params:{ticket:api.ODTicket,user:discord.User,questions:{label:string,type:"text"|"rating",answer:null|string}[]},workers:"ot-feedback:overview"}
    }
    export interface ODEventIds_Default {
        "ot-feedback:onFeedback":api.ODEvent_Default<(questions:{label:string,type:"rating"|"text"}[]) => api.ODPromiseVoid>
        "ot-feedback:afterFeedback":api.ODEvent_Default<(responses:{label:string,type:"text"|"rating",answer:null|string}[]) => api.ODPromiseVoid>
    }
}

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTFeedbackConfig("ot-feedback:config","config.json","./plugins/ot-feedback/"))
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-feedback:config")
    const structure = new api.ODCheckerObjectStructure("ot-feedback:config",{children:[
        {key:"webhookUrl",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-feedback:webhook-url",false,{allowHttp:false,allowedHostnames:["discord.com"],allowedPaths:[/^\/api\/webhooks\/\d+\/[A-Za-z0-9_\.\-]+$/]})},
        {key:"questionsText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:questions-text",{maxLength:2048})},
        {key:"completedText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:completed-text",{maxLength:2048})},
        {key:"canceledText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:canceled-text",{maxLength:2048})},
        {key:"questions",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-feedback:questions",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-feedback:question",{children:[
            {key:"type",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-type",{choices:["rating","text"]})},
            {key:"label",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-feedback:question-label",{minLength:1,maxLength:200})}
        ]})})},
    ]})
    checkers.add(new api.ODChecker("ot-feedback:config",checkers.storage,0,config,structure))
})

//REGISTER EMBEDS
openticket.events.get("onEmbedBuilderLoad").listen((embeds) => {
    const config = openticket.configs.get("ot-feedback:config")
    const generalConfig = openticket.configs.get("openticket:general")

    embeds.add(new api.ODEmbed("ot-feedback:response"))
    embeds.get("ot-feedback:response").workers.add(new api.ODWorker("ot-feedback:response",0,(instance,params,source,cancel) => {
        instance.setTitle(utilities.emojiTitle("📢","Feedback"))
        instance.setFooter("Please answer the questions above!")
        instance.setColor(generalConfig.data.mainColor)
        if (config.data.questionsText) instance.setDescription(config.data.questionsText)
        
        instance.setFields(params.questions.map((question) => {
            if (typeof question.answer != "string"){
                //unanswered
                return {name:utilities.emojiTitle("🔴",question.label),inline:false,value:"*Awaiting Response...*"}
            }else if (question.type == "rating" && !isNaN(Number(question.answer))){
                //answered (rating)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:":star:".repeat(Number(question.answer))}
            }else{
                //answered (text)
                return {name:utilities.emojiTitle("🟢",question.label),inline:false,value:(question.answer.length > 0 ? question.answer : "/")}
            }
        }))
    }))

    embeds.add(new api.ODEmbed("ot-feedback:overview"))
    embeds.get("ot-feedback:overview").workers.add(new api.ODWorker("ot-feedback:overview",0,async (instance,params,source,cancel) => {
        const {questions,ticket,user} = params

        const channel = await openticket.tickets.getTicketChannel(ticket)
        if (!channel) throw new api.ODPluginError("Unable to find ticket while creating feedback overview!")

        instance.setTitle(utilities.emojiTitle("📢","Feedback Received"))
        instance.setAuthor(user.displayName,user.displayAvatarURL())
        instance.setColor(generalConfig.data.mainColor)
        instance.setDescription("There is new feedback available from "+discord.userMention(user.id)+"!")
        instance.setFooter("Ticket: #"+channel.name)

        instance.setFields(questions.map((question) => {
            if (typeof question.answer != "string"){
                //unanswered
                return {name:question.label,inline:false,value:"/"}
            }else if (question.type == "rating" && !isNaN(Number(question.answer))){
                //answered (rating)
                return {name:question.label,inline:false,value:":star:".repeat(Number(question.answer))}
            }else{
                //answered (text)
                return {name:question.label,inline:false,value:(question.answer.length > 0 ? question.answer : "/")}
            }
        }))
    }))
})

//REGISTER MESSAGES
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    const config = openticket.configs.get("ot-feedback:config")

    messages.add(new api.ODMessage("ot-feedback:response"))
    messages.get("ot-feedback:response").workers.add(new api.ODWorker("ot-feedback:response",0,async (instance,params,source) => {
        instance.addEmbed(await openticket.builders.embeds.getSafe("ot-feedback:response").build(source,params))
    }))

    messages.add(new api.ODMessage("ot-feedback:question"))
    messages.get("ot-feedback:question").workers.add(new api.ODWorker("ot-feedback:question",0,async (instance,params,source) => {
        const ratingText = (params.question.type == "rating") ? "\n-# Please give a number from 1 to 10." : ""
        instance.setContent("**"+params.question.label+"**"+ratingText)
    }))

    messages.add(new api.ODMessage("ot-feedback:completed"))
    messages.get("ot-feedback:completed").workers.add(new api.ODWorker("ot-feedback:completed",0,async (instance,params,source) => {
        instance.setContent("**"+config.data.completedText+"**")
    }))

    messages.add(new api.ODMessage("ot-feedback:canceled"))
    messages.get("ot-feedback:canceled").workers.add(new api.ODWorker("ot-feedback:canceled",0,async (instance,params,source) => {
        instance.setContent("**"+config.data.canceledText+"**")
    }))

    messages.add(new api.ODMessage("ot-feedback:overview"))
    messages.get("ot-feedback:overview").workers.add(new api.ODWorker("ot-feedback:overview",0,async (instance,params,source) => {
        instance.addEmbed(await openticket.builders.embeds.getSafe("ot-feedback:overview").build(source,params))
    }))
})

//WAIT UNTIL BOT READY
openticket.events.get("onReadyForUsage").listen(() => {
    const config = openticket.configs.get("ot-feedback:config")
    const reviewWebhook = new discord.WebhookClient({url:config.data.webhookUrl})

    //LISTEN ON TICKET CLOSE (but don't block the process)
    openticket.events.get("afterTicketClosed").listen((ticket) => {
        utilities.runAsync(async () => {
            //add some delay so that the message arrives after the default close message
            await utilities.timer(2000)

            const creator = await openticket.tickets.getTicketUser(ticket, "creator");
            if (!creator) throw new api.ODPluginError("Couldn't find ticket creator on ticket close!")
        
            //send initial message
            const statusQuestions = config.data.questions.map((value) => {
                return {label:value.label,type:value.type,answer:null}
            })
            const statusResult = await openticket.client.sendUserDm(creator,await openticket.builders.messages.getSafe("ot-feedback:response").build("other",{questions:statusQuestions}))
            if (!statusResult.message) throw new api.ODPluginError("Unable to send OT Feedback status message!")
            
            openticket.log(creator.displayName+" is now able to fill-in the feedback!","info",[
                {key:"user",value:creator.username},
                {key:"userid",value:creator.id,hidden:true},
                {key:"questions",value:config.data.questions.length.toString()}
            ])

            await openticket.events.get("ot-feedback:onFeedback").emit([config.data.questions])
            
            //loop over each question and ask ticket creator
            const responses: {label:string,type:"text"|"rating",answer:null|string}[] = []
            for (const question of config.data.questions) {
                //send question
                await openticket.client.sendUserDm(creator,await openticket.builders.messages.getSafe("ot-feedback:question").build("other",{question}))
        
                try{
                    const collector = await (await creator.createDM()).awaitMessages({
                        filter:(response) => (response.author.id == creator.id && (question.type == "text" || /^[1-9]$|^10$/.test(response.content))),
                        max:1,
                        time:60000, //60 seconds
                        errors:["time"]
                    })
                    responses.push({label:question.label,type:question.type,answer:collector.first()?.content ?? null})
        
                    //update the status embed
                    const newStatusQuestions: {label:string,type:"text"|"rating",answer:null|string}[] = config.data.questions.map((value) => {
                        return {label:value.label,type:value.type,answer:null}
                    })
                    responses.forEach((res,index) => {
                        newStatusQuestions[index] = res
                    })
                    await statusResult.message.edit((await openticket.builders.messages.getSafe("ot-feedback:response").build("other",{questions:newStatusQuestions})).message)
                
                }catch (err){
                    //send canceled
                    await openticket.client.sendUserDm(creator,await openticket.builders.messages.getSafe("ot-feedback:canceled").build("other",{question}))    
                    openticket.log(creator.displayName+" didn't respond in time for the feedback!","info",[
                        {key:"user",value:creator.username},
                        {key:"userid",value:creator.id,hidden:true},
                        {key:"question",value:question.label,hidden:true},
                        {key:"type",value:question.type,hidden:true},
                    ])
                }
            }
            
            //send completed
            await openticket.client.sendUserDm(creator,await openticket.builders.messages.getSafe("ot-feedback:completed").build("other",{responses}))   
            await reviewWebhook.send((await openticket.builders.messages.getSafe("ot-feedback:overview").build("other",{questions:responses,ticket,user:creator})).message)

            await openticket.events.get("ot-feedback:afterFeedback").emit([responses])
        })
    })
})