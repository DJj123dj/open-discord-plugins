import { api, opendiscord } from "#opendiscord";
import { formsConfigStructure } from "./checkerStructures";

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configManager) => {
    configManager.add(new api.ODJsonConfig("ot-ticket-forms:config", "config.json", "./plugins/ot-forms/"));
});

//REGISTER CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkerManager) => {
    const config = opendiscord.configs.get("ot-ticket-forms:config");
    checkerManager.add(new api.ODChecker("ot-ticket-forms:config",checkerManager.storage,0,config,formsConfigStructure)); 
});