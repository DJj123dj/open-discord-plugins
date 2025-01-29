import { api, openticket } from "#opendiscord";
import { formsConfigStructure } from "./checkerStructures";

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configManager) => {
    configManager.add(new api.ODJsonConfig("ot-ticket-forms:config", "config.json", "./plugins/ot-forms/"));
});

//REGISTER CHECKER
openticket.events.get("onCheckerLoad").listen((checkerManager) => {
    const config = openticket.configs.get("ot-ticket-forms:config");
    checkerManager.add(new api.ODChecker("ot-ticket-forms:config",checkerManager.storage,0,config,formsConfigStructure)); 
});