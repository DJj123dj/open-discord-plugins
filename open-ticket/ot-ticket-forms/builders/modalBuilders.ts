import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"

// MODALS
openticket.events.get("onModalBuilderLoad").listen((modals) => {
    modals.add(new api.ODModal("ot-ticket-forms:questions-modal"))
    modals.get("ot-ticket-forms:questions-modal").workers.add(
        new api.ODWorker("ot-ticket-forms:questions-modal",0,async (instance,params,source) => {
            const { formId, sessionId, formName, questions, currentSection, totalSections } = params;

            const questionsId = questions.map((q) => `${q.position}/${q.optional ? 0 : 1}`).join('-');

            instance.setCustomId(`ot-ticket-forms:qm_${formId}_${sessionId}_${questionsId}`); 
            instance.setTitle(`${formName} - ${currentSection}/${totalSections}`);
            for (const question of questions) {
                instance.addQuestion({
                    customId:`${question.position}`,
                    label:question.question,
                    style:question.type,
                    required:!question.optional,
                    placeholder:question.placeholder ? question.placeholder : undefined,
                });
            }
        })
    )
});