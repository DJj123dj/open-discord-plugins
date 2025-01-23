import { api, openticket } from "#opendiscord";
import { formsConfigStructure } from "./checkerStructures";

// CONFIG REGISTRATION
openticket.events.get("onConfigLoad").listen((configManager) => {
    configManager.add(new api.ODJsonConfig("ot-forms:config", "config.json", "./plugins/ot-forms/"));
});

// CHECKER REGISTRATION
openticket.events.get("onCheckerLoad").listen((checkerManager) => {
    const config = openticket.configs.get("ot-forms:config");
    checkerManager.add(new api.ODChecker("ot-forms:config",checkerManager.storage,0,config,formsConfigStructure)); 
});